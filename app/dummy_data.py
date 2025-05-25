import django
import os
from dotenv import load_dotenv

load_dotenv()
os.environ["DJANGO_SETTINGS_MODULE"] = "app.settings"
django.setup()

from achievements.models import *
from django.conf import settings
import osu
import itertools
import secrets
import random

client: osu.Client = settings.OSU_CLIENT


def ensure_user(user: osu.UserCompact):
    User.objects.get_or_create(
        id=user.id,
        defaults={
            "username": user.username,
            "avatar": user.avatar_url,
            "cover": user.cover.url
        }
    )


iteration = EventIteration.objects.get()


cursor = None
team_counter = 1
for _ in range(10):
    ret = client.get_ranking("osu", "performance", cursor=cursor)
    cursor = ret.cursor

    for stats in itertools.batched(ret.ranking, 5):
        team, created = Team.objects.get_or_create(
            name=f"Team {team_counter}",
            defaults={
                "invite": secrets.token_urlsafe(12),
                "points": random.randint(0, 9999),
                "iteration": iteration
            }
        )
        team_counter += 1

        if not created:
            continue

        for i, stat in enumerate(stats):
            ensure_user(stat.user)
            Player.objects.create(
                user_id=stat.user.id,
                team=team,
                team_admin=i == 0,
            )
