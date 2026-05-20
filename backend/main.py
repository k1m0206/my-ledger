import os
import logging
import threading
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from database import init_db
from routers import ledger, settings, logs, backup, auth, categories
from config import CORS_ORIGINS, HOST, PORT
from backup import backup_database
from auth import is_local_request, verify_authorization
from settings_store import load_settings

# 配置日志
LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(LOG_DIR, "app.log"), encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def scheduled_backup():
    while True:
        try:
            result = backup_database()
            if result:
                logger.info(f"定时备份完成: {result}")
        except Exception as e:
            logger.error(f"定时备份失败: {e}")
        time.sleep(24 * 60 * 60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("My Ledger 后端服务启动")
    init_db()
    logger.info("数据库初始化完成")
    
    backup_thread = threading.Thread(target=scheduled_backup, daemon=True)
    backup_thread.start()
    logger.info("定时备份任务已启动（每24小时）")
    
    yield
    logger.info("My Ledger 后端服务停止")

app = FastAPI(
    title="My Ledger API",
    description="个人记账软件 API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PUBLIC_API_PATHS = {
    "/api/auth/status",
    "/api/auth/login",
    "/api/settings/ip",
}


@app.middleware("http")
async def require_access_token(request: Request, call_next):
    path = request.url.path
    if request.method == "OPTIONS" or not path.startswith("/api/") or path in PUBLIC_API_PATHS:
        return await call_next(request)

    if is_local_request(request):
        return await call_next(request)

    current_settings = load_settings()
    if not current_settings.lan_access:
        return JSONResponse(status_code=403, content={"detail": "局域网访问未开启"})
    if not current_settings.access_password:
        return JSONResponse(status_code=403, content={"detail": "尚未设置局域网访问密码"})
    if not verify_authorization(request, current_settings):
        return JSONResponse(status_code=401, content={"detail": "需要输入局域网访问密码"})

    return await call_next(request)


app.include_router(ledger.router)
app.include_router(settings.router)
app.include_router(logs.router)
app.include_router(backup.router)
app.include_router(auth.router)
app.include_router(categories.router)

@app.get("/")
def root():
    return {"message": "My Ledger API is running"}

if __name__ == "__main__":
    import uvicorn
    logger.info(f"服务启动于 {HOST}:{PORT}")
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
