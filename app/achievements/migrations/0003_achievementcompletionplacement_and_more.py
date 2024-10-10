# Generated by Django 5.0.6 on 2024-08-31 06:04

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('achievements', '0002_achievement_tags'),
    ]

    operations = [
        migrations.CreateModel(
            name='AchievementCompletionPlacement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('value', models.BigIntegerField()),
                ('is_float', models.BooleanField()),
            ],
        ),
        migrations.AddField(
            model_name='achievementcompletion',
            name='placement',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='achievements.achievementcompletionplacement'),
        ),
    ]