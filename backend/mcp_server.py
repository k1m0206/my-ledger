"""
My Ledger MCP Server - AI Agent 结构化工具入口

运行方式:
    python mcp_server.py
"""

from contextlib import contextmanager
from datetime import datetime
from typing import Any, Optional

from mcp.server.fastmcp import FastMCP
from pydantic import ValidationError
from sqlalchemy.orm import Session

from category_store import category_names, load_categories
from database import SessionLocal, init_db
from schemas.ledger import LedgerCreate, LedgerType, LedgerUpdate
from services.ledger import LedgerService


mcp = FastMCP(
    "my-ledger",
    instructions=(
        "My Ledger 是本地个人记账工具。优先使用 list_ledgers 查询明细，"
        "使用 get_ledger_summary 统计收支，新增或修改账目前先确认金额、类型和分类。"
    ),
)


@contextmanager
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def parse_datetime(value: Optional[str], field_name: str) -> Optional[datetime]:
    if not value:
        return None

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(f"{field_name} 必须是 ISO 8601 日期时间，例如 2026-05-20T12:30:00") from exc


def ledger_to_dict(ledger) -> dict[str, Any]:
    return {
        "id": ledger.id,
        "amount": ledger.amount,
        "type": ledger.type,
        "category": ledger.category,
        "date": ledger.date.isoformat(),
        "note": ledger.note,
        "created_at": ledger.created_at.isoformat() if ledger.created_at else None,
        "updated_at": ledger.updated_at.isoformat() if ledger.updated_at else None,
    }


def service_for(db: Session) -> LedgerService:
    return LedgerService(db)


@mcp.tool()
def list_ledgers(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    type: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> dict[str, Any]:
    """查询账目列表，可按时间、类型和分类筛选，返回结构化账目数组。"""
    if skip < 0:
        raise ValueError("skip 不能小于 0")
    if limit < 1 or limit > 1000:
        raise ValueError("limit 必须在 1 到 1000 之间")
    if type is not None and type not in {LedgerType.INCOME.value, LedgerType.EXPENSE.value}:
        raise ValueError("type 只能是 income 或 expense")

    parsed_start = parse_datetime(start_date, "start_date")
    parsed_end = parse_datetime(end_date, "end_date")

    with db_session() as db:
        records = service_for(db).get_ledgers(skip, limit, type, category, parsed_start, parsed_end)
        items = [ledger_to_dict(record) for record in records]

    return {
        "count": len(items),
        "items": items,
    }


@mcp.tool()
def search_ledgers(
    keyword: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    type: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 100,
) -> dict[str, Any]:
    """按关键词搜索账目，匹配金额、类型、分类、备注和日期字段。"""
    normalized_keyword = keyword.strip().lower()
    if not normalized_keyword:
        raise ValueError("keyword 不能为空")
    if limit < 1 or limit > 1000:
        raise ValueError("limit 必须在 1 到 1000 之间")
    if type is not None and type not in {LedgerType.INCOME.value, LedgerType.EXPENSE.value}:
        raise ValueError("type 只能是 income 或 expense")

    parsed_start = parse_datetime(start_date, "start_date")
    parsed_end = parse_datetime(end_date, "end_date")

    with db_session() as db:
        records = service_for(db).get_ledgers(0, 1000, type, category, parsed_start, parsed_end)

        matched = []
        for record in records:
            values = [
                str(record.amount),
                f"{record.amount:.2f}",
                record.type,
                "收入" if record.type == LedgerType.INCOME.value else "支出",
                record.category,
                record.note or "",
                record.date.isoformat(),
                record.date.strftime("%Y-%m-%d"),
                record.date.strftime("%H:%M"),
            ]
            if any(normalized_keyword in value.lower() for value in values):
                matched.append(ledger_to_dict(record))
                if len(matched) >= limit:
                    break

    return {
        "count": len(matched),
        "items": matched,
    }


@mcp.tool()
def get_ledger(ledger_id: int) -> dict[str, Any]:
    """按 ID 查询单个账目。"""
    with db_session() as db:
        ledger = service_for(db).get_ledger(ledger_id)
        if not ledger:
            raise ValueError("账目不存在")
        return ledger_to_dict(ledger)


@mcp.tool()
def get_ledger_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> dict[str, Any]:
    """统计指定时间范围内的收入、支出、结余和账目数量。"""
    parsed_start = parse_datetime(start_date, "start_date")
    parsed_end = parse_datetime(end_date, "end_date")

    with db_session() as db:
        summary = service_for(db).get_summary(parsed_start, parsed_end)

    return summary.model_dump()


@mcp.tool()
def get_categories(type: Optional[str] = None) -> dict[str, Any]:
    """查询收入或支出分类名称；不传 type 时返回全部分类。"""
    categories = category_names(load_categories())
    if type:
        if type not in categories:
            raise ValueError("type 只能是 income 或 expense")
        return {"type": type, "categories": categories[type]}
    return categories


@mcp.tool()
def add_ledger(
    amount: float,
    type: str,
    category: str,
    date: Optional[str] = None,
    note: Optional[str] = None,
) -> dict[str, Any]:
    """新增一笔账目，type 必须是 income 或 expense，date 使用 ISO 8601 日期时间。"""
    data: dict[str, Any] = {
        "amount": amount,
        "type": type,
        "category": category,
        "note": note,
    }
    if date is not None:
        data["date"] = parse_datetime(date, "date")

    try:
        payload = LedgerCreate(**data)
    except ValidationError as exc:
        raise ValueError(str(exc)) from exc

    with db_session() as db:
        ledger = service_for(db).create_ledger(payload)
        return ledger_to_dict(ledger)


@mcp.tool()
def update_ledger(
    ledger_id: int,
    amount: Optional[float] = None,
    type: Optional[str] = None,
    category: Optional[str] = None,
    date: Optional[str] = None,
    note: Optional[str] = None,
) -> dict[str, Any]:
    """修改一笔账目，只传需要更新的字段。"""
    data: dict[str, Any] = {}
    if amount is not None:
        data["amount"] = amount
    if type is not None:
        data["type"] = type
    if category is not None:
        data["category"] = category
    if date is not None:
        data["date"] = parse_datetime(date, "date")
    if note is not None:
        data["note"] = note

    try:
        payload = LedgerUpdate(**data)
    except ValidationError as exc:
        raise ValueError(str(exc)) from exc

    with db_session() as db:
        ledger = service_for(db).update_ledger(ledger_id, payload)
        if not ledger:
            raise ValueError("账目不存在")
        return ledger_to_dict(ledger)


@mcp.tool()
def delete_ledger(ledger_id: int) -> dict[str, Any]:
    """按 ID 删除账目；调用前必须确认用户明确指定了要删除的账目 ID。"""
    with db_session() as db:
        deleted = service_for(db).delete_ledger(ledger_id)

    if not deleted:
        raise ValueError("账目不存在")
    return {"deleted": True, "ledger_id": ledger_id}


if __name__ == "__main__":
    init_db()
    mcp.run()
