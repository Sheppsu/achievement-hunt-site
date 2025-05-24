import base64
import random
import secrets
import struct

from common.serializer import SerializableField
from common.validation import *
from django.contrib.auth import login as do_login
from django.contrib.auth import logout as do_logout
from django.db.models.deletion import RestrictedError
from django.http import HttpResponseBadRequest
from django.shortcuts import redirect
from django.views.decorators.http import require_http_methods, require_POST, require_GET
from nacl.secret import SecretBox

from .util import *


def serialize_team(team: Team):
    return team.serialize(includes=["players__user"])


def select_teams(iteration_id, many=False, sort=False, **kwargs) -> list[Team] | Team | None:
    teams = Team.objects.prefetch_related("players__user").filter(
        iteration_id=iteration_id,
        **kwargs
    )
    if sort:
        teams = teams.order_by("-points")
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
            ["beatmaps__info", "completion_count", "completions__player__user", "completions__placement"]
            if iteration.has_ended() or is_admin else
            [
                SerializableField(
                    "beatmaps",
                    condition=lambda b: not b.hide
                ),
                "beatmaps__info",
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
            "batch"
        ).prefetch_related(
            "completions__player__user",
            "completions__placement",
            "beatmaps__info"
        ).annotate(
            completion_count=models.Count("completions"),
        ).filter(
            batch__iteration_id=iteration.id
        ).all()
    ])


@require_iteration
def teams(req, iteration):
    if iteration.has_ended() or (req.user.is_authenticated and req.user.is_admin):
        serialized_teams = list(map(serialize_team, select_teams(iteration.id, many=True, sort=True)))
    else:
        teams = select_teams(iteration.id, many=True, sort=True)
        my_team_item = next((
            (i, team) for i, team in enumerate(teams)
            if any((player.user_id == req.user.id for player in team.players.all()))
        ), None)

        if my_team_item is None:
            return success([])

        my_team_i, my_team = my_team_item

        # localized leaderboard
        # (teams above and below you)
        serialized_teams = [serialize_team(my_team)]
        if my_team_i > 0:
            serialized_teams.insert(0, serialize_team(teams[my_team_i-1]))
        if my_team_i < len(teams) - 1:
            serialized_teams.append(serialize_team(teams[my_team_i+1]))

    return success(serialized_teams)


@require_POST
@require_iteration_before_start
@accepts_json_data(
    DictionaryType({"invite": StringType()})
)
@require_user
def join_team(req, data, iteration):
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
@require_iteration_before_start
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
@require_iteration_before_start
@accepts_json_data(
    DictionaryType({"name": StringType(min_length=1, max_length=32)})
)
@require_user
def create_team(req, data, iteration):
    player = select_current_player(req.user.id, iteration.id)
    if player is not None:
        return error("already on a team")

    try:
        invite = secrets.token_urlsafe(12)
        team = Team(name=data["name"], icon="", invite=invite, iteration=current_iteration)
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
@accepts_json_data(
    DictionaryType({"newAdminId": IntegerType()})
)
@require_iteration_before_start
@require_user
def transfer_admin(req, data, iteration):
    current_admin = select_current_player(req.user.id, iteration.id)
    if current_admin is None or not current_admin.team_admin:
        return error("not on a team or not admin")
    
    new_admin = select_current_player(data["newAdminId"], iteration.id)
    if new_admin is None or current_admin.team_id != new_admin.team_id:
        return error("users not on the same team")
    
    current_admin.team_admin = False
    current_admin.save()

    new_admin.team_admin = True
    new_admin.save()

    return success({"prevAdminId": current_admin.user.id, "newAdminId": new_admin.user.id})


@require_http_methods(["PATCH"])
@accepts_json_data(
    DictionaryType({"name": StringType(min_length=1, max_length=32)})
)
@require_iteration_before_start
@require_user
def rename_team(req, data, iteration):
    player = select_current_player(req.user.id, iteration.id)
    if player is None or not player.team_admin:
        return error("not on a team or not admin")

    name = data["name"]

    try:
        team = player.team
        team.name = name
        team.save()
    except:
        return error("team name taken")
    
    return success(name)


@require_GET
@require_iteration
def get_iteration(req, iteration):
    return success(iteration.serialize())


@require_GET
@require_iteration
@require_user
def get_registration(req, iteration):
    registration = Registration.objects.filter(user_id=req.user.id, iteration_id=iteration.id).first()
    return success({"registered": registration is not None})


@require_POST
@accepts_json_data(
    DictionaryType({"register": BoolType()})
)
@require_iteration_before_registration_end
@require_user
def register(req, data, iteration):
    registration = Registration.objects.filter(user_id=req.user.id, iteration_id=iteration.id).first()
    reg = data["register"]

    if reg and registration is not None:
        return error("already registered")

    if not reg and registration is None:
        return error("already unregistered")

    if not reg:
        registration.delete()
    else:
        Registration.objects.create(user=req.user, iteration=iteration)

    return success({"registered": reg})


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
            WHERE achievements_achievement.iteration_id = {iteration.id}
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


@require_iteration
def get_announcements(req, iteration):
    return success([
        announcement.serialize()
        for announcement in Announcement.objects.filter(iteration_id=iteration.id)
    ])


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
