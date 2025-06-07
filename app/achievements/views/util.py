from django.http import JsonResponse

import json

from ..models import *


current_iteration = None


def get_current_iteration() -> EventIteration:
    # pylint: disable=global-statement
    global current_iteration

    if current_iteration is None:
        current_iteration = EventIteration.objects.order_by('-id').first()
    return current_iteration


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


def require_iteration_before_start(func):
    @require_iteration
    def wrapper(req, *args, iteration, **kwargs):
        if iteration.has_started():
            return error("iteration has already started", status=403)

        return func(req, *args, iteration=iteration, **kwargs)

    return wrapper


def require_iteration_before_end(func):
    @require_iteration
    def wrapper(req, *args, iteration, **kwargs):
        if iteration.has_ended():
            return error("iteration ended", status=403)

        return func(req, *args, iteration=iteration, **kwargs)

    return wrapper


def require_iteration_after_start(func):
    @require_iteration
    def wrapper(req, *args, iteration, **kwargs):
        if not iteration.has_started():
            return error("iteration has not started", status=403)

        return func(req, *args, iteration=iteration, **kwargs)

    return wrapper


def require_iteration_after_end(func):
    @require_iteration
    def wrapper(req, *args, iteration, **kwargs):
        if not iteration.has_ended():
            return error("must wait until iteration ends", status=403)

        return func(req, *args, iteration=iteration, **kwargs)

    return wrapper


def require_iteration_before_registration_end(func):
    @require_iteration
    def wrapper(req, *args, iteration, **kwargs):
        if iteration.has_registration_ended():
            return error("Registration period has ended", status=403)

        return func(req, *args, iteration=iteration, **kwargs)

    return wrapper


def require_user(func):
    def wrapper(req, *args, **kwargs):
        if not req.user.is_authenticated:
            return error("not logged in", status=403)

        return func(req, *args, **kwargs)

    return wrapper


def require_registered(func):
    @require_user
    def wrapper(req, *args, iteration, **kwargs):
        registration = Registration.objects.filter(user=req.user, iteration=iteration).first()
        if registration is None:
            return error("Must be registered")

        return func(req, *args, iteration=iteration, registration=registration, **kwargs)

    return wrapper


def require_iteration(func):
    def wrapper(req, iteration_id=None, *args, **kwargs):
        if iteration_id is None:
            iteration = get_current_iteration()
        else:
            iteration = EventIteration.objects.filter(id=iteration_id).first()

        if iteration is None:
            return error("iteration not found", status=404)

        return func(req, *args, iteration=iteration, **kwargs)

    return wrapper


def require_admin(func):
    def wrapper(req, *args, **kwargs):
        if not req.user.is_authenticated:
            return error("not authenticated", status=403)

        if not req.user.is_admin:
            return error("not admin", status=403)

        return func(req, *args, **kwargs)

    return wrapper


def require_staff(func):
    def wrapper(req, *args, **kwargs):
        if not req.user.is_authenticated or (not req.user.is_admin and not req.user.is_achievement_creator):
            return error("Unauthorized", status=403)

        return func(req, *args, **kwargs)

    return wrapper


def require_achievement(select: list | None = None, prefetch: list | None = None):
    def decorator(func):
        def wrapper(req, *args, **kwargs):
            achievement_id = kwargs.pop("achievement_id", None)
            if achievement_id is None:
                return error("Invalid achievement id")

            achievement = Achievement.objects.filter(id=achievement_id)

            if select is not None:
                achievement.select_related(*select)

            if prefetch is not None:
                achievement.prefetch_related(*prefetch)

            achievement = achievement.first()

            if achievement is None:
                return error("Invalid achievement id")

            return func(req, *args, achievement=achievement, **kwargs)

        return wrapper

    return decorator
