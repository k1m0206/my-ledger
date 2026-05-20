import socket
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from auth import is_local_request
from settings_store import Settings, load_settings, save_settings

router = APIRouter(prefix="/api/settings", tags=["settings"])

class SettingsUpdate(BaseModel):
    lan_access: Optional[bool] = Field(None, description="是否开启局域网访问")
    access_password: Optional[str] = Field(None, description="局域网访问密码，仅本机可修改")


class SettingsResponse(BaseModel):
    lan_access: bool = Field(..., description="是否开启局域网访问")
    password_configured: bool = Field(..., description="是否已设置局域网访问密码")
    access_password: Optional[str] = Field(None, description="局域网访问密码，仅本机访问时返回")
    token_ttl_hours: int = Field(..., description="局域网访问令牌有效小时数")
    is_local: bool = Field(..., description="是否为本机访问")


def build_settings_response(settings: Settings, local: bool) -> SettingsResponse:
    return SettingsResponse(
        lan_access=settings.lan_access,
        password_configured=bool(settings.access_password),
        access_password=settings.access_password if local else None,
        token_ttl_hours=settings.token_ttl_hours,
        is_local=local,
    )

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return "127.0.0.1"

@router.get("/", response_model=SettingsResponse, summary="获取设置")
def get_settings(request: Request):
    settings = load_settings()
    return build_settings_response(settings, is_local_request(request))

@router.put("/", response_model=SettingsResponse, summary="更新设置")
def update_settings(payload: SettingsUpdate, request: Request):
    if not is_local_request(request):
        raise HTTPException(status_code=403, detail="只有本机访问可以修改系统设置")

    settings = load_settings()
    if payload.lan_access is not None:
        settings.lan_access = payload.lan_access
    if payload.access_password is not None:
        settings.access_password = payload.access_password.strip() or None

    save_settings(settings)
    return build_settings_response(settings, local=True)

@router.get("/ip", summary="获取本机IP")
def get_ip():
    return {"ip": get_local_ip()}
