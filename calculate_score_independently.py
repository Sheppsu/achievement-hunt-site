"""
Implemented as specified in https://media.sheppsu.me/3VPDNiGZKsKY93by
"""

import requests
import math
import json
from datetime import datetime


run_mode = input("Input 1 to pull data from the website (default) or 2 to use local data (achievements.json and teams.json): ")
if run_mode.lower().strip() == "2":
    with open("teams.json", encoding="utf-8") as f:
        team_data = json.loads(f.read())["data"]
    with open("achievements.json", encoding="utf-8") as f:
        achievements = json.loads(f.read())["data"]
else:
    url = "https://cta.sheppsu.me/api"
    team_data = requests.get(f"{url}/teams/").json()["data"]
    achievements = requests.get(f"{url}/achievements/").json()["data"]

n_teams = team_data["effective_team_count"]
teams = team_data["teams"]

# track points and completions for each team
team_points = {
    team["id"]: {
        "name": team["name"],
        "points": 0,
        "completions": 0,
    }
    for team in teams
}
# dictionary of player id to team id
player_teams = {}
for team in teams:
    for player in team["players"]:
        player_teams[player["id"]] = team["id"]

for achievement in achievements:
    # ignore incomplete completions
    complete_completions = [completion for completion in achievement["completions"] if completion["is_complete"]]

    # increment completions in team_points
    for completion in complete_completions:
        completion["time_completed"] = datetime.fromisoformat(completion["time_completed"])
        team_points[player_teams[completion["player"]["id"]]]["completions"] += 1
    
    # calculate time placements on completions
    last_time = None
    last_placement = 1
    for i, completion in enumerate(sorted(complete_completions, key=lambda c: c["time_completed"])):
        # ignore competition completions (time placemnet doesn't matter)
        if completion["placement"] is not None:
            continue
    
        if last_time is None:
            assert completion["time_placement"] == 1
            completion["time_placement"] = 1
        elif (completion["time_completed"] - last_time).total_seconds() <= 5 * 60:
            assert completion["time_placement"] == last_placement
            completion["time_placement"] = last_placement
        else:
            assert completion["time_placement"] == i + 1, completion
            completion["time_placement"] = i + 1
            last_placement = i + 1
        last_time = completion["time_completed"]

# remove teams with no completions
team_points = dict((item for item in team_points.items() if item[1]["completions"] > 0))


def add_points(player_id, amount):
    team_points[player_teams[player_id]]["points"] += amount


c0 = -math.atanh(0.7)
c1 = math.atanh(0.97)


def calculate_a(x):
    return (1.0 - math.tanh(x)) / 2.0


def calculate_b(x):
    return (calculate_a((c1 - c0) * x + c0) - calculate_a(c1)) / (calculate_a(c0) - calculate_a(c1))


def calculate_f(x):
    return 10 + 90 * (calculate_b((x - 1) / (n_teams - 1)) ** 2)
    
    
def calculate_g(x, y):
    return 10 + 20 * (calculate_b((x - 1) / (n_teams - 1)) ** 2) + 70 * (calculate_b((y - 1) / (n_teams - 1)) ** 2)


def calculate_h(x):
    return 10 + 90 * (calculate_b((x - 1) / (n_teams - 1)) ** 3)


def calculate_p(x):
    return round(max(calculate_f(x), 10))
    

def calculate_ps(x, y):
    return round(max(calculate_g(x, y), 10))
    

def calculate_pc(x):
    return round(max(calculate_h(x), 10))


def is_completion_worth_points(completion):
    # competition achievements are worth points even if not complete
    return completion["is_complete"] or completion["placement"] is not None


# calculate points for each team
for achievement in achievements:
    if not achievement["worth_points"]:
        continue
        
    completions_worth_points = [completion for completion in achievement["completions"] if is_completion_worth_points(completion)]

    tags = [tag.strip().lower() for tag in achievement["tags"].split(",")]
    is_secret = "secret" in tags
    is_competition = "competition" in tags
    total_completions = len(completions_worth_points)

    if is_competition:
        for completion in completions_worth_points:
            add_points(completion["player"]["id"], round(calculate_pc(completion["placement"]["place"])))
    elif is_secret:
        for completion in completions_worth_points:
            add_points(completion["player"]["id"], calculate_ps(completion["time_placement"], total_completions))
    else:
        amount = calculate_p(total_completions)
        for completion in completions_worth_points:
            add_points(completion["player"]["id"], amount)


points_mismatch = []
local_leaderboard = sorted(team_points.values(), key=lambda team: team["points"], reverse=True)
site_leaderboard = sorted(teams, key=lambda team: team["points"], reverse=True)
print("| %32s | %12s | %12s |" % ("Team", "Site points", "Local points"))
print("|----------------------------------|--------------|--------------|")
for site_team, local_team in zip(site_leaderboard, local_leaderboard):
    site_points = site_team["points"]
    local_points = local_team["points"]
    if site_points != local_points:
        points_mismatch.append(local_team["name"])
    
    print(f"| %32s | %12s | %12s |" % (local_team["name"], str(local_points), str(site_points)))

if len(points_mismatch) == 0:
    print("All points match")
else:
    print("Points mismatch for the following teams:")
    for team_name in points_mismatch:
        print(f" - {team_name}")
