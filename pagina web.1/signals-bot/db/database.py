from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.models import Base
from config import DATABASE_URL

# Railway pone postgres:// pero SQLAlchemy necesita postgresql://
_url = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    _url,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in _url else {},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
