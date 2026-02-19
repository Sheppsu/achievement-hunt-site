import hashlib

from .models import PlaytestAccount


def account_from_credentials(username: str, password_md5: bytes):
    account = PlaytestAccount.objects.select_related("user").filter(user__username=username).first()
    if account is None:
        return

    if hashlib.md5(account.passkey.encode()).hexdigest().encode() != password_md5:
        return

    return account
