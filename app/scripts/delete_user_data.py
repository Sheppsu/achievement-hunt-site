import django
import os
from dotenv import load_dotenv

load_dotenv()
os.environ["DJANGO_SETTINGS_MODULE"] = "app.settings"
django.setup()


from achievements.models import *

AchievementCompletion.objects.all().delete()
Player.objects.all().delete()
Team.objects.all().delete()
User.objects.all().delete()
