"""
Implemented as specified in this desmos https://www.desmos.com/calculator/d4a6d8d7e9
"""

import requests
import math
from datetime import datetime


url = "https://cta.sheppsu.me/api"

team_data = requests.get(f"{url}/teams/").json()["data"]
n_teams = team_data["effective_team_count"]
teams = team_data["teams"]
achievements = requests.get(f"{url}/achievements/").json()["data"]

team_points = {
    team["id"]: {
        "name": team["name"],
        "points": 0,
        "completions": 0,
    }
    for team in teams
}
player_teams = {}
for team in teams:
    for player in team["players"]:
        player_teams[player["id"]] = team["id"]

for achievement in achievements:
    for completion in achievement["completions"]:
        completion["time_completed"] = datetime.fromisoformat(completion["time_completed"])
        team_points[player_teams[completion["player"]["id"]]]["completions"] += 1
    
    last_time = None
    last_placement = 1
    for i, completion in enumerate(sorted(achievement["completions"], key=lambda c: c["time_completed"])):
        if last_time is None:
            completion["time_placement"] = 1
        elif (completion["time_completed"] - last_time).total_seconds() <= 5 * 60:
            completion["time_placement"] = last_placement
        else:
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


for achievement in achievements:
    if not achievement["worth_points"]:
        continue

    tags = [tag.strip().lower() for tag in achievement["tags"].split(",")]
    is_secret = "secret" in tags
    is_competition = "competition" in tags
    total_completions = len(achievement["completions"])

    if is_competition:
        for completion in achievement["completions"]:
            add_points(completion["player"]["id"], round(calculate_pc(completion["placement"]["place"])))
    elif is_secret:
        for completion in achievement["completions"]:
            add_points(completion["player"]["id"], calculate_ps(completion["time_placement"], total_completions))
    else:
        amount = calculate_p(total_completions)
        for completion in achievement["completions"]:
            add_points(completion["player"]["id"], amount)


leaderboard = sorted(team_points.items(), key=lambda item: item[1]["points"], reverse=True)
print("| %32s | %6s |" % ("Team", "Points"))
print("|----------------------------------|--------|")
for team in leaderboard:
    print(f"| %32s | %6s |" % (team[1]["name"], str(team[1]["points"])))
