from django.db import models

from collections import defaultdict
from datetime import datetime
from typing import Callable, Any


__all__ = (
    "SerializableModel",
    "SerializableField"
)


class SerializableField:
    __slots__ = ("field", "serial_key", "serialize_condition", "serialize_filter", "post_serial_filter", "post_transform")

    def __init__(
        self,
        field: str,
        serial_key: str | None = None,
        condition: Callable[[models.Model], bool] | None = None,
        filter: Callable[[models.Model], bool] | None = None,
        post_serial_filter: Callable[[Any], bool] | None = None,
        post_transform: Callable[[Any], Any] | None = None,
    ):
        self.field = field
        self.serial_key = serial_key
        self.serialize_condition = condition
        self.serialize_filter = filter
        self.post_serial_filter = post_serial_filter
        self.post_transform = post_transform

    @property
    def is_passive(self):
        return self.serialize_condition is None and \
            self.serialize_filter is None and \
            self.post_serial_filter is None and \
            self.post_transform is None

    def split(self, sep=None, maxsplit=-1):
        result = list(map(SerializableField, self.field.split(sep=sep, maxsplit=maxsplit)))
        # only carry properties along with the last field
        result[-1] = self.clone(result[-1].field)
        return result

    def clone(self, new_field: str):
        return SerializableField(
            new_field,
            self.serial_key,
            self.serialize_condition,
            self.serialize_filter,
            self.post_serial_filter,
            self.post_transform
        )

    def __eq__(self, other: str):
        return self.field == other and self.is_passive

    def __str__(self):
        return self.field

    def __repr__(self):
        return f"SerializableField({self.field!r})"

    def __hash__(self):
        return hash(self.field)


def _separate_field_args(fields: list[str | SerializableField | None], only_include_last=False) -> tuple[
    list[SerializableField], dict[SerializableField, list[SerializableField]]
]:
    # parse string representation of field reference
    # e.g. player__user__username -> {player: [user__username]}
    now = []
    later = defaultdict(list)
    for field in fields:
        if field is None or field == "":
            continue

        if isinstance(field, str):
            field = SerializableField(field)

        split = field.split("__", 1)
        if len(split) > 1:
            later[split[0]].append(split[1])
        if not only_include_last or len(split) == 1:
            now.append(split[0])
    return now, later


class SerializableModel(models.Model):
    class Meta:
        abstract = True

    class Serialization:
        FIELDS: list
        EXCLUDES: list
        TRANSFORM: dict[str, str]

    def _transform(
        self,
        fields: list[SerializableField],
        excludes: dict[SerializableField, list[SerializableField]],
        includes: dict[SerializableField, list[SerializableField]]
    ) -> dict | None:
        field_transforms = getattr(self.Serialization, "TRANSFORM", {})

        data = {}
        for field in fields:
            str_field = str(field)

            # conditional inclusion
            serialize_condition = getattr(field, "serialize_condition", None)
            if serialize_condition is not None and not serialize_condition(self):
                continue

            value = getattr(self, str_field)
            if isinstance(value, SerializableModel):
                value = value.serialize(includes.get(field), excludes.get(field))
            elif isinstance(value, datetime):
                value = value.isoformat()
            elif value.__class__.__name__ == "RelatedManager":
                value = (
                    obj.serialize(includes.get(field), excludes.get(field))
                    for obj in value.all()
                    if field.serialize_filter is None or field.serialize_filter(obj)
                )

            if field.post_serial_filter is not None and hasattr(value, "__iter__"):
                value = filter(field.post_serial_filter, value)

            if hasattr(value, "__next__"):
                value = list(value)

            if field.post_transform is not None:
                value = field.post_transform(value)

            data[field.serial_key or field_transforms.get(str_field, str_field)] = value

        return data

    def serialize(
        self,
        includes: list[str | SerializableField] | None = None,
        excludes: list[str] | None = None
    ) -> dict | None:
        if includes is None:
            includes = []
        if excludes is None:
            excludes = []

        exclude_now, exclude_later = _separate_field_args(excludes, only_include_last=True)
        include_now, include_later = _separate_field_args(includes)

        fields = list(map(SerializableField, self.Serialization.FIELDS))
        for field in exclude_now:
            fields.remove(field)
        for field in include_now:
            # replace field instead of adding new one
            try:
                i = fields.index(field)
                if not field.is_passive:
                    fields[i] = field
                continue
            except ValueError:
                pass

            fields.append(field)

        return self._transform(fields, exclude_later, include_later)
