from django.urls import re_path
from django.shortcuts import render
from django.conf import settings

from typing import TYPE_CHECKING

from achievements.serializers import UserSerializer  # type: ignore


if TYPE_CHECKING:
    from ..achievements.serializers import UserSerializer


def index_view(req):
    data = {
        "isAuthenticated": req.user.is_authenticated,
        "user": UserSerializer(req.user).serialize() if req.user.is_authenticated else None,
        "authUrl": settings.OSU_LOGIN_URL,
        "wsUri": settings.ACHIEVEMENTS_WS_URI,
        "debug": settings.DEBUG
    }

    return render(req, 'index.html', {"data": data})


urlpatterns = [
    re_path(r".*", index_view, name="index")
]
