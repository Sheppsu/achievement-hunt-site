from django.core.management.base import BaseCommand
from achievements.models import User


class Command(BaseCommand):
    help = "Manage a user's attributes"

    def add_arguments(self, parser):
        parser.add_argument("user_id", type=int)
        parser.add_argument("action", choices=["admin", "staff"])

    def handle(self, *args, **options):
        user = User.objects.filter(pk=options["user_id"]).first()

        if user is None:
            user = User.objects.create_user_from_id(options["user_id"])

        if options["action"] == "admin":
            user.is_admin = True
        elif options["action"] == "staff":
            user.is_achievement_creator = True

        user.save()
