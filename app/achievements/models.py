import time

import requests

from django.conf import settings
from django.db import models
from osu import Client

from common.serializer import SerializableModel
from common.util import create_auth_handler
from common.comm import get_osu_user

osu_client = settings.OSU_CLIENT


class UserManager(models.Manager):
    def create_user(self, code: str):
        try:
            auth = create_auth_handler()
            auth.get_auth_token(code)
            client = Client(auth)
            user = client.get_own_data()
            return self._create_user(user.id, user.username, user.avatar_url, user.cover.url)
        except requests.HTTPError:
            return

    def create_user_from_id(self, user_id):
        user = get_osu_user(user_id)
        return self._create_user(user["id"], user["username"], user["avatar"], user["cover"])

    def _create_user(self, user_id, username, avatar, cover):
        try:
            user_obj = self.get(id=user_id)
            user_obj.username = username
            user_obj.avatar = avatar
            user_obj.cover = cover or ""
        except User.DoesNotExist:
            user_obj = User(user_id, username, avatar, cover or "")
        user_obj.save()

        return user_obj


class User(SerializableModel):
    is_anonymous = False
    is_authenticated = True

    id = models.PositiveBigIntegerField(unique=True, primary_key=True)
    username = models.CharField(max_length=32)
    avatar = models.CharField()
    cover = models.CharField()

    is_admin = models.BooleanField(default=False)
    is_achievement_creator = models.BooleanField(default=False)

    REQUIRED_FIELDS = []
    # this field has to be unique but there is a scenario where
    # the username could not be unique
    USERNAME_FIELD = "id"
    objects = UserManager()

    @property
    def is_staff(self):
        return self.is_admin or self.is_achievement_creator

    class Serialization:
        FIELDS = ["id", "username", "avatar", "is_admin", "is_achievement_creator"]

    def __str__(self):
        return self.username


class EventIteration(SerializableModel):
    name = models.CharField(max_length=64, default="")
    start = models.DateTimeField()
    end = models.DateTimeField()
    registration_end = models.DateTimeField()
    registration_open = models.BooleanField(default=False)
    description = models.JSONField(default=list)
    faq = models.JSONField(default=list)
    banner = models.CharField(max_length=32, null=True, default=None)
    solutions_released = models.BooleanField(default=False)

    def has_registration_ended(self):
        return time.time() >= self.registration_end.timestamp()

    def has_ended(self):
        return time.time() >= self.end.timestamp()

    def has_started(self):
        return time.time() >= self.start.timestamp() - 5

    class Serialization:
        FIELDS = ["id", "name", "start", "end", "registration_end", "registration_open", "description", "faq", "banner"]


class AchievementBatch(SerializableModel):
    iteration = models.ForeignKey(EventIteration, on_delete=models.CASCADE)
    release_time = models.DateTimeField()

    class Serialization:
        FIELDS = ["id", "release_time"]


class BeatmapInfo(SerializableModel):
    id = models.PositiveIntegerField(primary_key=True)
    artist = models.CharField()
    version = models.CharField()
    title = models.CharField()
    cover = models.CharField()
    star_rating = models.FloatField()

    @classmethod
    def _get_or_create(cls, info):
        beatmap = BeatmapInfo.objects.filter(id=info.id).first()
        if beatmap is None:
            beatmap = BeatmapInfo.objects.create(
                id=info.id,
                artist=info.beatmapset.artist,
                title=info.beatmapset.title,
                version=info.version,
                cover=info.beatmapset.covers.cover,
                star_rating=info.difficulty_rating,
            )
        else:
            beatmap.artist = info.beatmapset.artist
            beatmap.title = info.beatmapset.title
            beatmap.version = info.version
            beatmap.cover = info.beatmapset.covers.cover
            beatmap.star_rating = info.difficulty_rating
            beatmap.save()

        return beatmap

    @classmethod
    def get_or_create(cls, beatmap_id):
        info = osu_client.get_beatmap(beatmap_id)
        return cls._get_or_create(info)

    @classmethod
    def bulk_get_or_create(cls, beatmap_ids):
        beatmaps = osu_client.get_beatmaps(beatmap_ids)
        if len(beatmaps) != len(beatmap_ids):
            return

        return list(map(cls._get_or_create, beatmaps))

    class Serialization:
        FIELDS = ["id", "artist", "version", "title", "cover", "star_rating"]


class Achievement(SerializableModel):
    name = models.CharField(max_length=128)
    description = models.CharField(max_length=2048)
    solution = models.CharField(max_length=2048)
    audio = models.CharField(default="")
    tags = models.CharField(max_length=128)
    creator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, default=None)
    created_at = models.DateTimeField()
    last_edited_at = models.DateTimeField()
    batch = models.ForeignKey(AchievementBatch, on_delete=models.SET_NULL, null=True, default=None)
    is_desc = models.BooleanField(default=True)
    completion_count = models.PositiveSmallIntegerField(default=0)
    worth_points = models.BooleanField(default=True)

    class Serialization:
        FIELDS = ["id", "name", "description", "audio", "tags", "created_at", "last_edited_at", "worth_points"]


class BeatmapConnection(SerializableModel):
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name="beatmaps")
    info = models.ForeignKey(BeatmapInfo, on_delete=models.CASCADE)
    hide = models.BooleanField(default=False)

    class Serialization:
        FIELDS = ["hide"]


class AchievementCompletionPlacement(SerializableModel):
    value = models.BigIntegerField()
    is_float = models.BooleanField()
    place = models.PositiveSmallIntegerField()

    class Serialization:
        FIELDS = ["value", "is_float", "place"]

    def serialize(self, *args, **kwargs):
        data = super().serialize(*args, **kwargs)
        if data.pop("is_float"):
            data["value"] /= 10**6
        return data


class AchievementCompletion(SerializableModel):
    player = models.ForeignKey("Player", on_delete=models.RESTRICT, related_name="completions")
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name="completions")
    time_completed = models.DateTimeField()
    placement = models.ForeignKey(AchievementCompletionPlacement, on_delete=models.CASCADE, null=True)
    time_placement = models.PositiveSmallIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["player", "achievement"], name="unique_achievement"),
        ]

    class Serialization:
        FIELDS = ["time_completed", "time_placement"]


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
    name = models.CharField(max_length=32)
    anonymous_name = models.CharField(max_length=32)
    icon = models.CharField(max_length=64, null=True)
    points = models.PositiveIntegerField(default=0)
    iteration = models.ForeignKey(EventIteration, on_delete=models.CASCADE)
    accepts_free_agents = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["name", "iteration_id"], name="unique_iteration_team_name"),
            models.UniqueConstraint(fields=["anonymous_name", "iteration_id"], name="unique_iteration_anon_team_name"),
        ]

    class Serialization:
        FIELDS = ["id", "name", "anonymous_name", "icon", "points", "accepts_free_agents"]


class Player(SerializableModel):
    user = models.ForeignKey(User, on_delete=models.RESTRICT)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="players")
    team_admin = models.BooleanField(default=False)
    completed_achievements = models.ManyToManyField(
        Achievement, through=AchievementCompletion, related_name="players_completed"
    )

    class Serialization:
        FIELDS = ["id", "user_id", "team_admin"]


class ChatMessage(SerializableModel):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    sent_at = models.DateTimeField(auto_now_add=True)
    message = models.CharField(max_length=512)

    class Serialization:
        FIELDS = ["id", "sent_at", "message"]


class Registration(SerializableModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    iteration = models.ForeignKey(EventIteration, on_delete=models.CASCADE)
    is_screened = models.BooleanField(default=False)
    is_free_agent = models.BooleanField(default=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "iteration"], name="unique_registration")]

    class Serialization:
        FIELDS = ["is_screened", "is_free_agent"]


class Announcement(SerializableModel):
    iteration = models.ForeignKey(EventIteration, on_delete=models.CASCADE)
    created_at = models.DateTimeField()
    title = models.CharField(max_length=64)
    message = models.TextField()

    class Serialization:
        FIELDS = ["id", "created_at", "title", "message"]


class TeamInvite(SerializableModel):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="invites")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="invites")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["team", "user"], name="unique_team_invite"),
        ]

    class Serialization:
        FIELDS = ["id", "team_id", "user_id"]
