import base64
import json
import random
import secrets
import struct
import time

from django.conf import settings
from django.contrib.auth import login as do_login, logout as do_logout
from django.db.models.deletion import RestrictedError
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.shortcuts import redirect
from django.views.decorators.http import require_http_methods, require_POST

from nacl.secret import SecretBox

from .models import *
from common.serializer import SerializableField


EVENT_START, EVENT_END = settings.EVENT_START, settings.EVENT_END


def before_event(func):
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


def error(msg: str, status=400):
    return JsonResponse({"error": msg}, status=status, safe=False)


def success(data, status=200):
    return JsonResponse({"data": data}, status=status, safe=False)


def parse_body(body: bytes, require_has: tuple | list):
    try:
        data = json.loads(body.decode("utf-8"))
        if not isinstance(data, dict):
            return

        for require in require_has:
            if require not in data:
                return

        return data
    except (UnicodeDecodeError, json.JSONDecodeError):
        return


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
        return JsonResponse({}, safe=False)
    return JsonResponse({"error": "not logged in"}, status=403, safe=False)


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

    return success([
        achievement.serialize(
            ["beatmap", "completion_count", "completions__player__user", "completions__placement"]
            if event_ended() else
            [
                "beatmap",
                "completion_count",
                SerializableField(
                    "completions",
                    filter=lambda c: c.placement is None or c.placement.place <= 5 or team_completion(c),
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
@before_event
def join_team(req):
    if event_ended():
        return error("event ended")

    data = parse_body(req.body, ("invite",))
    if data is None or data["invite"] is None:
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
@before_event
def leave_team(req):
    if event_ended():
        return error("event ended")

    # TODO: maybe make this into a postgresql function
    team = None
    if req.user.is_authenticated:
        team = Team.objects.prefetch_related("players__user").filter(players__user_id=req.user.id).first()
    if team is None:
        return error("not on team")

    player = next(filter(lambda player: player.user.id == req.user.id, team.players.all()))

    player_count = Player.objects.filter(team_id=team.id).count()
    try:
        if player_count == 1:
            team.delete()
        else:
            player.delete()
    except RestrictedError:
        return error("Cannot leave a team after completing an achievement")
    return success(None)


@require_POST
@before_event
def create_team(req):
    if event_ended():
        return error("event ended")

    data = parse_body(req.body, ("name",))
    if data is None or (name := data["name"]) is None or len(name) == 0 or len(name) > 32:
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

    player = Player(user=req.user, team_id=team.id)
    player.save()

    team = team.serialize()
    player = player.serialize(includes=["user"])
    player["completions"] = []
    team["players"] = [player]
    return success(team)


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
