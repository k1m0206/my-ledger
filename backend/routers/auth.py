from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field

from auth import create_token, is_local_request, password_matches, verify_authorization
from settings_store import load_settings


router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    password: str = Field(..., min_length=1, description="局域网访问密码")


class LoginResponse(BaseModel):
    token: str = Field(..., description="访问令牌")
    expires_at: int = Field(..., description="令牌过期时间戳")


class AuthStatus(BaseModel):
    is_local: bool = Field(..., description="是否为本机访问")
    lan_access: bool = Field(..., description="是否开启局域网访问")
    password_configured: bool = Field(..., description="是否已设置局域网访问密码")
    authenticated: bool = Field(..., description="当前请求是否已通过访问校验")
    token_ttl_hours: int = Field(..., description="令牌有效小时数")


@router.get("/status", response_model=AuthStatus, summary="查询访问校验状态")
def get_auth_status(request: Request):
    settings = load_settings()
    local = is_local_request(request)
    authenticated = local or (
        settings.lan_access
        and bool(settings.access_password)
        and verify_authorization(request, settings)
    )
    return AuthStatus(
        is_local=local,
        lan_access=settings.lan_access,
        password_configured=bool(settings.access_password),
        authenticated=authenticated,
        token_ttl_hours=settings.token_ttl_hours,
    )


@router.post("/login", response_model=LoginResponse, summary="使用局域网访问密码换取令牌")
def login(payload: LoginRequest):
    settings = load_settings()
    if not settings.lan_access:
        raise HTTPException(status_code=403, detail="局域网访问未开启")
    if not settings.access_password:
        raise HTTPException(status_code=403, detail="尚未设置局域网访问密码")
    if not password_matches(payload.password, settings):
        raise HTTPException(status_code=401, detail="密码错误")

    token, expires_at = create_token(settings)
    return LoginResponse(token=token, expires_at=expires_at)
