from django.conf import settings
from django.http.response import Http404


__all__ = ("ExceptionLoggingMiddleware",)


class ExceptionLoggingMiddleware:
    def __init__(self, get_response) -> None:
        self.get_response = get_response

    def __call__(self, *args, **kwargs):
        return self.get_response(*args, **kwargs)

    def process_exception(self, req, exc) -> None:
        if not settings.DEBUG and not isinstance(exc, Http404):
            settings.DISCORD_LOGGER.submit_err(req, exc)
