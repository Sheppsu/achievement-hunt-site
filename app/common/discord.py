import os
import threading
import requests
import queue
import logging


__all__ = (
    "DiscordLogger",
)


_log = logging.getLogger(__name__)


def header_embed():
    return dict({
        "title": "Headers",
        "fields": list(),
        "color": 0x0000ff
    })


def _create_error_embeds(req, exc):
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
    STAFF_WEBHOOK_URL = os.getenv("STAFF_WEBHOOK_URL")

    def __init__(self):
        self._queue: queue.Queue = queue.Queue()
        self._running: threading.Event = threading.Event()

    def run(self):
        self._running.set()
        t = threading.Thread(target=self._loop)
        t.daemon = True
        t.start()

    def _loop(self):
        while self._running.is_set():
            try:
                embeds, url = self._queue.get(timeout=3)
                resp = requests.post(url, json={"embeds": embeds})
                resp.raise_for_status()
            except queue.Empty:
                pass
            except Exception as exc:
                _log.exception("Failed to send completion to discord", exc_info=exc)

        self._running.clear()

    def submit_embeds(self, embeds, url):
        self._queue.put((embeds, url))

        if not self._running.is_set():
            self.run()

    def submit_err(self, req, exc):
        if self.WEBHOOK_URL is None:
            _log.warning("Unable to log error, WEBHOOK_URL is None", exc_info=exc)
            return

        self.submit_embeds(_create_error_embeds(req, exc), self.WEBHOOK_URL)

    def submit_achievement(self, achievement, edited=False):
        if self.STAFF_WEBHOOK_URL is None:
            _log.warning("Unable to log new achievement, STAFF_WEBHOOK_URL is None")
            return

        embed = {
            "title": "Achievement edited" if edited else "New achievement",
            "url": f"https://cta.sheppsu.me/staff/achievements/{achievement.id}",
            "description": achievement.name,
            "color": 0xF6AF49 if edited else 0x2DD286,
            "footer": {
                "text": achievement.creator.username,
                "icon_url": achievement.creator.avatar
            }
        }

        self.submit_embeds([embed], self.STAFF_WEBHOOK_URL)

    def submit_comment(self, comment):
        if self.STAFF_WEBHOOK_URL is None:
            _log.warning("Unable to log new comment, STAFF_WEBHOOK_URL is None")
            return

        embed = {
            "title": "New comment",
            "url": f"https://cta.sheppsu.me/staff/achievements/{comment.achievement_id}",
            "description": f"Reply to **{comment.achievement.name}**:\n" + comment.msg,
            "color": 0x31A6CE,
            "footer": {
                "text": comment.user.username,
                "icon_url": comment.user.avatar
            }
        }

        self.submit_embeds([embed], self.STAFF_WEBHOOK_URL)

    def stop(self):
        self._running.clear()
