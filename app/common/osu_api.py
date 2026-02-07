from django.conf import settings

import osu
import redis
from redis.lock import Lock as RedisLock
import time


osu_client: osu.Client = None  # type: ignore
# TODO: would be better to use transactions instead of locks
#       in relation to all the redis interactions in this code
redis_client = redis.Redis(settings.REDIS_HOST, settings.REDIS_PORT)
OSU_AUTH_URL = osu.AuthHandler(
    settings.OSU_CLIENT_ID, settings.OSU_CLIENT_SECRET, settings.OSU_REDIRECT_URL, osu.Scope.identify()
).get_auth_url()


class AuthData:
    KEY_TOKEN = "osu-api-token"
    KEY_REFRESH_TOKEN = "osu-api-refresh-token"

    def set_data(self, token, refresh_token, expires_in):
        redis_client.set(self.KEY_TOKEN, token, expires_in - 10)
        if refresh_token is not None:
            redis_client.set(self.KEY_REFRESH_TOKEN, refresh_token)

    def __setattr__(self, name, value):
        if name == "refresh_token":
            redis_client.set(self.KEY_REFRESH_TOKEN, value)

    @property
    def token(self):
        return redis_client.get(self.KEY_TOKEN).decode("utf-8")

    @property
    def refresh_token(self):
        return redis_client.get(self.KEY_REFRESH_TOKEN).decode("utf-8")

    @property
    def has_expired(self):
        return redis_client.expiretime(self.KEY_TOKEN) <= time.time()


# redis version of osu.py rate limiter
class RateLimitHandler:
    KEY_REQUESTS = "osu-api-requests"

    __slots__ = (
        "wait_time",
        "limit",
        "_lock",
        "_waiting_lock",
    )

    def __init__(self, request_wait_time: float, limit_per_minute: int):
        self.wait_time: float = request_wait_time
        self.limit: int = limit_per_minute
        # for accessing non-thread-safe variables
        # intended to be used for short durations
        self._lock: RedisLock = redis_client.lock("RateLimitHandlerLock1")
        # to make sure only one request is waiting at a time
        # okay to acquire for long periods of time
        self._waiting_lock: RedisLock = redis_client.lock("RateLimitHandlerLock2")

    def wait(self):
        self._lock.acquire()

        if self.wait_time > 0:
            self._wait_with_wait_time()
        else:
            self._wait_without_wait_time()

        # we don't care about the set key
        redis_client.zadd(self.KEY_REQUESTS, {str(time.time()): time.time()})

        self._lock.release()

    def _wait_with_wait_time(self):
        # acquiring _waiting_lock could take a bit
        # so let's release this one
        self._lock.release()
        # once acquired, we can choose the appropriate way to wait
        # without worry about race conditions. waiting one at a time
        # is okay since wait time between requests is > 0
        self._waiting_lock.acquire()

        self._lock.acquire()
        if len(requests_sent := self._get_requests_sent()) > 0:
            wait_time = max(0.0, self.wait_time - (time.time() - requests_sent[-1]))
            if wait_time > 0:
                self._lock.release()
                time.sleep(wait_time)
                self._lock.acquire()

        self._waiting_lock.release()

    def _wait_without_wait_time(self):
        # under rate limit still, good to send
        if len(self._get_requests_sent()) < self.limit:
            return

        # acquiring _waiting_lock could take a bit
        # so let's release this one
        self._lock.release()
        self._waiting_lock.acquire()
        self._lock.acquire()

        # check again, then wait till oldest request expires past 1 minute
        if len(requests_sent := self._get_requests_sent()) >= self.limit:
            wait_time = max(0.0, 60.0 - (time.time() - requests_sent[0]))
            if wait_time > 0:
                self._lock.release()
                time.sleep(wait_time)
                self._lock.acquire()

        self._waiting_lock.release()

    def _get_requests_sent(self):
        """expects self._lock is acquired when calling this function"""
        # update list
        redis_client.zremrangebyscore(self.KEY_REQUESTS, 0, time.time() - 60)
        return list(map(float, redis_client.zrange(self.KEY_REQUESTS, 0, -1)))


def get_client():
    global osu_client

    if osu_client is None:
        osu_client = osu.Client.from_credentials(
            settings.OSU_CLIENT_ID, settings.OSU_CLIENT_SECRET, settings.OSU_REDIRECT_URL
        )
        osu_client.auth._data = AuthData()
        osu_client.auth._lock = redis_client.lock("AuthHandlerLock")
        osu_client.auth.http.rate_limit = RateLimitHandler(1.0, 60)
        if settings.OSU_DEV_SERVER:
            osu_client.set_domain("dev.ppy.sh")

    return osu_client


def get_user_client(code: str):
    user_client = osu.Client.from_credentials(
        settings.OSU_CLIENT_ID,
        settings.OSU_CLIENT_SECRET,
        settings.OSU_REDIRECT_URL,
        osu.Scope.identify(),
        code=code,
        lazily_authenticate=False,
    )
    return user_client


def release_redis_locks():
    """In case of deadlocks"""
    redis_client.delete("RateLimitHandlerLock1", "RateLimitHandlerLock2", "AuthHandlerLock")
