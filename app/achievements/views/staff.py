from django.views.decorators.http import require_POST, require_GET

from ..models import Achievement, AchievementComment, AchievementVote
from .util import error, success, require_valid_data
from common.serializer import SerializableField


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
                "beatmap"
            ).filter(
                release_time=None
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
    )

    return success(comment.serialize(includes=["user"]))


@require_staff
@require_POST
@require_achievement
@require_valid_data("add")
def vote_achievement(req, data, achievement):
    add_vote = data["add"]

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
