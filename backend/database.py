from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from models.ledger import Ledger
    Base.metadata.create_all(bind=engine)
    migrate_ledger_amount_cents()


def migrate_ledger_amount_cents():
    inspector = inspect(engine)
    if "ledgers" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("ledgers")}
    if "amount_cents" in columns:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE ledgers ADD COLUMN amount_cents INTEGER"))
        if "amount" in columns:
            connection.execute(text("UPDATE ledgers SET amount_cents = CAST(ROUND(amount * 100) AS INTEGER)"))
        connection.execute(text("UPDATE ledgers SET amount_cents = 0 WHERE amount_cents IS NULL"))
