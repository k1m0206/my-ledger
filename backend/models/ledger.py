from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from database import Base
from money import amount_to_cents, cents_to_amount

class Ledger(Base):
    __tablename__ = "ledgers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    _amount = Column("amount", Float, nullable=True)
    amount_cents = Column(Integer, nullable=False)
    type = Column(String(10), nullable=False)  # income or expense
    category = Column(String(50), nullable=False)
    date = Column(DateTime, nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    @property
    def amount(self) -> float:
        return cents_to_amount(self.amount_cents)

    @amount.setter
    def amount(self, value):
        self.amount_cents = amount_to_cents(value)
        self._amount = float(value)
