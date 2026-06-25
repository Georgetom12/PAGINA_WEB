from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery
from sqlalchemy.orm import Session

from bot.keyboards.markup import main_menu
from config import PRICE_MONTHLY, PLAN_DAYS
from db.database import SessionLocal
from db.models import User

router = Router()


def get_or_create_user(db: Session, tg_id: int, username: str, full_name: str) -> User:
    user = db.query(User).filter(User.telegram_id == tg_id).first()
    if not user:
        user = User(telegram_id=tg_id, username=username, full_name=full_name)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.message(Command("start"))
async def cmd_start(message: Message):
    db = SessionLocal()
    try:
        user = get_or_create_user(
            db,
            message.from_user.id,
            message.from_user.username or "",
            message.from_user.full_name or "",
        )
        sub = user.active_sub
        status_line = (
            f"✅ *Membresía activa* hasta `{sub.end_date.strftime('%d/%m/%Y')}`"
            if sub
            else f"🔓 Sin membresía activa"
        )
    finally:
        db.close()

    await message.answer(
        f"👋 *Bienvenido a Señales VIP Crypto*\n\n"
        f"Recibe señales de trading generadas con análisis técnico avanzado:\n"
        f"• RSI · EMA 9/21/50/200\n"
        f"• CVD · Open Interest · Volumen\n"
        f"• Soportes y resistencias\n"
        f"• Ciclo macro de 4 años (halvings)\n\n"
        f"💰 *Precio:* ${PRICE_MONTHLY:.2f} USD / {PLAN_DAYS} días\n\n"
        f"{status_line}",
        parse_mode="Markdown",
        reply_markup=main_menu(),
    )


@router.callback_query(F.data == "back_main")
async def back_main(call: CallbackQuery):
    await call.message.edit_text(
        "📋 *Menú principal* — elige una opción:",
        parse_mode="Markdown",
        reply_markup=main_menu(),
    )


@router.callback_query(F.data == "status")
async def cb_status(call: CallbackQuery):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_id == call.from_user.id).first()
        sub = user.active_sub if user else None
        if sub:
            msg = (
                f"✅ *Membresía activa*\n"
                f"Vence: `{sub.end_date.strftime('%d/%m/%Y %H:%M')} UTC`\n"
                f"Plan: `{sub.plan}`"
            )
        else:
            msg = "❌ No tienes membresía activa.\nUsa *Suscribirme* para activar."
    finally:
        db.close()

    await call.message.edit_text(msg, parse_mode="Markdown", reply_markup=main_menu())


@router.callback_query(F.data == "how")
async def cb_how(call: CallbackQuery):
    await call.message.edit_text(
        "📖 *¿Cómo funciona?*\n\n"
        "1️⃣ Presiona *Suscribirme*\n"
        "2️⃣ Elige tu método de pago\n"
        "3️⃣ Realiza el pago y envía el comprobante\n"
        "4️⃣ El admin verifica en máx. 24h\n"
        "5️⃣ Te agregamos al canal privado 📡\n\n"
        "⚠️ *Aviso:* Las señales son informativas, no garantizan ganancias. "
        "Opera siempre con gestión de riesgo.",
        parse_mode="Markdown",
        reply_markup=main_menu(),
    )
