from django.conf import settings

import os
import threading
import requests
import queue
import logging


__all__ = (
    "ExceptionLoggingMiddleware",
    "DiscordLogger"
)

_log = logging.getLogger(__name__)


def header_embed():
    return dict({
        "title": "Headers",
        "fields": list(),
        "color": 0x0000ff
    })


def _create_embeds(req, exc):
    embeds = []
    embeds.append({
        "title": f"{req.method} {req.path}",
        "description": str(exc),
        "color": 0xff0000,
    })
    embeds.append(header_embed())
    for name, value in req.headers.items():
        if len(embeds[-1]["fields"]) == 25:
            embeds.append(header_embed())
        embeds[-1]["fields"].append({"name": name, "value": value})

    return embeds


class DiscordLogger:
    WEBHOOK_URL = os.getenv("WEBHOOK_URL")

    def __init__(self):
        if not settings.DEBUG and self.WEBHOOK_URL is None:
            raise RuntimeError("Missing WEBHOOK_URL env var")

        self._queue: queue.Queue = queue.Queue()
        self._running: threading.Event = threading.Event()

    def run(self):
        self._running.set()
        threading.Thread(target=self._loop).start()

    def _loop(self):
        while self._running.is_set():
            embeds = self._queue.get()
            try:
                resp = requests.post(self.WEBHOOK_URL, json={"embeds": embeds})
                resp.raise_for_status()
            except Exception as exc:
                _log.exception("Failed to send completion to discord", exc_info=exc)

        self._running.clear()

    def submit(self, req, exc):
        self._queue.put(_create_embeds(req, exc))

        if not self._running.is_set():
            self.run()

    def stop(self):
        self._running.clear()


class ExceptionLoggingMiddleware:
    def __init__(self, get_response) -> None:
        self.get_response = get_response

    def __call__(self, *args, **kwargs):
        return self.get_response(*args, **kwargs)

    def process_exception(self, req, exc) -> None:
        if not settings.DEBUG:
            settings.DISCORD_LOGGER.submit(req, exc)
