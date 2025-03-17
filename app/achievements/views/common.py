import base64
import random
import secrets
import struct
import time

from django.contrib.auth import login as do_login, logout as do_logout
from django.db.models.deletion import RestrictedError
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.shortcuts import redirect
from django.views.decorators.http import require_http_methods, require_POST

from nacl.secret import SecretBox

from ..models import *
from .util import error, success, require_valid_data
from common.serializer import SerializableField


__all__ = (
    "login",
    "logout",
    "teams",
    "achievements",
    "join_team",
    "leave_team",
    "create_team",
    "rename_team",
    "transfer_admin",
    "player_stats",
    "get_auth_packet"
)


EVENT_START, EVENT_END = settings.EVENT_START, settings.EVENT_END


def before_or_during_event(func):
    def wrapper(*args, **kwargs):
        if event_ended():
            return error("event ended")

        return func(*args, **kwargs)

    return wrapper


def serialize_team(team: Team):
    return team.serialize(includes=["players__user"])


def event_ended():
    return time.time() >= EVENT_END


def event_started():
    return time.time() >= EVENT_START-1


def select_teams(many=False, **kwargs) -> list[Team] | Team | None:
    teams = Team.objects.prefetch_related("players__user").filter(**kwargs)
    if many:
        return teams
    if len(teams) == 0:
        return
    return teams[0]


def login(req):
    code = req.GET.get("code", None)
    if code is not None:
        user = User.objects.create_user(code)
        if user is None:
            return HttpResponseBadRequest()
        do_login(req, user, backend=settings.AUTH_BACKEND)
    state = req.GET.get("state", None)
    return redirect(state or "index")


def logout(req):
    if req.user.is_authenticated:
        do_logout(req)
        return success({})
    return error("not logged in", status=403)


def achievements(req):
    if not event_started() and not settings.DEBUG:
        return error("cannot get achievements before event starts")

    team = (
        Team.objects.prefetch_related("players").filter(players__user=req.user).first()
        if req.user.is_authenticated else None
    )

    def team_completion(c) -> bool:
        return (
            any((player.id == c.player.id for player in team.players.all()))
            if team is not None else
            False
        )

    is_admin = req.user.is_authenticated and req.user.is_admin

    return success([
        achievement.serialize(
            ["beatmap", "completion_count", "completions__player__user", "completions__placement"]
            if event_ended() or is_admin else
            [
                "beatmap",
                "completion_count",
                SerializableField(
                    "completions",
                    post_serial_filter=lambda c: len(c) > 0
                ),
                SerializableField(
                    "completions__player",
                    condition=team_completion
                ),
                SerializableField(
                    "completions__time_completed",
                    condition=team_completion
                ),
                "completions__player__user",
                "completions__placement" if "competition" in achievement.tags.lower().split(",") else None
            ],
        )
        for achievement in Achievement.objects.select_related(
            "beatmap"
        ).prefetch_related(
            "completions__player__user",
            "completions__placement",
        ).annotate(
            completion_count=models.Count("completions"),
        ).exclude(
            release_time=None
        ).all()
    ])


def teams(req):
    if event_ended() or (req.user.is_authenticated and req.user.is_admin):
        serialized_teams = map(serialize_team, select_teams(many=True))
    else:
        serialized_teams = (
            serialize_team(team)
            if any(map(lambda p: p.user.id == req.user.id, team.players.all())) else
            team.serialize(excludes=["invite", "icon", "name"])
            for team in select_teams(many=True)
        )
    sorted_teams = sorted(serialized_teams, key=lambda t: t['points'], reverse=True)

    return success(sorted_teams)


@require_POST
@before_or_during_event
@require_valid_data("invite")
def join_team(req, data):
    if data["invite"] is None:
        return error("invalid invite")

    team = select_teams(invite=data["invite"])
    if team is None:
        return error("invalid invite")

    if len(team.players.all()) == 5:
        return error("That team is already full")

    player = Player.objects.filter(user_id=req.user.id).first()
    if player is not None:
        return error("already on a team")

    player = Player(user=req.user, team_id=team.id)
    player.save()
    team.players.add(player)

    return success(serialize_team(team))


@require_http_methods(["DELETE"])
@before_or_during_event
def leave_team(req):
    # TODO: maybe make this into a postgresql function
    team = None
    if req.user.is_authenticated:
        team = Team.objects.prefetch_related("players__user").filter(players__user_id=req.user.id).first()
    if team is None:
        return error("not on team")

    player: Player = next(filter(lambda player: player.user.id == req.user.id, team.players.all()))
    player_count = Player.objects.filter(team_id=team.id).count()
    try:
        if player_count == 1:
            team.delete()
        elif player.team_admin:
            return error("team admin can't leave team without transferring")
        else:
            player.delete()
    except RestrictedError:
        return error("Cannot leave a team after completing an achievement")
    return success(None)


@require_POST
@before_or_during_event
@require_valid_data("name")
def create_team(req, data):
    if (name := data["name"]) is None or len(name) == 0 or len(name) > 32:
        return error("invalid name")

    player = Player.objects.filter(user_id=req.user.id).first()
    if player is not None:
        return error("already on a team")

    try:
        invite = secrets.token_urlsafe(12)
        team = Team(name=name, icon="", invite=invite)
        team.save()
    except:
        return error("team name taken")

    player = Player(user=req.user, team_id=team.id, team_admin=True)
    player.save()

    team = team.serialize()
    player = player.serialize(includes=["user"])
    player["completions"] = []
    team["players"] = [player]
    return success(team)


@require_http_methods(["PATCH"])
@require_valid_data("newAdminId")
def transfer_admin(req, data):
    if event_ended():
        return error("event ended")

    if (userId := data["newAdminId"]) is None:
        return error("invalid user id")
    
    currentAdmin = Player.objects.filter(user_id=req.user.id).first()
    if currentAdmin is None or not currentAdmin.team_admin:
        return error("not on a team or not admin")
    
    newAdmin = Player.objects.filter(user_id=userId).first()
    if newAdmin is None or currentAdmin.team_id != newAdmin.team_id:
        return error("users not on the same team")
    
    currentAdmin.team_admin = False
    currentAdmin.save()

    newAdmin.team_admin = True
    newAdmin.save()

    return success({"prevAdminId": currentAdmin.user.id, "newAdminId": newAdmin.user.id})


@require_http_methods(["PATCH"])
@require_valid_data("name")
def rename_team(req, data):
    if event_ended():
        return error("event ended")

    if (name := data["name"]) is None or len(name) == 0 or len(name) > 32:
        return error("invalid name")

    player = Player.objects.filter(user_id=req.user.id).first()
    if player is None or not player.team_admin:
        return error("not on a team or not admin")

    try:
        team = player.team
        team.name = name
        team.save()
    except:
        return error("team name taken")
    
    return success(name)


def player_stats(req):
    # TODO: fix

    if not (req.user.is_authenticated and req.user.is_admin) and not event_ended():
        return error("cannot get this data yet")

    most_completions = Player.objects.select_related(
        "user"
    ).annotate(
        completion_count=models.Count("completions")
    ).order_by(
        "-completion_count"
    )

    most_first_completions = Player.objects.raw(
        f"""
        WITH firsts AS (
            SELECT achievement_id, MIN(time_completed) AS time_completed FROM achievements_achievementcompletion 
            GROUP BY achievement_id
        )
        SELECT 
            achievements_player.id,
            achievements_player.team_id,
            achievements_player.user_id,
            achievements_user.username,
            achievements_user.avatar,
            achievements_user.cover,
            achievements_user.is_achievement_creator,
            achievements_user.is_admin,
            COUNT(achievements_achievementcompletion.id) AS completion_count 
        FROM achievements_achievementcompletion
        INNER JOIN achievements_player ON (achievements_player.id = achievements_achievementcompletion.player_id)
        INNER JOIN achievements_user ON (achievements_user.id = achievements_player.user_id)
        WHERE achievement_id IN (SELECT achievement_id FROM firsts) AND 
            time_completed IN (SELECT time_completed FROM firsts)
        GROUP BY achievements_player.id,
            achievements_player.team_id,
            achievements_player.user_id,
            achievements_user.username,
            achievements_user.avatar,
            achievements_user.cover,
            achievements_user.is_achievement_creator,
            achievements_user.is_admin
        ORDER BY completion_count DESC;
        """
    )

    return success({
        "most_completions": list(
            (completion.serialize(includes=["user", "completion_count"]) for completion in most_completions)
        ),
        "most_first_completions": list(
            (player.serialize(includes=["user", "completion_count"]) for player in most_first_completions)
        )
    })


def get_auth_packet(req):
    if not req.user.is_authenticated:
        return HttpResponse(status=403)

    player = Player.objects.filter(user_id=req.user.id).first()
    if player is None:
        return error("no associated player")

    packet = settings.WS_CONNECTION_VALIDATOR.encode("ascii") + struct.pack("<II", player.id,
                                                                            random.randint(0, 0xFFFFFFFF))
    msg = SecretBox(settings.SECRET_KEY[:32].encode('ascii')).encrypt(packet)

    return JsonResponse({
        "code": 0,
        "data": base64.b64encode(msg.ciphertext).decode("ascii"),
        "nonce": base64.b64encode(msg.nonce).decode("ascii")
    }, safe=False)
