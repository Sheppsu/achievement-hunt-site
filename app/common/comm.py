from django.conf import settings

import socket
import json


def _send(data, close=True):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect(("localhost", settings.COMM_PORT))
    sock.send(json.dumps(data).encode("utf-8"))
    if close:
        sock.close()
    return sock


def _send_and_recv(data):
    sock = _send(data, close=False)
    return json.loads(sock.recv(4096).decode("utf-8"))


def get_osu_user(user_id):
    return _send_and_recv({"evt": 1, "user_id": user_id})


def refresh_achievements_on_server():
    _send({"evt": 2})
