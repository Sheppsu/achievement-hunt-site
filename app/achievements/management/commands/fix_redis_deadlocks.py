from django.core.management.base import BaseCommand

from common.osu_api import release_redis_locks


class Command(BaseCommand):
    help = "Manage a user's attributes"

    def handle(self, *args, **options):
        release_redis_locks()
