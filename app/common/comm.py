from django.conf import settings

import socket
import json
import struct


def _send(data, close=True):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect(("localhost", settings.COMM_PORT))
    payload = json.dumps(data).encode("utf-8")
    sock.send(struct.pack(">I", len(payload)) + payload)
    if close:
        sock.close()
    return sock


def _send_and_recv(data):
    sock = _send(data, close=False)
    (payload_len,) = struct.unpack(">I", sock.recv(4))
    return json.loads(sock.recv(payload_len).decode("utf-8"))


def refresh_achievements_on_server():
    _send({"evt": 2})


def submit_playtest_scores(user, scores):
    return _send_and_recv({"evt": 1, "user": user, "scores": scores})


def request_algorithm_docs():
    return _send_and_recv({"evt": 3})
