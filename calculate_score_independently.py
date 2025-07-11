"""
Implemented as specified in this desmos https://www.desmos.com/calculator/d4a6d8d7e9
"""

import requests
import math


url = "http://127.0.0.1:8000"

teams = requests.get(f"{url}/api/iterations/1/teams/").json()["data"]["teams"]
achievements = requests.get(f"{url}/api/iterations/1/achievements/").json()["data"]

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
        team_points[player_teams[completion["player"]["id"]]]["completions"] += 1

# remove teams with no completions
team_points = dict((item for item in team_points.items() if item[1]["completions"] > 0))
n_teams = len(team_points)


def add_points(player_id, amount):
    team_points[player_teams[player_id]]["points"] += amount


c0 = -math.atanh(0.7)
c1 = math.atanh(0.97)


def calculate_a(x):
    return (1.0 - math.tanh(x)) / 2.0


def calculate_b(x):
    return (calculate_a((c1 - c0) * x + c0) - calculate_a(c1)) / (calculate_a(c0) - calculate_a(c1))


def calculate_f(x):
    return 10 + 90 * calculate_b(x / (n_teams - 1))


def calculate_p(x):
    return max(calculate_f(x - 1), calculate_f(n_teams - 1))


def calculate_s(x):
    return (math.cos((4 * math.pi * (x - 1)) / (5 * n_teams)) + 1) / 2


for achievement in achievements:
    tags = [tag.strip().lower() for tag in achievement["tags"].split(",")]
    is_secret = "secret" in tags
    is_competition = "competition" in tags
    total_completions = len(achievement["completions"])

    if is_competition:
        for completion in achievement["completions"]:
            add_points(completion["player"]["id"], round(calculate_p(completion["placement"]["place"])))
    elif is_secret:
        scalar = calculate_s(total_completions)
        for completion in achievement["completions"]:
            points = max(round(calculate_p(completion["time_placement"]) * scalar), 10)
            add_points(completion["player"]["id"], points)
    else:
        amount = round(calculate_p(total_completions))
        for completion in achievement["completions"]:
            add_points(completion["player"]["id"], amount)


leaderboard = sorted(team_points.items(), key=lambda item: item[1]["points"], reverse=True)
print("| %32s | %6s |" % ("Team", "Points"))
print("|----------------------------------|--------|")
for team in leaderboard:
    print(f"| %32s | %6s |" % (team[1]["name"], str(team[1]["points"])))
