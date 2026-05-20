from fastapi import APIRouter
from backup import backup_database, list_backups

router = APIRouter(prefix="/api/backup", tags=["backup"])

@router.post("/", summary="手动备份数据库")
def create_backup():
    result = backup_database()
    if result:
        return {"message": "备份成功", "file": result}
    return {"message": "数据库文件不存在"}

@router.get("/", summary="查看备份列表")
def get_backups():
    backups = list_backups()
    return {"backups": backups, "count": len(backups)}
