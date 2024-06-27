from django.urls import path, include

urlpatterns = [
    path("api/", include("achievements.urls")),
    path("", include("frontend.urls"), name="index"),
]
