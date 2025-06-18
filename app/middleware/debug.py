from django.core.exceptions import MiddlewareNotUsed
from django.db import connection
from django.conf import settings

import logging


__all__ = (
    "DatabaseDebugMiddleware",
)


log = logging.getLogger(__name__)


class DatabaseDebugMiddleware:
    def __init__(self, get_response) -> None:
        if not settings.DEBUG:
            raise MiddlewareNotUsed()

        self.get_response = get_response

    def __call__(self, req):
        resp = self.get_response(req)

        if len(connection.queries) > 0:
            print(
                f"Made {len(connection.queries)} queries, "
                f"taking {sum((float(query['time']) for query in connection.queries))} seconds"
            )
            # for query in connection.queries:
            #     print(query['sql'])

        return resp
