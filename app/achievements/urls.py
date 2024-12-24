from django.urls import path
from .views import common, staff


urlpatterns = [
    path("login/", common.login),
    path("logout/", common.logout),
    path("teams/", common.teams),
    path("achievements/", common.achievements),
    path("teams/join/", common.join_team),
    path("teams/leave/", common.leave_team),
    path("teams/create/", common.create_team),
    path("teams/rename/", common.rename_team),
    path("teams/transfer/", common.transfer_admin),
    path("stats/", common.player_stats),
    path("wsauth/", common.get_auth_packet),

    path("staff/achievements/", staff.achievements),
    path("staff/achievements/<int:achievement_id>/comment", staff.vote_achievement)
]
