from datetime import datetime, timezone

from django.views.decorators.http import require_POST, require_http_methods, require_GET

from common.validation import *
from .util import *


@require_POST
@require_admin
@require_iteration
@accepts_json_data(DictionaryType({
    "title": StringType(1, 64),
    "message": StringType()
}))
def create_announcement(req, data, iteration):
    announcement = Announcement.objects.create(
        iteration=iteration,
        title=data["title"],
        message=data["message"],
        created_at=datetime.now(tz=timezone.utc)
    )
    return success(announcement.serialize())


@require_GET
@require_admin
@require_iteration
def get_batches(req, iteration):
    batches = AchievementBatch.objects.filter(iteration=iteration).all()
    return success([batch.serialize() for batch in batches])


@require_POST
@require_admin
@require_iteration
@accepts_json_data(DictionaryType({
    "release_time": IntegerType()
}))
def create_batch(req, data, iteration):
    batch = AchievementBatch.objects.create(
        iteration=iteration,
        release_time=datetime.fromtimestamp(data["release_time"], tz=timezone.utc)
    )
    return success(batch.serialize())


@require_http_methods(["PATCH"])
@require_admin
@require_achievement()
@accepts_json_data(DictionaryType({
    "batch_id": IntegerType(),
}))
def change_achievement_batch(req, data, achievement):
    batch = AchievementBatch.objects.filter(id=data["batch_id"]).first()
    if batch is None:
        return error("Invalid batch id")

    achievement.batch = batch
    achievement.save()

    return success(achievement.serialize(includes=["batch"]))
