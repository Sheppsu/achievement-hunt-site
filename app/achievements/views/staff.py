from django.views.decorators.http import require_POST, require_GET, require_http_methods

from ..models import Achievement, AchievementComment, AchievementVote, BeatmapInfo
from .util import error, success, require_valid_data
from common.serializer import SerializableField

from datetime import datetime, timezone


__all__ = ("achievements",)


def require_staff(func):
    def wrapper(req, *args, **kwargs):
        if not req.user.is_authenticated or (not req.user.is_admin and not req.user.is_achievement_creator):
            return error("Unauthorized", status=403)

        return func(req, *args, **kwargs)

    return wrapper


@require_staff
@require_GET
def achievements(req):
    return success(
        [
            achievement.serialize(
                includes=[
                    "comments__user",
                    "beatmap",
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
            for achievement in Achievement.objects.prefetch_related(
                "comments__user",
                "votes"
            ).select_related(
                "beatmap",
                "creator"
            ).filter(
                batch_id=None
            ).all()
        ]
    )


def require_achievement(func):
    def wrapper(req, *args, **kwargs):
        achievement_id = kwargs.pop("achievement_id", None)
        if achievement_id is None:
            return error("Invalid achievement id")

        achievement = Achievement.objects.filter(id=achievement_id).first()
        if achievement is None:
            return error("Invalid achievement id")

        return func(req, *args, achievement=achievement, **kwargs)

    return wrapper


@require_staff
@require_POST
@require_achievement
@require_valid_data("msg")
def create_comment(req, data, achievement):
    msg = data["msg"]

    if not isinstance(msg, str) or len(msg) > 4096:
        return error("invalid msg")

    comment = AchievementComment.objects.create(
        achievement=achievement,
        user=req.user,
        msg=data["msg"],
        posted_at=datetime.now(tz=timezone.utc)
    )

    return success(comment.serialize(includes=["user"]))


@require_staff
@require_POST
@require_achievement
@require_valid_data("add")
def vote_achievement(req, data, achievement):
    add_vote = data["add"]

    if req.user.id == achievement.creator.id:
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
@require_valid_data(
    "name",
    "description",
    "solution",
    "tags"
)
def create_achievement(req, data, achievement=None):
    name, description, solution, tags = data["name"], data["description"], data["solution"], data["tags"]
    if not isinstance(name, str) or len(name) == 0 or len(name) > 128:
        return error("invalid name length")
    if not isinstance(description, str) or len(description) == 0 or len(description) > 2048:
        return error("invalid description length")
    if not isinstance(solution, str) or len(solution) > 2048:
        return error("solution length too big")
    if not isinstance(tags, str) or len(tags) > 128:
        return error("invalid tags length")

    beatmap = data.get("beatmap_id", None)
    if beatmap is not None:
        if not isinstance(beatmap, int):
            return error("invalid beatmap_id type")

        beatmap = BeatmapInfo.get_or_create(beatmap)
        if beatmap is None:
            return error("invalid beatmap_id")

    if achievement is None:
        achievement = Achievement.objects.create(
            name=name,
            description=description,
            solution=solution,
            tags=tags,
            beatmap=beatmap,
            creator=req.user,
            created_at=(date_now := datetime.now(tz=timezone.utc)),
            last_edited_at=date_now
        )
    elif achievement.creator_id != req.user.id:
        return error("cannot edit an achievement that's not yours")
    else:
        achievement.name = name
        achievement.description = description
        achievement.solution = solution
        achievement.tags = tags
        achievement.beatmap = beatmap
        achievement.last_edited_at = datetime.now(tz=timezone.utc)
        achievement.save()

    return success(achievement.serialize(includes=["creator", "beatmap", "solution"]))


@require_achievement
def edit_achievement(req, achievement):
    return create_achievement(req, achievement=achievement)


@require_staff
@require_http_methods(["DELETE"])
@require_achievement
def delete_achievement(req, achievement):
    if achievement.creator_id != req.user.id:
        return error("cannot delete an achievement that's not yours")

    achievement.delete()
    return success(None)
