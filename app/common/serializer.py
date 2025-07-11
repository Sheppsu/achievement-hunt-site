from django.db import models

from collections import defaultdict
from datetime import datetime
from typing import Callable, Any


__all__ = ("SerializableModel", "SerializableField")


class SerializableField:
    __slots__ = (
        "field",
        "serial_key",
        "serialize_condition",
        "serialize_filter",
        "post_serial_filter",
        "post_transform",
        "is_passive",
    )

    non_passive_attrs = (
        "serialize_condition",
        "serialize_filter",
        "post_serial_filter",
        "post_transform",
    )

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

        self.is_passive = self._check_is_passive()

    def __setattr__(self, key, value):
        super().__setattr__(key, value)

        if getattr(self, "is_passive", None) is not None and key in self.non_passive_attrs:
            if value is None:
                super().__setattr__("is_passive", self._check_is_passive())
            else:
                super().__setattr__("is_passive", False)

    def _check_is_passive(self):
        return all((getattr(self, f) is None for f in self.non_passive_attrs))

    def split(self):
        result = list(map(SerializableField, self.field.split(sep="__", maxsplit=1)))
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
            self.post_transform,
        )

    def __str__(self):
        return self.field

    def __repr__(self):
        return f"SerializableField({self.field!r}, passive={self.is_passive!r})"

    def __hash__(self):
        return hash(self.field)

    def __eq__(self, other: "SerializableField"):
        return self.field == other.field and self.serial_key == other.serial_key


def _separate_field_args(
    fields: list[str | SerializableField | None], only_include_last=False
) -> tuple[list[SerializableField], dict[SerializableField, list[SerializableField]]]:
    # parse string representation of field reference
    # e.g. player__user__username -> {player: [user__username]}
    now = []
    later = defaultdict(list)
    for field in fields:
        if field is None:
            continue

        if isinstance(field, str):
            if field == "":
                continue

            field = SerializableField(field)

        split = field.split()
        if len(split) == 2:
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
        includes: dict[SerializableField, list[SerializableField]],
    ) -> dict | None:
        field_transforms = getattr(self.Serialization, "TRANSFORM", {})

        # for caching condition results
        condition_results = {}

        data = {}
        for field in fields:
            str_field = str(field)

            # conditional inclusion based on this object
            condition = field.serialize_condition
            if condition is not None:
                result = condition_results.get(condition, None)
                if result is None:
                    condition_results[condition] = result = condition(self)

                if not result:
                    continue

            value = getattr(self, str_field)
            if isinstance(value, SerializableModel):
                value = value.serialize(includes.get(field), excludes.get(field))
            elif isinstance(value, datetime):
                value = value.isoformat()
            elif value.__class__.__name__ == "RelatedManager":
                field_includes = includes.get(field)
                field_excludes = excludes.get(field)
                value = (
                    obj.serialize(field_includes, field_excludes)
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
        self, includes: list[str | SerializableField] | None = None, excludes: list[str] | None = None
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
