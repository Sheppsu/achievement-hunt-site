from django.http import JsonResponse

import json


def error(msg: str, status=400):
    return JsonResponse({"error": msg}, status=status, safe=False)


def success(data, status=200):
    return JsonResponse({"data": data}, status=status, safe=False)


def parse_body(body: bytes, require_has: tuple | list):
    try:
        data = json.loads(body.decode("utf-8"))
        if not isinstance(data, dict):
            return

        for require in require_has:
            if require not in data:
                return

        return data
    except (UnicodeDecodeError, json.JSONDecodeError):
        return


def require_valid_data(*keys):
    def decorator(func):
        def wrapper(req, *args, **kwargs):
            data = parse_body(req.body, keys)
            if data is None:
                return error("Invalid body format (expected json) or keys")

            return func(req, *args, **kwargs, data=data)

        return wrapper

    return decorator
