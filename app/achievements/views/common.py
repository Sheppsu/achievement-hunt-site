from common.serializer import SerializableField
from common.validation import *
from common.comm import get_osu_user

from django.contrib.auth import login as do_login
from django.contrib.auth import logout as do_logout
from django.db.models.deletion import RestrictedError
from django.http import HttpResponseBadRequest
from django.shortcuts import redirect
from django.views.decorators.http import require_http_methods, require_POST, require_GET

from .util import *
from .anonymous_names import verify_name

from datetime import datetime, timezone


def serialize_team(team: Team):
    return team.serialize(includes=["players__user"])


def select_teams(iteration_id, many=False, sort=False, **kwargs) -> list[Team] | Team | None:
    teams = Team.objects.prefetch_related(
        models.Prefetch(
            "players",
            Player.objects.select_related("user")
        )
    ).filter(
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


def select_current_player(user_id, iteration_id) -> Player | None:
    return Player.objects.select_related("team").filter(user_id=user_id, team__iteration_id=iteration_id).first()


def login(req):
    code = req.GET.get("code", None)
    if code is not None:
        user = User.objects.create_user(code)
        if user is None:
            return HttpResponseBadRequest()
        do_login(req, user, backend=settings.AUTH_BACKEND)
    state = req.GET.get("state", None)
    return redirect(state or "/teams")


def debug_login(req):
    user = User.objects.get(id=7562902)
    do_login(req, user, backend=settings.AUTH_BACKEND)
    return redirect("index")


def logout(req):
    if req.user.is_authenticated:
        do_logout(req)
        return success({})
    return error("not logged in", status=403)


@require_iteration_after_start
def achievements(req, iteration):
    if not (iteration_ended := iteration.has_ended()):
        if not req.user.is_authenticated:
            return error("not logged in", status=403)

        registration = Registration.objects.filter(user=req.user, iteration=iteration).first()
        if registration is None:
            return error("must be registered", status=403)

    team = Team.objects.prefetch_related("players").filter(
        players__user_id=req.user.id,
        iteration_id=iteration.id
    ).first()

    # shouldn't be possible, but let's check anyway
    if not iteration_ended and team is None:
        return error("must be on a team", status=403)

    completion_prefetch = models.Prefetch(
        "completions",
        queryset=AchievementCompletion.objects.select_related(
            "player__user",
            "placement"
        )
    )

    query = Achievement.objects.select_related(
        "batch"
    ).prefetch_related(
        models.Prefetch(
            "beatmaps",
            queryset=BeatmapConnection.objects.select_related(
                "info"
            ).filter(
                hide=False
            )
        )
    ).filter(
        batch__iteration_id=iteration.id,
        batch__release_time__lte=datetime.now(tz=timezone.utc)
    )

    if (req.user.is_authenticated and req.user.is_admin) or iteration_ended:
        query = query.prefetch_related(
            completion_prefetch
        ).annotate(
            completion_count=models.Count("completions")
        )
        return success([
            achievement.serialize([
                "completions__player__user",
                "completions__placement",
                "beatmaps__info",
                "completion_count",
                "batch"
            ], [
                "completions__player__team_admin",
                "completions__player__user_id",
                "completions__player__user__is_admin",
                "completions__player__user__is_achievement_creator",
            ])
            for achievement in query.all()
        ])

    completion_counts = Achievement.objects.annotate(completion_count=models.Count("completions")).all()

    def team_completion(c) -> bool:
        return (
            any((player.id == c.player_id for player in team.players.all()))
            if team is not None else
            False
        )

    completion_prefetch.queryset = completion_prefetch.queryset.filter(
        models.Q(player__team_id=team.id) | models.Q(placement__isnull=False)
    )

    result = [
        achievement.serialize(
            [
                "beatmaps__info",
                SerializableField(
                    "completions__player",
                    condition=team_completion
                ),
                SerializableField(
                    "completions__time_completed",
                    condition=team_completion
                ),
                "completions__player__user",
                "completions__placement",
                "batch"
            ],
            [
                "completions__player__team_admin",
                "completions__player__user_id",
                "completions__player__user__is_admin",
                "completions__player__user__is_achievement_creator",
            ]
        )
        for achievement in query.prefetch_related(completion_prefetch).all()
    ]

    for achievement in result:
        for completion_count_achievement in completion_counts:
            if completion_count_achievement.id == achievement["id"]:
                achievement["completion_count"] = completion_count_achievement.completion_count
                break

    return success(result)


@require_iteration
def teams(req, iteration):
    if iteration.has_ended() or (req.user.is_authenticated and req.user.is_staff):
        my_team_i = -1
        serialized_teams = list(map(serialize_team, select_teams(iteration.id, many=True, sort=True)))
    else:
        teams = select_teams(iteration.id, many=True, sort=True)
        my_team_item = next((
            (i, team) for i, team in enumerate(teams)
            if any((player.user_id == req.user.id for player in team.players.all()))
        ), None)

        if my_team_item is None:
            return success({"placement": 0, "teams": []})

        my_team_i, my_team = my_team_item

        # localized leaderboard
        # (teams above and below you)
        serialized_teams = [serialize_team(my_team)]
        excludes = ["name", "icon", "accepts_free_agents"]
        if my_team_i > 0:
            serialized_teams.insert(0, teams[my_team_i-1].serialize(excludes=excludes))
        if my_team_i < len(teams) - 1:
            serialized_teams.append(teams[my_team_i+1].serialize(excludes=excludes))

    return success({
        "placement": my_team_i + 1,
        "teams": serialized_teams
    })


@require_http_methods(["DELETE"])
@require_iteration_before_start
@require_registered
def leave_team(req, iteration, registration):
    team = Team.objects.prefetch_related("players").filter(
        players__user_id=req.user.id,
        iteration_id=iteration.id
    ).first()
    if team is None:
        return error("not on team")

    players = team.players.all()
    team_id = team.id
    leaving_player: Player = next(filter(lambda player: player.user_id == req.user.id, players))
    try:
        if len(players) == 1:
            team.delete()
        elif leaving_player.team_admin:
            return error("team admin can't leave the team without transferring")
        else:
            leaving_player.delete()
    except RestrictedError:
        return error("cannot leave a team after completing an achievement")

    return success({"team_id": team_id, "user_id": req.user.id})


@require_POST
@require_iteration_before_start
@accepts_json_data(
    DictionaryType({
        "name": StringType(min_length=1, max_length=32),
        "anonymous_name": StringType(min_length=1, max_length=32)
    })
)
@require_registered
def create_team(req, data, iteration, registration):
    player = select_current_player(req.user.id, iteration.id)
    if player is not None:
        return error("already on a team")

    if not verify_name(data["anonymous_name"]):
        return error("invalid anonymous name")

    try:
        team = Team(
            name=data["name"],
            anonymous_name=data["anonymous_name"],
            icon="",
            iteration=iteration
        )
        team.save()
    except Exception as e:
        if "unique_iteration_team_name" in str(e):
            return error("team name taken")
        return error("anonymous team name taken")

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
    
    return success(team.serialize())


@require_http_methods(["PATCH"])
@require_iteration_before_start
@require_user
@accepts_json_data(DictionaryType({
    "enable": BoolType()
}))
def change_accepting_free_agents(req, data, iteration):
    player = select_current_player(req.user.id, iteration.id)
    if player is None or not player.team_admin:
        return error("not on a team or not admin")

    enable = data["enable"]

    team = player.team
    team.accepts_free_agents = enable
    team.save()

    return success({"id": team.id, "enabled": enable})


@require_GET
@require_iteration
@require_user
def get_team_invites(req, iteration):
    player = select_current_player(req.user.id, iteration.id)
    if player is None or not player.team_admin:
        return error("not on a team or not admin")

    invites = TeamInvite.objects.select_related(
        "user"
    ).filter(
        team_id=player.team_id
    ).all()

    invites = [
        invite.serialize(
            includes=["user__username"],
            excludes=["team_id"]
        )
        for invite in invites
    ]
    for invite in invites:
        invite["username"] = invite.pop("user")["username"]

    return success(invites)


@require_GET
@require_iteration
@require_user
def get_user_invites(req, iteration):
    invites = TeamInvite.objects.select_related(
        "team"
    ).filter(
        user_id=req.user.id,
        team__iteration_id=iteration.id
    ).all()

    invites = [
        invite.serialize(
            includes=["team__name"],
            excludes=["user_id"]
        ) for invite in invites
    ]
    for invite in invites:
        invite["team_name"] = invite.pop("team")["name"]

    return success(invites)


@require_http_methods(["POST"])
@accepts_json_data(DictionaryType({
    "user_id": IntegerType(minimum=0),
}))
@require_iteration_before_start
@require_user
def send_team_invite(req, data, iteration):
    player = select_current_player(req.user.id, iteration.id)
    if player is None or not player.team_admin:
        return error("not on a team or not admin")

    n_invites = TeamInvite.objects.filter(team_id=player.team_id).count()
    n_players = Player.objects.filter(team_id=player.team_id).count()
    if n_invites + n_players >= 5:
        return error("reached max invite + player combination (5)")

    user = User.objects.filter(id=data["user_id"]).first()
    if user is None:
        user = get_osu_user(data["user_id"])
        if user is None:
            return error("invalid user id")

        user = User.objects.create(
            id=user["id"],
            username=user["username"],
            avatar=user["avatar"],
            cover=user["cover"] or ""
        )

    else:
        # ok so this is quite weird but
        # there's a slight possibility that someone uses the invite system
        # to check whether someone has logged in on the site before (in
        # which case they've likely registered); the request takes longer
        # when having to fetch the user via the api. So, to be safe, this sleep
        # makes it hard to distinguish whether that's the case.
        time.sleep(1)

    try:
        invite = TeamInvite.objects.create(user_id=user.id, team_id=player.team_id)
    except:
        return error("already invited this user")

    serial_invite = invite.serialize(excludes=["team_id"])
    serial_invite["username"] = user.username
    return success(serial_invite)


@require_http_methods(["DELETE"])
@require_user
def rescind_invite(req, invite_id):
    invite = TeamInvite.objects.filter(id=invite_id).first()
    if invite is None:
        return error("invite already accepted or denied")

    players = Player.objects.filter(user_id=req.user.id).all()
    for player in players:
        if player.team_id == invite.team_id and player.team_admin:
            invite.delete()
            return success(None)

    return error("must be team admin to rescind the invite")


@require_http_methods(["DELETE"])
@require_user
@accepts_json_data(DictionaryType({
    "accept": BoolType()
}))
def resolve_invite(req, invite_id, data):
    invite = TeamInvite.objects.filter(id=invite_id).first()
    if invite is None:
        return error("invite no longer exists")

    if req.user.id != invite.user_id:
        return error("not your invite")

    if not data["accept"]:
        invite.delete()
        return success(None)

    team = Team.objects.prefetch_related("players").get(id=invite.team_id)
    player = select_current_player(req.user.id, team.iteration_id)
    if player is not None:
        return error("already on a team")
    if team.players.count() >= 5:
        return error("the team is already full")

    registration = Registration.objects.filter(user_id=req.user.id, iteration_id=team.iteration_id).first()
    if registration is None:
        return error("must be registered", status=403)
    if registration.is_screened:
        return error("you've been screened out", status=403)

    Player.objects.create(user_id=req.user.id, team_id=team.id)
    invite.delete()
    return success(team.serialize())


@require_user
@require_iteration
def chat_messages(req, iteration):
    player = select_current_player(req.user.id, iteration.id)
    if player is None:
        return error("Not on a team")
    
    messages = ChatMessage.objects.select_related("player__user").filter(
        team_id=player.team_id
    ).order_by("-sent_at")[:50]

    return success([
        {
            "name": message.player.user.username,
            "message": message.message,
            "sent_at": message.sent_at.isoformat()
        } for message in reversed(messages)
    ])


@require_GET
@require_iteration
def get_iteration(req, iteration):
    return success(iteration.serialize())


@require_GET
@require_iteration
@require_user
def get_registration(req, iteration):
    registration = Registration.objects.filter(user_id=req.user.id, iteration_id=iteration.id).first()
    return success(None if registration is None else registration.serialize())


@require_GET
@require_iteration
@require_user
def get_all_registrations(req, iteration):
    if req.user.is_staff:
        regs = [
            registration.serialize(includes=["user"])
            for registration in Registration.objects.select_related(
                "user"
            ).filter(
                iteration_id=iteration.id
            )
        ]
        return success({
            "registration_count": len(regs),
            "registrations": regs
        })

    return success({
        "registration_count": Registration.objects.filter(
            iteration_id=iteration.id
        ).count(),
    })


@require_POST
@accepts_json_data(
    DictionaryType({"register": BoolType()})
)
@require_iteration_before_registration_end
@require_user
def change_registration(req, data, iteration):
    if not iteration.registration_open:
        return error("registration is not yet open")

    if req.user.is_achievement_creator or req.user.is_admin:
        return error("achievement creators and admins cannot register")

    registration = Registration.objects.filter(user_id=req.user.id, iteration_id=iteration.id).first()
    reg = data["register"]

    if reg and registration is not None:
        return error("already registered")

    if not reg and registration is None:
        return error("already unregistered")

    if not reg:
        registration.delete()
        return success(None)
    else:
        reg = Registration.objects.create(user=req.user, iteration=iteration)
        return success(reg.serialize())


@require_http_methods(["PATCH"])
@require_iteration_before_start
@accepts_json_data(
    DictionaryType({"free_agent": BoolType()})
)
@require_registered
def change_free_agent(req, data, iteration, registration):
    registration.is_free_agent = data["free_agent"]
    registration.save()
    return success(registration.serialize())


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
        for announcement in Announcement.objects.filter(iteration_id=iteration.id).order_by("-created_at")
    ])
