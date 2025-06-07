import django
import os
from dotenv import load_dotenv

load_dotenv()
os.environ["DJANGO_SETTINGS_MODULE"] = "app.settings"
django.setup()

from achievements.models import *
from django.conf import settings
import osu

client: osu.Client = settings.OSU_CLIENT


for iteration in EventIteration.objects.all():
    iteration.description = [
        {
            "heading": item[0],
            "text": item[1],
            "order": i
        }
        for i, item in enumerate(iteration.description.items())
    ]
    iteration.save()
