import hashlib

from django.http import HttpResponse

from .. import packets
from ..packets import ClientPackets, BasePacket, BanchoPacketReader
from ..models import *
from ..util import account_from_credentials


# from https://github.com/osuAkatsuki/bancho.py
def parse_osu_login_data(data: bytes):
    (
        username,
        password_md5,
        remainder,
    ) = data.decode().split("\n", maxsplit=2)

    (
        osu_version,
        utc_offset,
        display_city,
        client_hashes,
        pm_private,
    ) = remainder.split("|", maxsplit=4)

    (
        osu_path_md5,
        adapters_str,
        adapters_md5,
        uninstall_md5,
        disk_signature_md5,
    ) = client_hashes[
        :-1
    ].split(":", maxsplit=4)

    return {
        "username": username,
        "password_md5": password_md5.encode(),
        "osu_version": osu_version,
        "utc_offset": int(utc_offset),
        "display_city": display_city == "1",
        "pm_private": pm_private == "1",
        "osu_path_md5": osu_path_md5,
        "adapters_str": adapters_str,
        "adapters_md5": adapters_md5,
        "uninstall_md5": uninstall_md5,
        "disk_signature_md5": disk_signature_md5,
    }


def handle_osu_login(req):
    try:
        login_data = parse_osu_login_data(req.body)
    except ValueError:
        return HttpResponse(status=400)

    account = account_from_credentials(login_data["username"], login_data["password_md5"])
    if account is None:
        return HttpResponse(
            packets.login_reply(packets.LoginFailureReason.AUTHENTICATION_FAILED)
            + packets.notification("Invalid login"),
            headers={"cho-token": "invalid-request"},
        )

    osu_token = secrets.token_urlsafe(32)
    account.osu_token = osu_token
    account.utc_offset = login_data["utc_offset"]
    account.save()

    account.add_packet(
        packets.protocol_version(19)
        + packets.login_reply(account.user_id)
        + packets.bancho_privileges(1)
        + packets.notification("Successfully logged in")
        + packets.channel_info_end()
        + packets.user_presence(account)
        + packets.user_stats(account)
    )

    return HttpResponse(account.get_response_data(), headers={"cho-token": osu_token})


def index(req):
    osu_token = req.headers.get("osu-token")
    if osu_token is None or osu_token == "":
        return handle_osu_login(req)

    account = PlaytestAccount.objects.select_related("user").filter(osu_token=osu_token).first()
    if account is None:
        return HttpResponse(packets.notification("Invalid token, reconnecting...") + packets.restart_server(0))

    data = bytearray()

    with memoryview(req.body) as body:
        for packet in BanchoPacketReader(body, PACKETS):
            resp = packet.handle(account)
            if resp is None:
                continue

            for resp_packet in resp:
                data += resp_packet

    account.add_packet(bytes(data))

    return HttpResponse(account.get_response_data())


PACKETS = {}


def packet(packet_type):
    def wrapper(func):
        PACKETS[packet_type] = func
        return func

    return wrapper


@packet(ClientPackets.PING)
class Ping(BasePacket):
    def handle(self, player: PlaytestAccount) -> None:
        return


@packet(ClientPackets.REQUEST_STATUS_UPDATE)
class RequestStatusUpdate(BasePacket):
    def handle(self, player: PlaytestAccount) -> None:
        yield packets.user_stats(player)
