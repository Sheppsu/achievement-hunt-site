from django.urls import re_path
from django.shortcuts import render, Http404
from django.conf import settings

from achievements.views.common import get_current_iteration


def index_view(req):
    data = {
        "isAuthenticated": req.user.is_authenticated,
        "user": req.user.serialize() if req.user.is_authenticated else None,
        "authUrl": settings.OSU_LOGIN_URL,
        "wsUri": settings.ACHIEVEMENTS_WS_URI,
        "debug": settings.DEBUG,
    }

    return render(req, "index.html", {"data": data})


def not_found(req):
    raise Http404()


urlpatterns = [
    re_path(r"static/.*", not_found),
    re_path(r"api/.*", not_found),
    re_path(r".*", index_view, name="index"),
]
