from datetime import datetime
from sqlalchemy import (
    Boolean, Column, DateTime, Float, Integer, String, Text, ForeignKey
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True)
    telegram_id   = Column(Integer, unique=True, nullable=False)
    username      = Column(String(120), nullable=True)
    full_name     = Column(String(200), nullable=True)
    joined_at     = Column(DateTime, default=datetime.utcnow)
    is_banned     = Column(Boolean, default=False)

    subscriptions = relationship("Subscription", back_populates="user")
    payments      = relationship("Payment", back_populates="user")

    @property
    def active_sub(self):
        now = datetime.utcnow()
        for s in self.subscriptions:
            if s.status == "active" and s.end_date > now:
                return s
        return None


class Subscription(Base):
    __tablename__ = "subscriptions"

    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    status     = Column(String(20), default="pending")  # pending | active | expired | cancelled
    plan       = Column(String(50), default="monthly")
    amount     = Column(Float, default=5.0)
    start_date = Column(DateTime, nullable=True)
    end_date   = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="subscriptions")


class Payment(Base):
    __tablename__ = "payments"

    id          = Column(Integer, primary_key=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount      = Column(Float, default=5.0)
    currency    = Column(String(10), default="USD")
    method      = Column(String(30))   # paypal | binance_pay | bank
    status      = Column(String(20), default="pending")  # pending | approved | rejected
    proof       = Column(Text, nullable=True)   # file_id o texto de referencia
    note        = Column(Text, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="payments")


class Signal(Base):
    __tablename__ = "signals"

    id          = Column(Integer, primary_key=True)
    symbol      = Column(String(20), nullable=True)
    signal_type = Column(String(30))   # BUY | SELL | STRONG_BUY | STRONG_SELL | NEUTRAL
    timeframe   = Column(String(10), nullable=True)
    content     = Column(Text, nullable=False)
    source      = Column(String(20), default="auto")  # auto | manual
    sent_by     = Column(Integer, nullable=True)       # telegram_id del admin si es manual
    sent_at     = Column(DateTime, default=datetime.utcnow)
