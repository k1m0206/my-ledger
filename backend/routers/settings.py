import ipaddress
import platform
import re
import socket
import subprocess
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


EXCLUDED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("100.64.0.0/10"),
]

VIRTUAL_ADAPTER_KEYWORDS = (
    "bluetooth",
    "clash",
    "docker",
    "hyper-v",
    "loopback",
    "mihomo",
    "tap",
    "tailscale",
    "tun",
    "virtual",
    "virtualbox",
    "vmware",
    "wintun",
    "wsl",
    "zerotier",
    "蓝牙",
)


def is_usable_lan_ip(ip: str) -> bool:
    try:
        address = ipaddress.ip_address(ip)
    except ValueError:
        return False

    if address.version != 4:
        return False
    if any(address in network for network in EXCLUDED_NETWORKS):
        return False
    return address.is_private


def adapter_priority(ip: str) -> int:
    address = ipaddress.ip_address(ip)
    if address in ipaddress.ip_network("192.168.0.0/16"):
        return 30
    if address in ipaddress.ip_network("10.0.0.0/8"):
        return 20
    if address in ipaddress.ip_network("172.16.0.0/12"):
        return 10
    return 0


def get_route_local_ip() -> Optional[str]:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip if is_usable_lan_ip(ip) else None
    except OSError:
        return None


def get_hostname_ips() -> list[str]:
    candidates = set()
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            candidates.add(info[4][0])
    except OSError:
        pass
    return [ip for ip in candidates if is_usable_lan_ip(ip)]


def get_windows_adapter_ips() -> list[str]:
    try:
        result = subprocess.run(
            ["ipconfig"],
            capture_output=True,
            text=True,
            encoding="gbk",
            errors="ignore",
            check=False,
        )
    except OSError:
        return []

    candidates: list[str] = []
    adapter_name = ""
    skip_adapter = False

    for line in result.stdout.splitlines():
        stripped = line.strip()
        if not stripped:
            continue

        if not line.startswith(" ") and stripped.endswith(":"):
            adapter_name = stripped[:-1].lower()
            skip_adapter = any(keyword in adapter_name for keyword in VIRTUAL_ADAPTER_KEYWORDS)
            continue

        if skip_adapter:
            continue

        if "IPv4" in stripped:
            match = re.search(r"(\d{1,3}(?:\.\d{1,3}){3})", stripped)
            if match and is_usable_lan_ip(match.group(1)):
                candidates.append(match.group(1))

    return candidates


def get_local_ip():
    route_ip = get_route_local_ip()
    candidates = []
    if route_ip:
        candidates.append(route_ip)

    if platform.system().lower() == "windows":
        candidates.extend(get_windows_adapter_ips())

    candidates.extend(get_hostname_ips())
    unique_candidates = list(dict.fromkeys(candidates))
    if unique_candidates:
        return sorted(unique_candidates, key=adapter_priority, reverse=True)[0]

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
