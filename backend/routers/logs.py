import os
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="/api/logs", tags=["logs"])

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")

@router.get("/", summary="获取运行日志")
def get_logs(
    lines: int = Query(100, ge=1, le=1000, description="返回行数"),
    level: Optional[str] = Query(None, description="日志级别：INFO/WARNING/ERROR")
):
    log_file = os.path.join(LOG_DIR, "app.log")
    if not os.path.exists(log_file):
        return {"logs": [], "message": "暂无日志"}
    
    with open(log_file, "r", encoding="utf-8") as f:
        all_lines = f.readlines()
    
    if level:
        all_lines = [l for l in all_lines if level.upper() in l]
    
    recent_lines = all_lines[-lines:]
    return {"logs": [l.strip() for l in recent_lines], "total": len(all_lines)}
