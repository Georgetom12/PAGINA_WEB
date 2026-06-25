from datetime import datetime, timedelta
from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery

from config import ADMIN_IDS, PLAN_DAYS, CHANNEL_ID
from db.database import SessionLocal
from db.models import Payment, Signal, Subscription, User

router = Router()


def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS


# ── Guardia admin ─────────────────────────────────────────
async def admin_guard(obj) -> bool:
    uid = obj.from_user.id if hasattr(obj, "from_user") else 0
    if not is_admin(uid):
        if hasattr(obj, "answer"):
            await obj.answer("⛔ No tienes permisos.")
        return False
    return True


# ── /admin ────────────────────────────────────────────────
@router.message(Command("admin"))
async def cmd_admin(message: Message):
    if not await admin_guard(message):
        return
    db = SessionLocal()
    try:
        total       = db.query(User).count()
        active_subs = db.query(Subscription).filter(
            Subscription.status == "active",
            Subscription.end_date > datetime.utcnow(),
        ).count()
        pending_pay = db.query(Payment).filter(Payment.status == "pending").count()
    finally:
        db.close()

    await message.answer(
        f"🔐 *Panel Admin*\n\n"
        f"👥 Usuarios registrados: `{total}`\n"
        f"✅ Membresías activas: `{active_subs}`\n"
        f"⏳ Pagos pendientes: `{pending_pay}`\n\n"
        f"Comandos disponibles:\n"
        f"`/pending` — ver pagos pendientes\n"
        f"`/members` — ver miembros activos\n"
        f"`/signal <texto>` — enviar señal manual al canal\n"
        f"`/kick <telegram_id>` — remover miembro\n",
        parse_mode="Markdown",
    )


# ── /pending ──────────────────────────────────────────────
@router.message(Command("pending"))
async def cmd_pending(message: Message):
    if not await admin_guard(message):
        return
    from bot.keyboards.markup import admin_payment_actions
    db = SessionLocal()
    try:
        payments = (
            db.query(Payment)
            .filter(Payment.status == "pending")
            .order_by(Payment.created_at)
            .limit(10)
            .all()
        )
        if not payments:
            await message.answer("✅ No hay pagos pendientes.")
            return
        for p in payments:
            user = db.query(User).filter(User.id == p.user_id).first()
            txt = (
                f"💳 *Pago #{p.id}*\n"
                f"👤 @{user.username or 'N/A'} (`{user.telegram_id}`)\n"
                f"💰 ${p.amount:.2f} — `{p.method}`\n"
                f"📅 {p.created_at.strftime('%d/%m/%Y %H:%M')} UTC\n"
                f"🔖 Ref: `{(p.proof or '')[:100]}`"
            )
            await message.answer(
                txt,
                parse_mode="Markdown",
                reply_markup=admin_payment_actions(p.id),
            )
    finally:
        db.close()


# ── Aprobar pago ──────────────────────────────────────────
@router.callback_query(F.data.startswith("approve_"))
async def cb_approve(call: CallbackQuery):
    if not await admin_guard(call):
        return
    payment_id = int(call.data.split("_")[1])
    db = SessionLocal()
    try:
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment or payment.status != "pending":
            await call.answer("⚠️ Pago no encontrado o ya procesado.")
            return
        payment.status      = "approved"
        payment.reviewed_at = datetime.utcnow()

        user = db.query(User).filter(User.id == payment.user_id).first()
        now  = datetime.utcnow()
        sub  = Subscription(
            user_id    = user.id,
            status     = "active",
            plan       = "monthly",
            amount     = payment.amount,
            start_date = now,
            end_date   = now + timedelta(days=PLAN_DAYS),
        )
        db.add(sub)
        db.commit()
        tg_id = user.telegram_id
    finally:
        db.close()

    # Agregar al canal privado
    try:
        await call.bot.unban_chat_member(CHANNEL_ID, tg_id)
        invite = await call.bot.create_chat_invite_link(
            CHANNEL_ID, member_limit=1, expire_date=int(datetime.utcnow().timestamp()) + 600
        )
        await call.bot.send_message(
            tg_id,
            f"🎉 *¡Membresía activada!*\n\n"
            f"Accede al canal de señales:\n{invite.invite_link}\n\n"
            f"⚠️ El enlace expira en 10 minutos.",
            parse_mode="Markdown",
        )
    except Exception as e:
        await call.message.reply(f"⚠️ No pude agregar al canal: {e}")

    await call.message.edit_text(
        call.message.text + f"\n\n✅ *APROBADO* por @{call.from_user.username}",
        parse_mode="Markdown",
    )
    await call.answer("✅ Membresía activada.")


# ── Rechazar pago ─────────────────────────────────────────
@router.callback_query(F.data.startswith("reject_"))
async def cb_reject(call: CallbackQuery):
    if not await admin_guard(call):
        return
    payment_id = int(call.data.split("_")[1])
    db = SessionLocal()
    try:
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            await call.answer("⚠️ Pago no encontrado.")
            return
        payment.status      = "rejected"
        payment.reviewed_at = datetime.utcnow()
        db.commit()
        tg_id = db.query(User).filter(User.id == payment.user_id).first().telegram_id
    finally:
        db.close()

    await call.bot.send_message(
        tg_id,
        "❌ *Tu pago fue rechazado*\n\n"
        "El comprobante no pudo verificarse. Si crees que es un error, "
        "contáctanos directamente.\nEscribe /start para intentar de nuevo.",
        parse_mode="Markdown",
    )
    await call.message.edit_text(
        call.message.text + f"\n\n❌ *RECHAZADO* por @{call.from_user.username}",
        parse_mode="Markdown",
    )
    await call.answer("❌ Pago rechazado.")


# ── /signal <texto> ───────────────────────────────────────
@router.message(Command("signal"))
async def cmd_manual_signal(message: Message):
    if not await admin_guard(message):
        return
    text = message.text.removeprefix("/signal").strip()
    if not text:
        await message.answer("Uso: `/signal Tu señal aquí`", parse_mode="Markdown")
        return

    signal_text = (
        f"📡 *SEÑAL MANUAL*\n"
        f"{'─'*30}\n"
        f"{text}\n"
        f"{'─'*30}\n"
        f"⏰ {datetime.utcnow().strftime('%d/%m/%Y %H:%M')} UTC\n"
        f"⚠️ _Esto no es asesoría financiera. Opera con responsabilidad._"
    )
    await message.bot.send_message(CHANNEL_ID, signal_text, parse_mode="Markdown")

    db = SessionLocal()
    try:
        sig = Signal(
            signal_type="manual",
            content=text,
            source="manual",
            sent_by=message.from_user.id,
        )
        db.add(sig)
        db.commit()
    finally:
        db.close()

    await message.answer("✅ Señal enviada al canal.")


# ── /members ──────────────────────────────────────────────
@router.message(Command("members"))
async def cmd_members(message: Message):
    if not await admin_guard(message):
        return
    db = SessionLocal()
    try:
        subs = (
            db.query(Subscription)
            .filter(
                Subscription.status == "active",
                Subscription.end_date > datetime.utcnow(),
            )
            .all()
        )
        if not subs:
            await message.answer("No hay miembros activos.")
            return
        lines = [f"👥 *Miembros activos ({len(subs)}):*\n"]
        for s in subs:
            u = db.query(User).filter(User.id == s.user_id).first()
            lines.append(
                f"• @{u.username or 'N/A'} — vence `{s.end_date.strftime('%d/%m/%Y')}`"
            )
        await message.answer("\n".join(lines), parse_mode="Markdown")
    finally:
        db.close()


# ── /kick <id> ────────────────────────────────────────────
@router.message(Command("kick"))
async def cmd_kick(message: Message):
    if not await admin_guard(message):
        return
    parts = message.text.split()
    if len(parts) < 2:
        await message.answer("Uso: `/kick <telegram_id>`", parse_mode="Markdown")
        return
    tg_id = int(parts[1])
    try:
        await message.bot.ban_chat_member(CHANNEL_ID, tg_id)
        await message.bot.unban_chat_member(CHANNEL_ID, tg_id)
        await message.answer(f"✅ Usuario `{tg_id}` removido del canal.", parse_mode="Markdown")
    except Exception as e:
        await message.answer(f"❌ Error: {e}")
