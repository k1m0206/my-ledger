from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from database import get_db
from schemas.ledger import LedgerCreate, LedgerUpdate, LedgerResponse, LedgerSummary
from services.ledger import LedgerService
from category_store import category_names, load_categories

router = APIRouter(prefix="/api/ledger", tags=["ledger"])

@router.post("/", response_model=LedgerResponse, summary="新增账目")
def create_ledger(ledger: LedgerCreate, db: Session = Depends(get_db)):
    service = LedgerService(db)
    return service.create_ledger(ledger)

@router.post("/batch", response_model=dict, summary="批量新增账目")
def batch_create_ledgers(ledgers: List[LedgerCreate], db: Session = Depends(get_db)):
    service = LedgerService(db)
    created = service.batch_create_ledgers(ledgers)
    return {"message": f"成功导入 {len(created)} 条记录", "count": len(created)}

@router.get("/", response_model=List[LedgerResponse], summary="查询账目列表")
def get_ledgers(
    skip: int = Query(0, ge=0, description="跳过条数"),
    limit: int = Query(100, ge=1, le=1000, description="返回条数"),
    type: Optional[str] = Query(None, description="类型：income/expense"),
    category: Optional[str] = Query(None, description="分类"),
    start_date: Optional[datetime] = Query(None, description="开始日期"),
    end_date: Optional[datetime] = Query(None, description="结束日期"),
    db: Session = Depends(get_db)
):
    service = LedgerService(db)
    return service.get_ledgers(skip, limit, type, category, start_date, end_date)

@router.get("/{ledger_id}", response_model=LedgerResponse, summary="查询单个账目")
def get_ledger(ledger_id: int, db: Session = Depends(get_db)):
    service = LedgerService(db)
    ledger = service.get_ledger(ledger_id)
    if not ledger:
        raise HTTPException(status_code=404, detail="账目不存在")
    return ledger

@router.put("/{ledger_id}", response_model=LedgerResponse, summary="修改账目")
def update_ledger(ledger_id: int, ledger: LedgerUpdate, db: Session = Depends(get_db)):
    service = LedgerService(db)
    updated = service.update_ledger(ledger_id, ledger)
    if not updated:
        raise HTTPException(status_code=404, detail="账目不存在")
    return updated

@router.delete("/{ledger_id}", summary="删除账目")
def delete_ledger(ledger_id: int, db: Session = Depends(get_db)):
    service = LedgerService(db)
    if not service.delete_ledger(ledger_id):
        raise HTTPException(status_code=404, detail="账目不存在")
    return {"message": "删除成功"}

@router.get("/summary/", response_model=LedgerSummary, summary="统计汇总")
def get_summary(
    start_date: Optional[datetime] = Query(None, description="开始日期"),
    end_date: Optional[datetime] = Query(None, description="结束日期"),
    db: Session = Depends(get_db)
):
    service = LedgerService(db)
    return service.get_summary(start_date, end_date)

@router.get("/categories/", summary="查询所有分类")
def get_categories(type: Optional[str] = Query(None, description="类型：income/expense")):
    categories = category_names(load_categories())
    if type:
        if type not in categories:
            raise HTTPException(status_code=400, detail="类型只能是 income 或 expense")
        return {"type": type, "categories": categories[type]}
    return categories
