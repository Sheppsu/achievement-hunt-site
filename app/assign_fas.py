import django
import os
import random
import math
import time
from dotenv import load_dotenv

load_dotenv()
os.environ["DJANGO_SETTINGS_MODULE"] = "app.settings"
django.setup()

from achievements.models import *
from achievements.views.anonymous_names import get_random_name
from django.db import models


iteration = EventIteration.objects.order_by("-id").first()
regs = Registration.objects.select_related("user").filter(iteration_id=iteration.id).all()
players = Player.objects.select_related("team").filter(team__iteration_id=iteration.id).all()


def make_team(name: str):
    while True:
        try:
            return Team.objects.create(name=name, anonymous_name=get_random_name(), iteration_id=iteration.id)
        except Exception as e:
            # for manual monitoring in case something weird is happening
            print(f"Failed with team name {name} (probably anonymous name overlap)")
            print(e)
            time.sleep(0.5)


print("Processing regs")
leftover_regs = []
for reg in regs:
    if reg.is_screened:
        continue

    player = next((player for player in players if player.user_id == reg.user_id), None)
    if player is not None:
        continue

    if not reg.is_free_agent:
        team = make_team(reg.user.username)
        Player.objects.create(user_id=reg.user_id, team_id=team.id)
        continue

    leftover_regs.append(reg)


print("Putting FAs on open teams")
open_teams = (
    Team.objects.filter(accepts_free_agents=True)
    .annotate(player_count=models.Count("players"))
    .order_by("player_count")
)
for team in open_teams:
    for _ in range(5 - team.player_count):
        if len(leftover_regs) == 0:
            print("All regs have been assigned, quitting early")
            quit()

        reg = leftover_regs.pop(random.randint(0, len(leftover_regs) - 1))
        Player.objects.create(user_id=reg.user_id, team_id=team.id)


print("Creating FA teams")
possible_teams = math.ceil(len(leftover_regs) / 5)
players_per_team = len(leftover_regs) // possible_teams
fa_teams = []
for i in range(possible_teams):
    team = make_team(f"FA Team {i + 1}")
    fa_teams.append(team)
    for _ in range(players_per_team):
        if len(leftover_regs) == 0:
            print("All regs have been assigned, quitting early")
            quit()

        reg = leftover_regs.pop(random.randint(0, len(leftover_regs) - 1))
        Player.objects.create(user_id=reg.user_id, team_id=team.id)


print("Assigning last of regs")
for i, reg in enumerate(leftover_regs):
    team = fa_teams[i]
    Player.objects.create(user_id=reg.user_id, team_id=team.id)
