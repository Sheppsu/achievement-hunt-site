# Generated by Django 5.0.6 on 2024-11-14 21:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('achievements', '0006_achievement_audio'),
    ]

    operations = [
        migrations.AlterField(
            model_name='achievement',
            name='description',
            field=models.CharField(max_length=2096),
        ),
    ]
