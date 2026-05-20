import json
import os
import secrets
from typing import Optional

from pydantic import BaseModel, Field


SETTINGS_FILE = os.path.join(os.path.dirname(__file__), "settings.json")


class Settings(BaseModel):
    lan_access: bool = False
    access_password: Optional[str] = None
    auth_secret: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    token_ttl_hours: int = 168


def load_settings() -> Settings:
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            settings = Settings(**data)
    else:
        settings = Settings()

    if not settings.auth_secret:
        settings.auth_secret = secrets.token_urlsafe(32)
        save_settings(settings)

    return settings


def save_settings(settings: Settings):
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(settings.model_dump(), f, indent=2, ensure_ascii=False)
