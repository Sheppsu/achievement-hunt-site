from django.urls import path
from .views import common, staff, admin

from .views import common, staff

iteration_urls = [
    path("teams/", common.teams),
    path("achievements/", common.achievements),
    path("teams/join/", common.join_team),
    path("teams/leave/", common.leave_team),
    path("teams/create/", common.create_team),
    path("teams/rename/", common.rename_team),
    path("teams/transfer/", common.transfer_admin),
    path("teams/messages/", common.chat_messages),
    path("stats/", common.player_stats),
    path("wsauth/", common.get_auth_packet),
    path("register/", common.register),
    path("registration/", common.get_registration),
    path("announcements/", common.get_announcements),
    path("announcements/create/", admin.create_announcement),
    path("batches/", admin.get_batches),
    path("batches/create/", admin.create_batch)
]

urlpatterns = [
    path("login/", common.login),
    path("logout/", common.logout),

    path("iteration/", common.get_iteration),
    path("iterations/<int:iteration_id>/", common.get_iteration),

    path("staff/achievements/", staff.achievements),
    path("staff/achievements/<int:achievement_id>/", staff.show_achievement),
    path("staff/achievements/<int:achievement_id>/vote/", staff.vote_achievement),
    path("staff/achievements/<int:achievement_id>/comment/", staff.create_comment),
    path("staff/achievements/create/", staff.create_achievement),
    path("staff/achievements/<int:achievement_id>/edit/", staff.edit_achievement),
    path("staff/achievements/<int:achievement_id>/delete/", staff.delete_achievement),
    path("staff/achievements/<int:achievement_id>/move/", admin.change_achievement_batch),
] + iteration_urls + [
    path("iterations/<int:iteration_id>/" + url.pattern._route, url.callback)
    for url in iteration_urls
]
