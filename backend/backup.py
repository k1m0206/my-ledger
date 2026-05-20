import os
import shutil
from datetime import datetime, timedelta

BACKUP_DIR = os.path.join(os.path.dirname(__file__), "backups")
DB_FILE = os.path.join(os.path.dirname(__file__), "ledger.db")
KEEP_DAYS = 7

def backup_database():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(BACKUP_DIR, f"ledger_{timestamp}.db")
    
    if os.path.exists(DB_FILE):
        shutil.copy2(DB_FILE, backup_file)
        clean_old_backups()
        return backup_file
    return None

def clean_old_backups():
    cutoff = datetime.now() - timedelta(days=KEEP_DAYS)
    
    for filename in os.listdir(BACKUP_DIR):
        if filename.startswith("ledger_") and filename.endswith(".db"):
            filepath = os.path.join(BACKUP_DIR, filename)
            file_time = datetime.fromtimestamp(os.path.getmtime(filepath))
            if file_time < cutoff:
                os.remove(filepath)

def list_backups():
    if not os.path.exists(BACKUP_DIR):
        return []
    
    backups = []
    for filename in sorted(os.listdir(BACKUP_DIR), reverse=True):
        if filename.startswith("ledger_") and filename.endswith(".db"):
            filepath = os.path.join(BACKUP_DIR, filename)
            size = os.path.getsize(filepath)
            mtime = datetime.fromtimestamp(os.path.getmtime(filepath))
            backups.append({
                "filename": filename,
                "size": size,
                "created_at": mtime.isoformat()
            })
    
    return backups

if __name__ == "__main__":
    result = backup_database()
    if result:
        print(f"备份成功: {result}")
    else:
        print("数据库文件不存在")
