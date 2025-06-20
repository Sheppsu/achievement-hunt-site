from django.conf import settings

import socket
import json


def _connect() -> socket.socket:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect(("localhost", settings.COMM_PORT))
    return sock


def get_osu_user(user_id):
    sock = _connect()
    sock.send(json.dumps({"user_id": user_id}).encode("utf-8"))
    data = json.loads(sock.recv(4096).decode("utf-8"))
    sock.close()
    return data
