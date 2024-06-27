from django.conf import settings

from osu import AuthHandler, Scope


__all__ = ("create_auth_handler",)


def create_auth_handler() -> AuthHandler:
    return AuthHandler(
        settings.OSU_CLIENT_ID,
        settings.OSU_CLIENT_SECRET,
        settings.OSU_REDIRECT_URL,
        scope=Scope.identify()
    )
