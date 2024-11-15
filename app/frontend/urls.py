from django.urls import re_path
from django.shortcuts import render, Http404
from django.conf import settings


def index_view(req):
    data = {
        "isAuthenticated": req.user.is_authenticated,
        "user": req.user.serialize() if req.user.is_authenticated else None,
        "authUrl": settings.OSU_LOGIN_URL,
        "wsUri": settings.ACHIEVEMENTS_WS_URI,
        "debug": settings.DEBUG,
        "eventStart": settings.EVENT_START * 1000,
        "eventEnd": settings.EVENT_END * 1000,
    }

    return render(req, 'index.html', {"data": data})


def invalid_static(req):
    raise Http404()


urlpatterns = [
    re_path(r"static/.*", invalid_static),
    re_path(r".*", index_view, name="index")
]
