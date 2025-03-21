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


def accepts_json_data(fmt):
    def decorator(func):
        def check(req, *args, **kwargs):
            try:
                data = json.loads(req.body.decode("utf-8"))
                result = fmt.validate(data)
                if result.is_failed:
                    return error(result.msg, 400)
                return func(req, *args, data=data, **kwargs)
            except json.JSONDecodeError:
                return error("Invalid json data", 400)

        return check

    return decorator
