from django.views.decorators.http import require_POST, require_GET
from django.db import models

from ..models import Achievement, AchievementComment, AchievementVote
from .util import error, success, parse_body


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
            achievement.serialize(includes=["comments__user", "beatmap", "vote_count"])
            for achievement in Achievement.objects.prefetch_related(
                "comments__user"
            ).select_related(
                "beatmap"
            ).annotate(
                vote_count=models.Count("votes")
            ).all()
        ]
    )


def require_achievement(func):
    def wrapper(req, *args, **kwargs):
        achievement_id = kwargs.get("achievement_id", None)
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
def create_comment(req, achievement):
    data = parse_body(req.body, ("msg",))

    comment = AchievementComment.objects.create(
        achievement=achievement,
        user=req.user,
        msg=data["msg"],
    )

    if not isinstance(comment, str) or len(comment) > 4096:
        return error("invalid comment string")

    return success(comment.serialize())


@require_staff
@require_POST
@require_achievement
def vote_achievement(req, achievement):
    data = parse_body(req.body, ("add",))
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

    return success(None)
