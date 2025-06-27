from datetime import datetime, timezone
import csv
import io

from django.views.decorators.http import require_POST, require_http_methods, require_GET
from django.contrib.auth import login as do_login
from django.shortcuts import redirect
from django.http.response import HttpResponse

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


@require_admin
@require_GET
def login_to_user(req):
    user_id = req.GET.get("user_id")
    user = User.objects.get(id=user_id)
    do_login(req, user, backend=settings.AUTH_BACKEND)
    return redirect("index")


@require_admin
@require_iteration
@require_GET
def get_screening_info(req, iteration):
    players = Player.objects.select_related("team").filter(team__iteration_id=iteration.id).all()
    registrations = Registration.objects.select_related("user").filter(iteration_id=iteration.id).all()

    def get_team_name(user_id: int):
        return next((player.team.name for player in players if player.user_id == user_id), "Free agent")

    content = io.StringIO()
    writer = csv.writer(content)

    for reg in registrations:
        writer.writerow([reg.user.username, get_team_name(reg.user.id), reg.user.id])

    response = HttpResponse(content.getvalue(), content_type="text/csv")
    response["Content-Disposition"] = "attachment; filename=\"screening.csv\""
    return response
