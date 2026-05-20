from pydantic import BaseModel, Field
from datetime import datetime
from decimal import Decimal
from typing import Optional
from enum import Enum

class LedgerType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"

class LedgerCreate(BaseModel):
    amount: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2, description="金额，最多保留两位小数")
    type: LedgerType = Field(..., description="类型：income/expense")
    category: str = Field(..., min_length=1, max_length=50, description="分类")
    date: Optional[datetime] = Field(default_factory=datetime.now, description="日期")
    note: Optional[str] = Field(None, max_length=500, description="备注")

class LedgerUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0, max_digits=12, decimal_places=2, description="金额，最多保留两位小数")
    type: Optional[LedgerType] = Field(None, description="类型：income/expense")
    category: Optional[str] = Field(None, min_length=1, max_length=50, description="分类")
    date: Optional[datetime] = Field(None, description="日期")
    note: Optional[str] = Field(None, max_length=500, description="备注")

class LedgerResponse(BaseModel):
    id: int
    amount: float
    type: str
    category: str
    date: datetime
    note: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LedgerSummary(BaseModel):
    total_income: float
    total_expense: float
    net_income: float
    count: int
