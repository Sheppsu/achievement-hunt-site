"""
Django settings for app project.

Generated by 'django-admin startproject' using Django 4.2.2.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from osu import AuthHandler, Scope, Client

from common.discord import DiscordLogger

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("DJANGO_SECRET")

DEBUG = bool(int(os.getenv("DJANGO_DEBUG")))


ALLOWED_HOSTS = ["*"] if DEBUG else ["cta.sheppsu.me"]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',
    'django.contrib.staticfiles',
    "achievements",
    "frontend"
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'middleware.ExceptionLoggingMiddleware'
]

ROOT_URLCONF = 'app.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / "frontend" / "dist"],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'app.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

PROD_DB = {
    "ENGINE": "django.db.backends.postgresql",
    "NAME": os.getenv("PG_DB"),
    "USER": os.getenv("PG_USER"),
    "PASSWORD": os.getenv("PG_PASSWORD"),
    "HOST": os.getenv("PG_HOST"),
    "PORT": os.getenv("PG_PORT"),
}

LOCAL_DB = {
    "ENGINE": "django.db.backends.postgresql",
    "NAME": os.getenv("LOCAL_PG_DB"),
    "USER": os.getenv("LOCAL_PG_USER"),
    "PASSWORD": os.getenv("LOCAL_PG_PASSWORD"),
    "HOST": os.getenv("LOCAL_PG_HOST"),
    "PORT": os.getenv("LOCAL_PG_PORT"),
}

DATABASES = {
    "default": LOCAL_DB if DEBUG and "--use-prod-db" not in sys.argv else PROD_DB
}


STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"
    }
}


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles' if not DEBUG else BASE_DIR / "frontend" / "dist"
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static")
]
if not DEBUG:
    STATICFILES_DIRS.append(
        os.path.join(BASE_DIR, "frontend", "dist")
    )

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


AUTH_USER_MODEL = "achievements.User"
AUTH_BACKEND = "django.contrib.auth.backends.ModelBackend"


OSU_CLIENT_ID = int(os.getenv("OSU_CLIENT_ID"))
OSU_CLIENT_SECRET = os.getenv("OSU_CLIENT_SECRET")
OSU_REDIRECT_URL = os.getenv("OSU_REDIRECT_URL")
OSU_DEV_SERVER = bool(int(os.getenv("OSU_DEV_SERVER")))

auth = AuthHandler(
    OSU_CLIENT_ID,
    OSU_CLIENT_SECRET,
    OSU_REDIRECT_URL,
    Scope.identify()
)
if OSU_DEV_SERVER:
    auth.set_domain("dev.ppy.sh")
OSU_LOGIN_URL = auth.get_auth_url()

OSU_CLIENT = Client.from_client_credentials(OSU_CLIENT_ID, OSU_CLIENT_SECRET, OSU_REDIRECT_URL)
if OSU_DEV_SERVER:
    OSU_CLIENT.set_domain("dev.ppy.sh")
    OSU_CLIENT.auth.set_domain("dev.ppy.sh")

ACHIEVEMENTS_WS_URI = os.getenv("ACHIEVEMENTS_WS_URI")
WS_CONNECTION_VALIDATOR = os.getenv("WS_CONNECTION_VALIDATOR")

EVENT_START = 1731715200
EVENT_END = 1732492800

DISCORD_LOGGER = DiscordLogger()
