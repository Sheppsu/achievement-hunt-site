from django.urls import re_path
from django.shortcuts import render
from django.conf import settings


def index_view(req):
    data = {
        "isAuthenticated": req.user.is_authenticated,
        "user": req.user.serialize() if req.user.is_authenticated else None,
        "authUrl": settings.OSU_LOGIN_URL,
        "wsUri": settings.ACHIEVEMENTS_WS_URI,
        "debug": settings.DEBUG
    }

    return render(req, 'index.html', {"data": data})


urlpatterns = [
    re_path(r".*", index_view, name="index")
]
