from django.views.decorators.http import require_POST, require_GET, require_http_methods
from django.conf import settings

from .util import *
from common.serializer import SerializableField
from common.validation import *
from common import comm

from playtest.models import PlaytestAccount

from datetime import datetime, timezone


__all__ = ("achievements",)


discord_logger = settings.DISCORD_LOGGER
COMMENT_CHANNELS = ["General", "Solving"]


def serialize_full_achievement(req, achievement: Achievement):
    return achievement.serialize(
        includes=[
            "comments__user",
            "beatmaps__info",
            "solution",
            "creator",
            "batch",
            "solution_algorithm",
            "algorithm_enabled",
            "staff_solved",
            SerializableField(
                "votes",
                serial_key="has_voted",
                post_transform=lambda votes: any((v["user_id"] == req.user.id for v in votes)),
            ),
            SerializableField("votes", serial_key="vote_count", post_transform=lambda votes: len(votes)),
        ]
    )


@require_staff
@require_iteration
@require_GET
def achievements(req, iteration):
    batch = req.GET.get("batch", "0")
    if batch not in ("0", "1"):
        return error("Invalid value for batch")

    batch = int(batch) == 1

    query = Achievement.objects.prefetch_related(
        models.Prefetch("comments", AchievementComment.objects.select_related("user").filter(deleted_at=None)),
        models.Prefetch("beatmaps", BeatmapConnection.objects.select_related("info")),
        "votes",
    ).select_related("creator", "batch")

    if batch:
        query = query.filter(batch_id__isnull=False, batch__iteration_id=iteration.id)
    else:
        query = query.filter(batch_id__isnull=True)

    return success([serialize_full_achievement(req, achievement) for achievement in query.all()])


@require_staff
@require_GET
@require_achievement(select=["creator"], prefetch=["comments__user", "votes", "beatmaps__info"])
def show_achievement(req, achievement):
    return success(serialize_full_achievement(req, achievement))


@require_staff
@require_POST
@require_achievement()
@accepts_json_data(
    DictionaryType(
        {"msg": StringType(min_length=1, max_length=4096), "channel": IntegerType(0, len(COMMENT_CHANNELS) - 1)}
    )
)
def create_comment(req, data, achievement):
    comment = AchievementComment.objects.create(
        achievement=achievement,
        user=req.user,
        msg=data["msg"],
        posted_at=datetime.now(tz=timezone.utc),
        channel=data["channel"],
    )

    discord_logger.submit_comment(comment, COMMENT_CHANNELS[comment.channel])

    return success(comment.serialize(includes=["user"]))


@require_staff
@require_POST
@accepts_json_data(
    DictionaryType(
        {"msg": StringType(min_length=1, max_length=4096)},
    )
)
def edit_comment(req, data, comment_id):
    comment = AchievementComment.objects.select_related("user").filter(id=comment_id).first()
    if comment is None:
        return error("Comment not found", status=404)
    if comment.user_id != req.user.id:
        return error("You can't edit this comment", status=403)

    comment.edited_at = datetime.now(tz=timezone.utc)
    comment.msg = data["msg"]
    comment.save()

    return success(comment.serialize(includes=["achievement_id", "user"]))


@require_staff
@require_http_methods(["DELETE"])
def delete_comment(req, comment_id):
    comment = AchievementComment.objects.select_related("user").filter(id=comment_id).first()
    if comment is None:
        return error("Comment not found", status=404)
    if comment.user_id != req.user.id and not req.user.is_admin:
        return error("You can't delete this comment", status=403)

    comment.deleted_at = datetime.now(tz=timezone.utc)
    comment.save()

    return success(comment.serialize(includes=["achievement_id", "user"]))


@require_staff
@require_POST
@require_achievement()
@accepts_json_data(DictionaryType({"add": BoolType()}))
def vote_achievement(req, data, achievement):
    add_vote = data["add"]

    if req.user.id == achievement.creator_id:
        return error("Can't vote for your own achievement!")

    existing_vote = AchievementVote.objects.filter(achievement_id=achievement.id, user_id=req.user).first()

    if add_vote and existing_vote is not None:
        return error("Already voted this achievement")

    if not add_vote and existing_vote is None:
        return error("No vote to remove")

    if add_vote:
        AchievementVote.objects.create(achievement=achievement, user=req.user)
    else:
        existing_vote.delete()

    return success({"added": add_vote})


@require_staff
@require_POST
@accepts_json_data(
    DictionaryType(
        {
            "name": StringType(min_length=1, max_length=128),
            "description": StringType(min_length=1, max_length=2048),
            "solution": StringType(max_length=2048),
            "tags": StringType(max_length=128),
            "beatmaps": ListType(
                DictionaryType({"id": IntegerType(), "hide": BoolType()}),
                unique=True,
                unique_check=lambda a, b: a["id"] != b["id"],
            ),
            "solution_algorithm": AnyType(),
            "algorithm_enabled": BoolType(),
        }
    )
)
def create_achievement(req, data, achievement=None):
    beatmaps = data["beatmaps"]
    if len(beatmaps) > 0:
        beatmap_objs = BeatmapInfo.bulk_get_or_create([beatmap["id"] for beatmap in beatmaps])
        if beatmap_objs is None:
            return error("invalid beatmap id")

        beatmaps = [
            (beatmap, next((item["hide"] for item in beatmaps if item["id"] == beatmap.id))) for beatmap in beatmap_objs
        ]

    if achievement is None:
        achievement = Achievement.objects.create(
            name=data["name"],
            description=data["description"],
            solution=data["solution"],
            tags=data["tags"],
            creator=req.user,
            created_at=(date_now := datetime.now(tz=timezone.utc)),
            last_edited_at=date_now,
            solution_algorithm=data["solution_algorithm"],
            algorithm_enabled=data["algorithm_enabled"],
        )
        discord_logger.submit_achievement(req, achievement, "created")
    elif achievement.creator_id != req.user.id and not req.user.is_admin:
        return error("cannot edit an achievement that's not yours")
    else:
        if achievement.batch_id is not None and not req.user.is_admin:
            return error("only admins can edit achievements when the release is set")

        achievement.name = data["name"]
        achievement.description = data["description"]
        achievement.solution = data["solution"]
        achievement.tags = data["tags"]
        achievement.last_edited_at = datetime.now(tz=timezone.utc)
        achievement.solution_algorithm = data["solution_algorithm"]
        achievement.algorithm_enabled = data["algorithm_enabled"]
        achievement.save()

        discord_logger.submit_achievement(req, achievement, "edited")

    comm.refresh_achievements_on_server()

    resp_beatmaps = []

    for connection in BeatmapConnection.objects.filter(achievement_id=achievement.id):
        if not any((info.id == connection.info_id for info, _ in beatmaps)):
            connection.delete()

    for info, hide in beatmaps:
        obj, _ = BeatmapConnection.objects.update_or_create(achievement=achievement, info=info, defaults={"hide": hide})
        resp_beatmaps.append(obj.serialize(includes=["info"]))

    resp_data = achievement.serialize(
        includes=["creator", "solution", "batch", "solution_algorithm", "algorithm_enabled"]
    )
    resp_data["beatmaps"] = resp_beatmaps

    return success(resp_data)


@require_achievement(select=["creator"])
def edit_achievement(req, achievement):
    return create_achievement(req, achievement=achievement)


@require_staff
@require_http_methods(["DELETE"])
@require_achievement()
def delete_achievement(req, achievement):
    if achievement.creator_id != req.user.id and not req.user.is_admin:
        return error("cannot delete an achievement that's not yours")

    achievement.delete()
    comm.refresh_achievements_on_server()
    return success(None)


@require_POST
@require_achievement()
@accepts_json_data(DictionaryType({"solved": BoolType()}))
def mark_as_solved(req, achievement, data):
    if achievement.creator_id != req.user.id and not req.user.is_admin:
        return error("cannot mark this achievement solved", status=403)

    achievement.staff_solved = data["solved"]
    achievement.save()

    discord_logger.submit_achievement(req, achievement, "solved" if achievement.staff_solved else "unsolved")

    return success({"achievement_id": achievement.id, "solved": achievement.staff_solved})


@require_GET
@require_staff
@require_iteration
def get_batches(req, iteration):
    batches = AchievementBatch.objects.filter(iteration=iteration).all()
    return success([batch.serialize() for batch in batches])


@require_GET
@require_staff
def get_playtest_passkey(req):
    account = PlaytestAccount.objects.filter(user_id=req.user.id).first()
    if account is None:
        account = PlaytestAccount.from_user(req.user)
        account.save()
    else:
        account.passkey = PlaytestAccount.generate_passkey()
        account.save()

    return success({"passkey": account.passkey})


@require_GET
@require_staff
def request_algorithm_docs(req):
    return success(comm.request_algorithm_docs())
