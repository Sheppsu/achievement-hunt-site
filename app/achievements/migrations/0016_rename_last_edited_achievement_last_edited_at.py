# Generated by Django 5.0.6 on 2025-03-16 18:51

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("achievements", "0015_achievement_last_edited"),
    ]

    operations = [
        migrations.RenameField(
            model_name="achievement",
            old_name="last_edited",
            new_name="last_edited_at",
        ),
    ]
