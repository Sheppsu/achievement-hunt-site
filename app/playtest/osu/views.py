from py3rijndael import Pkcs7Padding
from py3rijndael import RijndaelCbc
from base64 import b64decode
from datetime import datetime, timezone
import osu

from django.http import HttpResponse

from .. import packets
from ..models import PlaytestAccount
from ..util import account_from_credentials
from common.osu_api import get_client
from common.comm import submit_playtest_scores


def empty_reply(req):
    return HttpResponse(b"")


def decrypt_score_aes_data(
    # to decode
    score_data_b64: bytes,
    client_hash_b64: bytes,
    # used for decoding
    iv_b64: bytes,
    osu_version: str,
) -> tuple[list[str], str]:
    """Decrypt the base64'ed score data."""

    # attempt to decrypt score data
    aes = RijndaelCbc(
        key=f"osu!-scoreburgr---------{osu_version}".encode(),
        iv=b64decode(iv_b64),
        padding=Pkcs7Padding(32),
        block_size=32,
    )

    score_data = aes.decrypt(b64decode(score_data_b64)).decode().split(":")
    client_hash_decoded = aes.decrypt(b64decode(client_hash_b64)).decode()

    # score data is delimited by colons (:).
    return score_data, client_hash_decoded


def calculate_accuracy(mode, n300, n100, n50, ngeki, nkatu, nmiss) -> float:
    # https://github.com/osuAkatsuki/bancho.py/blob/6431993b8809914b60d741763afac9bf82ebb5f7/app/objects/score.py#L374C5-L438C63
    if mode == 0:  # osu!
        total = n300 + n100 + n50 + nmiss

        if total == 0:
            return 0.0

        return 100.0 * ((n300 * 300.0) + (n100 * 100.0) + (n50 * 50.0)) / (total * 300.0)

    elif mode == 1:  # osu!taiko
        total = n300 + n100 + nmiss

        if total == 0:
            return 0.0

        return 100.0 * ((n100 * 0.5) + n300) / total

    elif mode == 2:  # osu!catch
        total = n300 + n100 + n50 + nkatu + nmiss

        if total == 0:
            return 0.0

        return 100.0 * (n300 + n100 + n50) / total

    elif mode == 3:  # osu!mania
        total = n300 + n100 + n50 + ngeki + nkatu + nmiss

        if total == 0:
            return 0.0

        return 100.0 * ((n50 * 50.0) + (n100 * 100.0) + (nkatu * 200.0) + ((n300 + ngeki) * 300.0)) / (total * 300.0)

    return 0.0


def get_timestamp_now():
    return datetime.now(timezone.utc).isoformat()


def chart_entry(name: str, before: float | None, after: float | None) -> str:
    return f"{name}Before:{before or ''}|{name}After:{after or ''}"


def handle_score_submission(req):
    score_data = req.POST.get("score")
    client_hash_b64 = req.POST.get("s")
    iv_b64 = req.POST.get("iv")
    osu_version = req.POST.get("osuver")
    pw_md5 = req.POST.get("pass")
    if any(val is None for val in (score_data, client_hash_b64, iv_b64, osu_version, pw_md5)):
        return HttpResponse(b"error: invalid request", status=400)

    score_data, client_hash_decoded = decrypt_score_aes_data(score_data.encode(), client_hash_b64, iv_b64, osu_version)

    beatmap_hash = score_data[0]
    username = score_data[1]
    if username[-1] == " ":
        username = username[:-1]

    account = account_from_credentials(username, pw_md5.encode())
    if account is None:
        return HttpResponse(b"error: not logged in", status=403)

    osu_client = get_client()
    beatmap = osu_client.http.make_request(osu.Path.beatmap_lookup(), checksum=beatmap_hash)

    client_checksum = score_data[2]

    for score in account.recent_scores:
        if score.get("checksum") == client_checksum:
            return HttpResponse(b"error: no")

    n300 = int(score_data[3])
    n100 = int(score_data[4])
    n50 = int(score_data[5])
    ngeki = int(score_data[6])
    nkatu = int(score_data[7])
    nmiss = int(score_data[8])
    score = int(score_data[9])
    max_combo = int(score_data[10])
    perfect = score_data[11] == "True"
    grade = score_data[12]
    mods = osu.Mods(int(score_data[13]))
    passed = score_data[14] == "True"
    mode = int(score_data[15])
    accuracy = calculate_accuracy(mode, n300, n100, n50, ngeki, nkatu, nmiss)

    score = {
        "accuracy": accuracy,
        "beatmap_id": beatmap["id"],
        "ended_at": get_timestamp_now(),
        "max_combo": int(score_data[10]),
        "maximum_statistics": {"great": max_combo},
        "mods": [{"acronym": osu.Mod[mod.name].value, "settings": None} for mod in mods],
        "passed": passed,
        "rank": grade,
        "ruleset_id": mode,
        "statistics": {"perfect": ngeki, "great": n300, "good": nkatu, "ok": n100, "meh": n50, "miss": nmiss},
        "total_score": 0,  # TODO
        "user_id": account.user.id,
        "best_id": 0,
        "id": 0,
        "legacy_perfect": perfect,
        "pp": 0.0,  # TODO
        "replay": False,
        "type": "solo_score",
        "user": {
            "avatar_url": account.user.avatar,
            "country_code": "US",
            "default_group": "",
            "id": account.user.id,
            "is_active": True,
            "is_bot": False,
            "is_deleted": False,
            "is_online": True,
            "is_supporter": True,
            "last_visit": get_timestamp_now(),
            "pm_friends_only": False,
            "profile_colour": None,
            "username": account.user.username,
        },
        "legacy_total_score": score,
        "beatmap": beatmap,
        "beatmapset": beatmap["beatmapset"],
        "checksum": client_checksum,
    }

    account.recent_scores.append(score)
    if len(account.recent_scores) > 100:
        account.recent_scores.pop(0)
    account.save()

    user = osu_client.http.make_request(
        osu.Path.get_user(account.user.id, osu.GameModeInt(mode).get_str_equivalent().value)
    )

    completions = submit_playtest_scores(user, account.recent_scores)
    if len(completions) > 0:
        completion_str = "; ".join(completion["achievement_name"] for completion in completions)
        account.save_packet(packets.notification(f"Completed {len(completions)} achievements: {completion_str}"))

    chart_entries = (
        chart_entry("rank", None, 1),
        chart_entry("rankedScore", None, 0),
        chart_entry("totalScore", None, 0),
        chart_entry("maxCombo", None, max_combo),
        chart_entry(
            "accuracy",
            None,
            round(accuracy, 2),
        ),
        chart_entry("pp", None, 727),
    )
    submission_charts = [
        # beatmap info chart
        f"beatmapId:{beatmap['id']}",
        f"beatmapSetId:{beatmap['beatmapset']['id']}",
        f"beatmapPlaycount:{beatmap['playcount']}",
        f"beatmapPasscount:{beatmap['passcount']}",
        f"approvedDate:{beatmap['last_updated']}",
        "\n",
        # beatmap ranking chart
        "chartId:beatmap",
        f"chartUrl:https://osu.ppy.sh/b/{beatmap['id']}",
        "chartName:Beatmap Ranking",
        *chart_entries,
        f"onlineScoreId:0",
        "\n",
        # overall ranking chart
        "chartId:overall",
        f"chartUrl:https://osu.ppy.sh/u/{account.user.id}",
        "chartName:Overall Ranking",
        *chart_entries,
        f"achievements-new:",
    ]

    return HttpResponse("|".join(submission_charts).encode())
