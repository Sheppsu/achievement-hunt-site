from django.views.decorators.http import require_POST, require_GET, require_http_methods
from django.conf import settings

from ..models import *
from .util import error, success, accepts_json_data
from common.serializer import SerializableField
from common.validation import *

from datetime import datetime, timezone


__all__ = ("achievements",)


discord_logger = settings.DISCORD_LOGGER


def require_staff(func):
    def wrapper(req, *args, **kwargs):
        if not req.user.is_authenticated or (not req.user.is_admin and not req.user.is_achievement_creator):
            return error("Unauthorized", status=403)

        return func(req, *args, **kwargs)

    return wrapper


def require_achievement(select: list | None = None, prefetch: list | None = None):
    def decorator(func):
        def wrapper(req, *args, **kwargs):
            achievement_id = kwargs.pop("achievement_id", None)
            if achievement_id is None:
                return error("Invalid achievement id")

            achievement = Achievement.objects.filter(id=achievement_id)

            if select is not None:
                achievement.select_related(*select)

            if prefetch is not None:
                achievement.prefetch_related(*prefetch)

            achievement = achievement.first()

            if achievement is None:
                return error("Invalid achievement id")

            return func(req, *args, achievement=achievement, **kwargs)

        return wrapper

    return decorator


def serialize_full_achievement(req, achievement: Achievement):
    return achievement.serialize(
        includes=[
            "comments__user",
            "beatmaps__info",
            "solution",
            "creator",
            SerializableField(
                "votes",
                serial_key="has_voted",
                post_transform=lambda votes: any((v["user_id"] == req.user.id for v in votes))
            ),
            SerializableField(
                "votes",
                serial_key="vote_count",
                post_transform=lambda votes: len(votes)
            )
        ]
    )


@require_staff
@require_GET
def achievements(req):
    return success(
        [
            serialize_full_achievement(req, achievement)
            for achievement in Achievement.objects.prefetch_related(
                "comments__user",
                "votes",
                "beatmaps__info"
            ).select_related(
                "creator"
            ).filter(
                batch_id=None
            ).all()
        ]
    )


@require_staff
@require_GET
@require_achievement(
    select=["creator"],
    prefetch=["comments__user", "votes", "beatmaps__info"]
)
def show_achievement(req, achievement):
    return success(serialize_full_achievement(req, achievement))


@require_staff
@require_POST
@require_achievement()
@accepts_json_data(
    DictionaryType({"msg": StringType(min_length=1, max_length=4096)})
)
def create_comment(req, data, achievement):
    comment = AchievementComment.objects.create(
        achievement=achievement,
        user=req.user,
        msg=data["msg"],
        posted_at=datetime.now(tz=timezone.utc)
    )

    discord_logger.submit_comment(comment)

    return success(comment.serialize(includes=["user"]))


@require_staff
@require_POST
@require_achievement()
@accepts_json_data(
    DictionaryType({"add": BoolType()})
)
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
    DictionaryType({
        "name": StringType(min_length=1, max_length=128),
        "description": StringType(min_length=1, max_length=2048),
        "solution": StringType(max_length=2048),
        "tags": StringType(max_length=128),
        "beatmaps": ListType(
            DictionaryType({
                "id": IntegerType(),
                "hide": BoolType()
            }),
            unique=True,
            unique_check=lambda a, b: a["id"] != b["id"]
        )
    })
)
def create_achievement(req, data, achievement=None):
    beatmaps = data["beatmaps"]
    if len(beatmaps) > 0:
        beatmaps = [
            (beatmap, next((item["hide"] for item in beatmaps if item["id"] == beatmap.id)))
            for beatmap in BeatmapInfo.bulk_get_or_create(
                [beatmap["id"] for beatmap in beatmaps]
            )
        ]

    if achievement is None:
        achievement = Achievement.objects.create(
            name=data["name"],
            description=data["description"],
            solution=data["solution"],
            tags=data["tags"],
            creator=req.user,
            created_at=(date_now := datetime.now(tz=timezone.utc)),
            last_edited_at=date_now
        )
        discord_logger.submit_achievement(achievement)
    elif achievement.creator_id != req.user.id:
        return error("cannot edit an achievement that's not yours")
    else:
        achievement.name = data["name"]
        achievement.description = data["description"]
        achievement.solution = data["solution"]
        achievement.tags = data["tags"]
        achievement.last_edited_at = datetime.now(tz=timezone.utc)
        achievement.save()
        discord_logger.submit_achievement(achievement, edited=True)

    resp_beatmaps = []

    for connection in BeatmapConnection.objects.filter(achievement_id=achievement.id):
        if not any((info.id == connection.info_id for info, _ in beatmaps)):
            connection.delete()

    for info, hide in beatmaps:
        obj, _ = BeatmapConnection.objects.update_or_create(
            achievement=achievement,
            info=info,
            defaults={"hide": hide}
        )
        resp_beatmaps.append(obj.serialize(includes=["info"]))

    resp_data = achievement.serialize(includes=["creator", "solution"])
    resp_data["beatmaps"] = resp_beatmaps

    return success(resp_data)


@require_achievement(select=["creator"])
def edit_achievement(req, achievement):
    return create_achievement(req, achievement=achievement)


@require_staff
@require_http_methods(["DELETE"])
@require_achievement()
def delete_achievement(req, achievement):
    if achievement.creator_id != req.user.id:
        return error("cannot delete an achievement that's not yours")

    achievement.delete()
    return success(None)
