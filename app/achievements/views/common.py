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

current_iteration = EventIteration.objects.order_by('-id').last()
current_iteration_start = current_iteration.start.timestamp()
current_iteration_end = current_iteration.end.timestamp()


def require_iteration_before_end(func):
    @require_iteration
    def wrapper(req, *args, iteration, **kwargs):
        if iteration.has_ended():
            return error("iteration ended", status=403)

        return func(req, *args, iteration=iteration, **kwargs)

    return wrapper


def require_iteration_after_start(func):
    @require_iteration
    def wrapper(req, *args, iteration, **kwargs):
        if not iteration.has_started():
            return error("iteration has not started", status=403)

        return func(req, *args, iteration=iteration, **kwargs)

    return wrapper


def require_iteration_after_end(func):
    @require_iteration
    def wrapper(req, *args, iteration, **kwargs):
        if not iteration.has_ended():
            return error("must wait until iteration ends", status=403)

        return func(req, *args, iteration=iteration, **kwargs)

    return wrapper


def require_user(func):
    def wrapper(req, *args, **kwargs):
        if not req.user.is_authenticated:
            return error("Not logged in", status=403)

        return func(req, *args, **kwargs)

    return wrapper


def require_iteration(func):
    def wrapper(req, iteration_id=None, *args, **kwargs):
        if iteration_id is None:
            iteration = current_iteration
        else:
            iteration = EventIteration.objects.filter(id=iteration_id).first()

        if iteration is None:
            return error("iteration not found", status=404)

        return func(req, *args, iteration=iteration, **kwargs)

    return wrapper


def serialize_team(team: Team):
    return team.serialize(includes=["players__user"])


def select_teams(iteration_id, many=False, **kwargs) -> list[Team] | Team | None:
    teams = Team.objects.prefetch_related("players__user").filter(
        iteration_id=iteration_id,
        **kwargs
    )
    if many:
        return teams
    if len(teams) == 0:
        return
    return teams[0]


def select_current_player(user_id, iteration_id):
    return Player.objects.filter(user_id=user_id, team__iteration_id=iteration_id).first()


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


@require_iteration_after_start
def achievements(req, iteration):
    team = (
        Team.objects.prefetch_related("players").filter(
            players__user_id=req.user.id,
            iteration_id=iteration.id
        ).first()
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
            if iteration.has_ended() or is_admin else
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
            "beatmap",
            "batch"
        ).prefetch_related(
            "completions__player__user",
            "completions__placement",
        ).annotate(
            completion_count=models.Count("completions"),
        ).filter(
            batch__iteration_id=iteration.id
        ).all()
    ])


@require_iteration
def teams(req, iteration):
    if iteration.has_ended() or (req.user.is_authenticated and req.user.is_admin):
        serialized_teams = map(serialize_team, select_teams(iteration.id, many=True))
    else:
        serialized_teams = (
            serialize_team(team)
            if any(map(lambda p: p.user.id == req.user.id, team.players.all())) else
            team.serialize(excludes=["invite", "icon", "name"])
            for team in select_teams(iteration.id, many=True)
        )
    sorted_teams = sorted(serialized_teams, key=lambda t: t['points'], reverse=True)

    return success(sorted_teams)


@require_POST
@require_iteration_before_end
@require_valid_data("invite")
@require_user
def join_team(req, data, iteration):
    if data["invite"] is None:
        return error("invalid invite")

    team = select_teams(iteration.id, invite=data["invite"])
    if team is None:
        return error("invalid invite")

    if len(team.players.all()) == 5:
        return error("That team is already full")

    player = select_current_player(req.user.id, iteration.id)
    if player is not None:
        return error("already on a team")

    player = Player(user=req.user, team_id=team.id)
    player.save()
    team.players.add(player)

    return success(serialize_team(team))


@require_http_methods(["DELETE"])
@require_iteration_before_end
@require_user
def leave_team(req, iteration):
    team = Team.objects.prefetch_related("players__user").filter(
        players__user_id=req.user.id,
        iteration_id=iteration.id
    ).first()
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
@require_iteration_before_end
@require_valid_data("name")
@require_user
def create_team(req, data, iteration):
    if (name := data["name"]) is None or len(name) == 0 or len(name) > 32:
        return error("invalid name")

    player = select_current_player(req.user.id, iteration.id)
    if player is not None:
        return error("already on a team")

    try:
        invite = secrets.token_urlsafe(12)
        team = Team(name=name, icon="", invite=invite, iteration=current_iteration)
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
@require_iteration_before_end
@require_user
def transfer_admin(req, data, iteration):
    if (new_admin_user_id := data["newAdminId"]) is None:
        return error("invalid user id")
    
    current_admin = select_current_player(req.user.id, iteration.id)
    if current_admin is None or not current_admin.team_admin:
        return error("not on a team or not admin")
    
    new_admin = select_current_player(new_admin_user_id, iteration.id)
    if new_admin is None or current_admin.team_id != new_admin.team_id:
        return error("users not on the same team")
    
    current_admin.team_admin = False
    current_admin.save()

    new_admin.team_admin = True
    new_admin.save()

    return success({"prevAdminId": current_admin.user.id, "newAdminId": new_admin.user.id})


@require_http_methods(["PATCH"])
@require_valid_data("name")
@require_iteration_before_end
@require_user
def rename_team(req, data, iteration):
    if (name := data["name"]) is None or len(name) == 0 or len(name) > 32:
        return error("invalid name")

    player = select_current_player(req.user.id, iteration.id)
    if player is None or not player.team_admin:
        return error("not on a team or not admin")

    try:
        team = player.team
        team.name = name
        team.save()
    except:
        return error("team name taken")
    
    return success(name)


@require_iteration_after_end
def player_stats(req, iteration):
    most_completions = Player.objects.select_related(
        "user"
    ).filter(
        team__iteration_id=iteration.id
    ).annotate(
        completion_count=models.Count("completions")
    ).order_by(
        "-completion_count"
    )

    most_first_completions = Player.objects.raw(
        f"""
        WITH firsts AS (
            SELECT achievement_id, MIN(time_completed) AS time_completed FROM achievements_achievementcompletion
            INNER JOIN achievements_achievement ON (achievements_achievement.id = achievements_achievementcompletion.achievement_id) 
            WHERE achievements_achievement.iteration_id = {current_iteration.id}
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


@require_user
@require_iteration
def get_auth_packet(req, iteration):
    player = select_current_player(req.user.id, iteration.id)
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
