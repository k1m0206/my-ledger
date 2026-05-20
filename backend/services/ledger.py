from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from models.ledger import Ledger
from schemas.ledger import LedgerCreate, LedgerUpdate, LedgerSummary
from money import amount_to_cents, cents_to_amount

class LedgerService:
    def __init__(self, db: Session):
        self.db = db

    def create_ledger(self, ledger: LedgerCreate) -> Ledger:
        db_ledger = Ledger(
            amount=ledger.amount,
            type=ledger.type.value,
            category=ledger.category,
            date=ledger.date,
            note=ledger.note
        )
        self.db.add(db_ledger)
        self.db.commit()
        self.db.refresh(db_ledger)
        return db_ledger

    def batch_create_ledgers(self, ledgers: List[LedgerCreate]) -> List[Ledger]:
        db_ledgers = []
        for ledger in ledgers:
            db_ledger = Ledger(
                amount=ledger.amount,
                type=ledger.type.value,
                category=ledger.category,
                date=ledger.date or datetime.now(),
                note=ledger.note
            )
            db_ledgers.append(db_ledger)
        
        self.db.add_all(db_ledgers)
        self.db.commit()
        
        for db_ledger in db_ledgers:
            self.db.refresh(db_ledger)
        
        return db_ledgers

    def get_ledger(self, ledger_id: int) -> Optional[Ledger]:
        return self.db.query(Ledger).filter(Ledger.id == ledger_id).first()

    def get_ledgers(
        self,
        skip: int = 0,
        limit: int = 100,
        type: Optional[str] = None,
        category: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Ledger]:
        query = self.db.query(Ledger)
        
        if type:
            query = query.filter(Ledger.type == type)
        if category:
            query = query.filter(Ledger.category == category)
        if start_date:
            query = query.filter(Ledger.date >= start_date)
        if end_date:
            query = query.filter(Ledger.date <= end_date)
        
        return query.order_by(Ledger.date.desc()).offset(skip).limit(limit).all()

    def update_ledger(self, ledger_id: int, ledger: LedgerUpdate) -> Optional[Ledger]:
        db_ledger = self.db.query(Ledger).filter(Ledger.id == ledger_id).first()
        if not db_ledger:
            return None
        
        update_data = ledger.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if key == "amount":
                db_ledger.amount = value
            elif hasattr(db_ledger, key):
                setattr(db_ledger, key, value)
        
        self.db.commit()
        self.db.refresh(db_ledger)
        return db_ledger

    def delete_ledger(self, ledger_id: int) -> bool:
        db_ledger = self.db.query(Ledger).filter(Ledger.id == ledger_id).first()
        if not db_ledger:
            return False
        
        self.db.delete(db_ledger)
        self.db.commit()
        return True

    def get_summary(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> LedgerSummary:
        query = self.db.query(Ledger)
        
        if start_date:
            query = query.filter(Ledger.date >= start_date)
        if end_date:
            query = query.filter(Ledger.date <= end_date)
        
        income_cents = sum(item.amount_cents for item in query.filter(Ledger.type == "income").all())
        expense_cents = sum(item.amount_cents for item in query.filter(Ledger.type == "expense").all())
        count = query.count()
        
        return LedgerSummary(
            total_income=cents_to_amount(income_cents),
            total_expense=cents_to_amount(expense_cents),
            net_income=cents_to_amount(income_cents - expense_cents),
            count=count
        )
