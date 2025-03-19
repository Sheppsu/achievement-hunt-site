import django
import os
from dotenv import load_dotenv

load_dotenv()
os.environ["DJANGO_SETTINGS_MODULE"] = "app.settings"
django.setup()


from achievements.models import *


connections = []
for achievement in Achievement.objects.all():
    if achievement.beatmap_id is None:
        continue

    connections.append(BeatmapConnection(achievement_id=achievement.id, beatmap_id=achievement.beatmap_id, hide=False))

BeatmapConnection.objects.bulk_create(connections)

