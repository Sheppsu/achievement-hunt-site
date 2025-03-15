from django.db import models
from django.conf import settings

import requests
from osu import Client

from common import create_auth_handler, SerializableModel


osu_client = settings.OSU_CLIENT


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
                user_obj.cover = user.cover.url or ""
            except User.DoesNotExist:
                user_obj = User(
                    user.id,
                    user.username,
                    user.avatar_url,
                    user.cover.url or ""
                )
            user_obj.save()

            return user_obj
        except requests.HTTPError:
            return


class User(SerializableModel):
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

    class Serialization:
        FIELDS = ["id", "username", "avatar", "cover", "is_admin", "is_achievement_creator"]

    def __str__(self):
        return self.username


class BeatmapInfo(SerializableModel):
    id = models.PositiveIntegerField(primary_key=True)
    artist = models.CharField()
    version = models.CharField()
    title = models.CharField()
    cover = models.CharField()
    star_rating = models.FloatField()

    @classmethod
    def get_or_create(cls, beatmap_id):
        beatmap = BeatmapInfo.objects.filter(id=beatmap_id).first()
        if beatmap is None:
            try:
                info = osu_client.get_beatmap(beatmap_id)
                beatmap = BeatmapInfo.objects.create(
                    id=info.id,
                    artist=info.beatmapset.artist,
                    title=info.beatmapset.title,
                    version=info.version,
                    cover=info.beatmapset.covers.cover,
                    star_rating=info.difficulty_rating
                )
            except:
                return

        return beatmap

    class Serialization:
        FIELDS = ["id", "artist", "version", "title", "cover", "star_rating"]


class Achievement(SerializableModel):
    name = models.CharField(max_length=128)
    description = models.CharField(max_length=2048)
    solution = models.CharField(max_length=2048)
    audio = models.CharField(default="")
    tags = models.CharField(max_length=128)
    beatmap = models.ForeignKey(
        BeatmapInfo,
        related_name="achievements",
        on_delete=models.PROTECT,
        null=True
    )
    release_time = models.DateTimeField(null=True)
    creator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, default=None)

    class Serialization:
        FIELDS = ["id", "name", "description", "audio", "tags", "beatmap", "release_time"]


class AchievementCompletionPlacement(SerializableModel):
    value = models.BigIntegerField()
    is_float = models.BooleanField()
    place = models.PositiveSmallIntegerField()

    class Serialization:
        FIELDS = ["value", "is_float", "place"]

    def serialize(self, *args, **kwargs):
        data = super().serialize(*args, **kwargs)
        return {"value": data["value"] / (10**6) if data["is_float"] else data["value"], "place": data["place"]}


class AchievementCompletion(SerializableModel):
    player = models.ForeignKey("Player", on_delete=models.RESTRICT, related_name="completions")
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name="completions")
    time_completed = models.DateTimeField()
    placement = models.ForeignKey(AchievementCompletionPlacement, on_delete=models.CASCADE, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["player", "achievement"], name="unique_achievement"),
        ]

    class Serialization:
        FIELDS = ["time_completed"]


class AchievementComment(SerializableModel):
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    msg = models.CharField(max_length=4096)
    posted_at = models.DateTimeField()

    class Serialization:
        FIELDS = ["id", "msg", "posted_at"]


class AchievementVote(SerializableModel):
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name="votes")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="votes")

    class Serialization:
        FIELDS = ["id", "user_id"]


class Team(SerializableModel):
    name = models.CharField(max_length=32, unique=True)
    icon = models.CharField(max_length=64, null=True)
    invite = models.CharField(max_length=16)
    points = models.PositiveIntegerField(default=0)

    class Serialization:
        FIELDS = ["id", "name", "icon", "invite", "points"]


class Player(SerializableModel):
    user = models.ForeignKey(User, on_delete=models.RESTRICT)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="players")
    team_admin = models.BooleanField(default=False)
    completed_achievements = models.ManyToManyField(
        Achievement,
        through=AchievementCompletion,
        related_name="players_completed"
    )

    class Serialization:
        FIELDS = ["id", "user_id", "team_admin"]
