import django
import os
import random
import math
from dotenv import load_dotenv

load_dotenv()
os.environ["DJANGO_SETTINGS_MODULE"] = "app.settings"
django.setup()

from achievements.models import *
from achievements.views.anonymous_names import get_random_name
from django.db import models, transaction


iteration = EventIteration.objects.order_by("-id").first()
regs = Registration.objects.select_related("user").filter(iteration_id=iteration.id).all()
players = Player.objects.select_related("team", "user").filter(team__iteration_id=iteration.id).all()


def make_team(name: str):
    while True:
        try:
            return Team.objects.create(name=name, anonymous_name=get_random_name(), iteration_id=iteration.id)
        except Exception as e:
            # for manual monitoring in case something weird is happening
            print(f"Failed with team name {name} (probably anonymous name overlap)")
            print(e)
            time.sleep(0.5)


def make_nonfa_teams():
    print("Making non-FA teams")
    casual_regs = []
    competitive_regs = []
    for reg in regs:
        if reg.is_screened:
            continue

        player = next((player for player in players if player.user_id == reg.user_id), None)
        if player is not None:
            continue

        if not reg.is_free_agent:
            print(f"Making solo team for {reg.user.username}")
            team = make_team(reg.user.username)
            Player.objects.create(user_id=reg.user_id, team_id=team.id)
            continue

        if reg.free_agent_type == 1:
            casual_regs.append(reg)
        else:
            competitive_regs.append(reg)

    return casual_regs, competitive_regs


def fill_in_teams(leftover_regs, reg_type):
    print("Putting FAs on open teams")
    open_teams = (
        Team.objects.filter(accepts_free_agents=True, free_agent_type=reg_type)
        .annotate(player_count=models.Count("players"))
        .order_by("player_count")
    )
    for team in open_teams:
        for _ in range(5 - team.player_count):
            if len(leftover_regs) == 0:
                print("All regs have been assigned")
                return False

            reg = leftover_regs.pop(random.randint(0, len(leftover_regs) - 1))
            Player.objects.create(user_id=reg.user_id, team_id=team.id)
            print(f"Put {reg.user.username} on team {team.name}")

    return True


def create_fa_teams(leftover_regs):
    print("Creating FA teams")
    possible_teams = math.ceil(len(leftover_regs) / 5)
    print(f"Possible teams: {possible_teams}")
    players_per_team = len(leftover_regs) // possible_teams
    print(f"Player per team: {players_per_team}")
    fa_teams = []
    for i in range(possible_teams):
        team = make_team(f"FA Team {i + 1}")
        fa_teams.append(team)
        for _ in range(players_per_team):
            if len(leftover_regs) == 0:
                print("All regs have been assigned, quitting early")
                return

            reg = leftover_regs.pop(random.randint(0, len(leftover_regs) - 1))
            Player.objects.create(user_id=reg.user_id, team_id=team.id)
            print(f"Putting {reg.user.username} on team {team.name}")

    print("Assigning last of regs")
    for i, reg in enumerate(leftover_regs):
        team = fa_teams[i]
        Player.objects.create(user_id=reg.user_id, team_id=team.id)
        print(f"Putting {reg.user.username} on team {team.name}")


with transaction.atomic():
    casual_regs, competitive_regs = make_nonfa_teams()
    if fill_in_teams(casual_regs, 1):
        create_fa_teams(casual_regs)
    if fill_in_teams(competitive_regs, 2):
        create_fa_teams(competitive_regs)

    answer = input("Commit these changes? [y/n]: ").strip().lower()
    if answer == "y":
        print("Done.")
    else:
        transaction.set_rollback(True)
        print("Rolled back changes")
