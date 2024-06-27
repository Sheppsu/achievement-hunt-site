import json
from django.db import connection
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.views.decorators.http import require_POST, require_http_methods
from django.conf import settings
from django.contrib.auth import login as do_login
from django.shortcuts import redirect

import secrets
import struct
import random
import base64
import time
from nacl.secret import SecretBox

from .serializers import *

EVENT_START = 1718416800
EVENT_END = 1719187200


def event_ended():
    return time.time() >= EVENT_END - 1 or settings.DEBUG


def serialize_full_team(team, many=False):
    return TeamSerializer(team, many).serialize(include=["players.user", "players.completions.achievement_id"])


def select_teams(many=False, **kwargs):
    teams = Team.objects.prefetch_related("players__user", "players__completions").filter(**kwargs)
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


def achievements(req):
    # -1 to be sure no one requests right before
    if time.time() < (EVENT_START - 1) and not settings.DEBUG:
        return error("cannot get achievements before event starts")

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                achievements_achievement.id,
                name,
                category,
                description,
                beatmap_id,
                artist,
                title,
                version,
                cover,
                star_rating,
            	COUNT(achievements_achievementcompletion.achievement_id)
            FROM achievements_achievement
            LEFT JOIN achievements_achievementcompletion ON (achievements_achievementcompletion.achievement_id = achievements_achievement.id)
            LEFT JOIN achievements_beatmapinfo ON (achievements_beatmapinfo.id = achievements_achievement.beatmap_id)
            GROUP BY achievements_achievement.id, achievements_beatmapinfo.id
            """
        )
        return success(
            [{
                "id": int(achievement[0]),
                "name": achievement[1],
                "category": achievement[2],
                "description": achievement[3],
                "beatmap": {
                    "id": achievement[4],
                    "artist": achievement[5],
                    "title": achievement[6],
                    "version": achievement[7],
                    "cover": achievement[8],
                    "star_rating": achievement[9]
                } if achievement[4] is not None else None,
                "completions": achievement[10]
            } for achievement in cursor.fetchall()]
        )


def teams(req):
    if event_ended() or (req.user.is_authenticated and req.user.is_admin):
        serialized_teams = map(serialize_full_team, select_teams(many=True))
    else:
        serialized_teams = (
            serialize_full_team(team)
            if any(map(lambda p: p.user.id == req.user.id, team.players)) else
            TeamSerializer(team).serialize(exclude=["invite"])
            for team in select_teams(many=True)
        )
    sorted_teams = sorted(serialized_teams, key=lambda t: t['points'], reverse=True)

    return success(sorted_teams)


@require_POST
def join_team(req):
    if event_ended():
        return error("event ended")

    data = parse_body(req.body, ("invite",))
    if data is None or data["invite"] is None:
        return error("invalid invite")

    team = select_teams(invite=data["invite"])
    if team is None:
        return error("invalid invite")

    if len(team.players) == 5:
        return error("That team is already full")

    player = Player.objects.filter(user_id=req.user.id).first()
    if player is not None:
        return error("already on a team")

    player = Player(user=req.user, team_id=team.id)
    player.save()
    team.players.append(player)
    return success(serialize_full_team(team))


@require_http_methods(["DELETE"])
def leave_team(req):
    if event_ended():
        return error("event ended")

    # TODO: maybe make this into a postgresql function
    team = None
    if req.user.is_authenticated:
        team = Team.prefetch_related("players__user").filter(players__user_id=req.user.id).first()
    if team is None:
        return error("not on team")

    player = next(filter(lambda player: player.user.id == req.user.id, team.players))

    player_count = Player.objects.filter(team_id=team.id).count()
    if len(player_count) == 1:
        team.delete()
    else:
        player.delete()
    return success(None)


@require_POST
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

    team = TeamSerializer(team).serialize()
    player = PlayerSerializer(player).serialize(include=["user"])
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
