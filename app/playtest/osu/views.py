from py3rijndael import Pkcs7Padding
from py3rijndael import RijndaelCbc
from base64 import b64decode

from django.http import HttpResponse

from ..models import PlaytestAccount
from ..util import account_from_credentials


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


def handle_score_submission(req):
    score_data = req.POST.get("score")
    client_hash_b64 = req.POST.get("s")
    iv_b64 = req.POST.get("iv")
    osu_version = req.POST.get("osuver")
    pw_md5 = req.POST.get("pass")
    if any(val is None for val in (score_data, client_hash_b64, iv_b64, osu_version, pw_md5)):
        return HttpResponse(b"")

    score_data, client_hash_decoded = decrypt_score_aes_data(score_data.encode(), client_hash_b64, iv_b64, osu_version)

    beatmap_hash = score_data[0]
    username = score_data[1]
    if username[-1] == " ":
        username = username[:-1]

    account = account_from_credentials(username, pw_md5)
    if account is None:
        return HttpResponse(b"")

    score = {"accuracy": 100.0, "beatmap_id": 0}

    return HttpResponse(b"")
