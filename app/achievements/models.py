from django.db import models

import requests
from osu import Client
from typing import TYPE_CHECKING

from common import create_auth_handler  # type: ignore

if TYPE_CHECKING:
    from ..common import create_auth_handler


class UserManager(models.Manager):
    def create_user(self, code: str):
        try:
            auth = create_auth_handler()
            auth.get_auth_token(code)
            client = Client(auth)
            user = client.get_own_data()

            try:
                user_obj = self.get(id=user.id)
                user_obj.username = user.username
                user_obj.avatar = user.avatar_url
                user_obj.cover = user.cover.url
            except User.DoesNotExist:
                user_obj = User(
                    user.id,
                    user.username,
                    user.avatar_url,
                    user.cover.url
                )
            user_obj.save()

            return user_obj
        except requests.HTTPError:
            return


class User(models.Model):
    is_anonymous = False
    is_authenticated = True

    id = models.PositiveBigIntegerField(unique=True, primary_key=True)
    username = models.CharField(max_length=15)
    avatar = models.CharField()
    cover = models.CharField()

    is_admin = models.BooleanField(default=False)
    is_achievement_creator = models.BooleanField(default=False)

    REQUIRED_FIELDS = []
    # this field has to be unique but there is a scenario where
    # the username could not be unique
    USERNAME_FIELD = "id"
    objects = UserManager()

    def __str__(self):
        return self.username


class BeatmapInfo(models.Model):
    id = models.PositiveIntegerField(primary_key=True)
    artist = models.CharField()
    version = models.CharField()
    title = models.CharField()
    cover = models.CharField()
    star_rating = models.FloatField()


class Achievement(models.Model):
    name = models.CharField(max_length=64)
    category = models.CharField(max_length=32)
    description = models.CharField(max_length=256)
    tags = models.CharField(max_length=128)
    beatmap = models.ForeignKey(
        BeatmapInfo,
        related_name="achievements",
        on_delete=models.PROTECT,
        null=True
    )


class AchievementCompletion(models.Model):
    player = models.ForeignKey("Player", on_delete=models.RESTRICT, related_name="completions")
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name="completions")
    time_completed = models.DateTimeField()


class Team(models.Model):
    name = models.CharField(max_length=32, unique=True)
    icon = models.CharField(max_length=64, null=True)
    invite = models.CharField(max_length=16)
    points = models.PositiveIntegerField(default=0)


class Player(models.Model):
    user = models.ForeignKey(User, on_delete=models.RESTRICT)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="players")
    completed_achievements = models.ManyToManyField(
        Achievement,
        through=AchievementCompletion,
        related_name="players_completed"
    )
