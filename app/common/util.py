from django.conf import settings

from osu import AuthHandler, Scope


__all__ = ("create_auth_handler",)


def create_auth_handler() -> AuthHandler:
    auth = AuthHandler(
        settings.OSU_CLIENT_ID,
        settings.OSU_CLIENT_SECRET,
        settings.OSU_REDIRECT_URL,
        scope=Scope.identify()
    )
    if settings.OSU_DEV_SERVER:
        auth.set_domain("dev.ppy.sh")
    return auth
