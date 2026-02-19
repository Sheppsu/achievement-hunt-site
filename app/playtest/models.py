from __future__ import annotations

import secrets
import functools
from enum import IntEnum, IntFlag
from dataclasses import dataclass
from dataclasses import field

from django.db import models

from achievements.models import User


# dataclasses


class Mods(IntFlag):
    NOMOD = 0
    NOFAIL = 1 << 0
    EASY = 1 << 1
    TOUCHSCREEN = 1 << 2  # old: 'NOVIDEO'
    HIDDEN = 1 << 3
    HARDROCK = 1 << 4
    SUDDENDEATH = 1 << 5
    DOUBLETIME = 1 << 6
    RELAX = 1 << 7
    HALFTIME = 1 << 8
    NIGHTCORE = 1 << 9
    FLASHLIGHT = 1 << 10
    AUTOPLAY = 1 << 11
    SPUNOUT = 1 << 12
    AUTOPILOT = 1 << 13
    PERFECT = 1 << 14
    KEY4 = 1 << 15
    KEY5 = 1 << 16
    KEY6 = 1 << 17
    KEY7 = 1 << 18
    KEY8 = 1 << 19
    FADEIN = 1 << 20
    RANDOM = 1 << 21
    CINEMA = 1 << 22
    TARGET = 1 << 23
    KEY9 = 1 << 24
    KEYCOOP = 1 << 25
    KEY1 = 1 << 26
    KEY3 = 1 << 27
    KEY2 = 1 << 28
    SCOREV2 = 1 << 29
    MIRROR = 1 << 30


class GameMode(IntEnum):
    VANILLA_OSU = 0
    VANILLA_TAIKO = 1
    VANILLA_CATCH = 2
    VANILLA_MANIA = 3

    RELAX_OSU = 4
    RELAX_TAIKO = 5
    RELAX_CATCH = 6
    RELAX_MANIA = 7  # unused

    AUTOPILOT_OSU = 8
    AUTOPILOT_TAIKO = 9  # unused
    AUTOPILOT_CATCH = 10  # unused
    AUTOPILOT_MANIA = 11  # unused

    @classmethod
    def from_params(cls, mode_vn: int, mods: Mods) -> GameMode:
        mode = mode_vn

        if mods & Mods.AUTOPILOT:
            mode += 8
        elif mods & Mods.RELAX:
            mode += 4

        return cls(mode)

    @classmethod
    @functools.cache
    def valid_gamemodes(cls) -> list[GameMode]:
        ret = []
        for mode in cls:
            if mode not in (
                cls.RELAX_MANIA,
                cls.AUTOPILOT_TAIKO,
                cls.AUTOPILOT_CATCH,
                cls.AUTOPILOT_MANIA,
            ):
                ret.append(mode)
        return ret

    @property
    def as_vanilla(self) -> int:
        return self.value % 4


class Action(IntEnum):
    """The client's current app.state."""

    Idle = 0
    Afk = 1
    Playing = 2
    Editing = 3
    Modding = 4
    Multiplayer = 5
    Watching = 6
    Unknown = 7
    Testing = 8
    Submitting = 9
    Paused = 10
    Lobby = 11
    Multiplaying = 12
    OsuDirect = 13


@dataclass
class Status:
    """The current status of a player."""

    action: Action = Action.Idle
    info_text: str = ""
    map_md5: str = ""
    mods: Mods = Mods.NOMOD
    mode: GameMode = GameMode.VANILLA_OSU
    map_id: int = 0


class Grade(IntEnum):
    # NOTE: these are implemented in the opposite order
    # as osu! to make more sense with <> operators.
    N = 0
    F = 1
    D = 2
    C = 3
    B = 4
    A = 5
    S = 6  # S
    SH = 7  # HD S
    X = 8  # SS
    XH = 9  # HD SS


def default_grades():
    return {Grade.XH: 0, Grade.X: 0, Grade.SH: 0, Grade.S: 0, Grade.A: 0}


@dataclass
class ModeData:
    """A player's stats in a single gamemode."""

    tscore: int = 0
    rscore: int = 0
    pp: int = 727
    acc: float = 0.67
    plays: int = 0
    playtime: int = 999
    max_combo: int = 1000
    total_hits: int = 1
    rank: int = 0  # global

    grades: dict[Grade, int] = field(default_factory=default_grades)  # XH, X, SH, S, A


# models


class PlaytestAccount(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    passkey = models.CharField(max_length=32)
    osu_token = models.CharField(max_length=256)
    utc_offset = models.SmallIntegerField(default=0)
    recent_scores = models.JSONField(default=list)
    response_data = models.BinaryField(default=b"")  # will be sent with next request from player

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self._response_data = b""

    @staticmethod
    def generate_passkey():
        return secrets.token_hex(16)

    @classmethod
    def from_user(cls, user: User):
        passkey = cls.generate_passkey()
        osu_token = secrets.token_hex(32)
        return PlaytestAccount(user=user, passkey=passkey, osu_token=osu_token, utc_offset=0)

    @property
    def geoloc(self):
        return {"latitude": 0, "longitude": 0, "country": {"acronym": "jp", "numeric": 111}}

    @property
    def bancho_priv(self):
        return 1

    @property
    def status(self):
        return Status()

    @property
    def gm_stats(self):
        return ModeData()

    def add_packet(self, data: bytes):
        self._response_data += data

    def save_packet(self, data: bytes):
        self.response_data += data
        self.save()

    def get_response_data(self):
        if len(self.response_data) > 0:
            response_data = self.response_data + self._response_data
            self.response_data = b""
            self.save()
            return response_data
        return self._response_data


class Match:
    pass
