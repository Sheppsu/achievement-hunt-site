from django.urls import path
from . import views


urlpatterns = [
    path("web/bancho_connect.php", views.empty_reply),
    path("web/osu-submit-modular-selector.php", views.handle_score_submission),
]
