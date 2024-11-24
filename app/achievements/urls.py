from django.urls import path
from . import views


urlpatterns = [
    path("login/", views.login),
    path("logout/", views.logout),
    path("teams/", views.teams),
    path("achievements/", views.achievements),
    path("teams/join/", views.join_team),
    path("teams/leave/", views.leave_team),
    path("teams/create/", views.create_team),
    path("teams/rename/", views.rename_team),
    path("teams/transfer/", views.transfer_admin),
    path("stats/", views.player_stats),
    path("wsauth/", views.get_auth_packet)
]
