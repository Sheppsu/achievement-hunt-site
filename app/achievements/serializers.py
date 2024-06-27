from .models import *
from common import serializer


@serializer
class UserSerializer:
    model = User
    fields = ["id", "username", "avatar", "cover", "is_admin", "is_achievement_creator"]


@serializer
class AchievementSerializer:
    model = Achievement
    fields = ["id", "name", "category", "description", "beatmap_id"]


@serializer
class AchievementCompletionSerializer:
    model = AchievementCompletion
    fields = ["time_completed"]


@serializer
class TeamSerializer:
    model = Team
    fields = ["id", "name", "icon", "invite", "points"]


@serializer
class PlayerSerializer:
    model = Player
    fields = ["id"]
