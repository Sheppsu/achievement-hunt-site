# Generated by Django 5.0.6 on 2025-03-19 17:20

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("achievements", "0018_team_iteration"),
    ]

    operations = [
        migrations.CreateModel(
            name="BeatmapConnection",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("hide", models.BooleanField(default=False)),
                (
                    "achievement",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="beatmaps",
                        to="achievements.achievement",
                    ),
                ),
                (
                    "beatmap",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="achievements.beatmapinfo",
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
    ]
