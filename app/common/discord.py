import os
import threading
import requests
import queue
import logging
from datetime import datetime, timezone


__all__ = (
    "DiscordLogger",
)


_log = logging.getLogger(__name__)


def _create_error_embeds(req, exc):
    embeds = []
    embeds.append({
        "title": f"{req.method} {req.path}",
        "description": str(exc),
        "color": 0xff0000,
    })

    return embeds


class DiscordLogger:
    ERROR_WEBHOOK_URL = os.getenv("ERROR_WEBHOOK_URL")
    STAFF_WEBHOOK_URL = os.getenv("STAFF_WEBHOOK_URL")
    ANNOUNCEMENT_WEBHOOK_URL = os.getenv("ANNOUNCEMENT_WEBHOOK_URL")

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
                embeds, url, ping = self._queue.get(timeout=3)

                payload = {"embeds": embeds}
                if ping is not None:
                    payload["content"] = f"<@&{ping}>"

                resp = requests.post(url, json=payload)
                resp.raise_for_status()
            except queue.Empty:
                pass
            except Exception as exc:
                _log.exception("Failed to send completion to discord", exc_info=exc)

        self._running.clear()

    def submit_embeds(self, embeds, url, ping=None):
        self._queue.put((embeds, url, ping))

        if not self._running.is_set():
            self.run()

    def submit_err(self, req, exc):
        if self.ERROR_WEBHOOK_URL is None:
            _log.warning("Unable to log error, WEBHOOK_URL is None", exc_info=exc)
            return

        self.submit_embeds(_create_error_embeds(req, exc), self.ERROR_WEBHOOK_URL)

    def submit_achievement(self, req, achievement, edited=False):
        if self.STAFF_WEBHOOK_URL is None:
            _log.warning("Unable to log new achievement, STAFF_WEBHOOK_URL is None")
            return

        embed = {
            "title": "Achievement edited" if edited else "New achievement",
            "url": f"https://cta.sheppsu.me/staff/achievements/{achievement.id}",
            "description": achievement.name,
            "color": 0xF6AF49 if edited else 0x2DD286,
            "footer": {
                "text": req.user.username,
                "icon_url": req.user.avatar
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

    def submit_announcement(self, announcement):
        if self.ANNOUNCEMENT_WEBHOOK_URL is None:
            _log.warning("Unable to log announcement, ANNOUNCEMENT_WEBHOOK_URL is None")
            return

        is_bug = announcement.title.startswith("[BUG]")

        embed = {
            "title": announcement.title,
            "description": announcement.message,
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "color": 0xFCCB38 if is_bug else 0x1281FF,
            "footer": {
                "text": announcement.iteration.name
            }
        }

        ping = 1307176728019603548 if is_bug else None

        self.submit_embeds([embed], self.ANNOUNCEMENT_WEBHOOK_URL, ping)

    def stop(self):
        self._running.clear()
