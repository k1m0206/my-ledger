import hashlib
import hmac
import ipaddress
import time
from typing import Optional

from fastapi import Request

from settings_store import Settings


def _is_loopback(host: Optional[str]) -> bool:
    if not host:
        return False

    normalized = host.strip().lower()
    if normalized == "localhost":
        return True

    if normalized.startswith("::ffff:"):
        normalized = normalized.removeprefix("::ffff:")

    try:
        return ipaddress.ip_address(normalized).is_loopback
    except ValueError:
        return False


def _forwarded_host(request: Request) -> Optional[str]:
    forwarded = request.headers.get("x-forwarded-for")
    if not forwarded:
        return None
    return forwarded.split(",")[0].strip()


def is_local_request(request: Request) -> bool:
    client_host = request.client.host if request.client else None
    forwarded_host = _forwarded_host(request)
    if forwarded_host:
        return _is_loopback(client_host) and _is_loopback(forwarded_host)
    return _is_loopback(client_host)


def create_token(settings: Settings) -> tuple[str, int]:
    expires_at = int(time.time() + settings.token_ttl_hours * 60 * 60)
    signature = _sign(str(expires_at), settings.auth_secret)
    return f"{expires_at}.{signature}", expires_at


def verify_token(token: str, settings: Settings) -> bool:
    try:
        expires_at_text, signature = token.split(".", 1)
        expires_at = int(expires_at_text)
    except ValueError:
        return False

    if expires_at <= int(time.time()):
        return False

    expected = _sign(expires_at_text, settings.auth_secret)
    return hmac.compare_digest(signature, expected)


def verify_authorization(request: Request, settings: Settings) -> bool:
    authorization = request.headers.get("authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return False
    return verify_token(token, settings)


def password_matches(password: str, settings: Settings) -> bool:
    if not settings.access_password:
        return False
    return hmac.compare_digest(password, settings.access_password)


def _sign(payload: str, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
