from django.urls import path
from django.conf import settings

from .views import common, staff, admin

# endpoints that depend on the iteration
iteration_urls = [
    path("teams/", common.teams),
    path("achievements/", common.achievements),
    path("teams/leave/", common.leave_team),
    path("teams/create/", common.create_team),
    path("teams/rename/", common.rename_team),
    path("teams/transfer/", common.transfer_admin),
    path("teams/messages/", common.chat_messages),
    path("teams/invites/", common.get_team_invites),
    path("teams/invites/create/", common.send_team_invite),
    path("invites/", common.get_user_invites),
    path("stats/", common.player_stats),
    path("wsauth/", common.get_auth_packet),
    path("registration/change/", common.change_registration),
    path("registration/", common.get_registration),
    path("registration/free-agent/change/", common.change_free_agent),
    path("announcements/", common.get_announcements),
    path("announcements/create/", admin.create_announcement),
    path("batches/", admin.get_batches),
    path("batches/create/", admin.create_batch)
]

# these do not depend on the iteration
urlpatterns = [
    path("login/", common.login),
    path("logout/", common.logout),

    path("iteration/", common.get_iteration),
    path("iterations/<int:iteration_id>/", common.get_iteration),

    path("invites/<int:invite_id>/rescind/", common.rescind_invite),
    path("invites/<int:invite_id>/resolve/", common.resolve_invite),

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

if settings.DEBUG:
    urlpatterns.append(path("debug-login/", common.debug_login))
