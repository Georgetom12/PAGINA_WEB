from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, Message

from bot.keyboards.markup import cancel_kb, payment_methods, payment_sent
from config import (
    BANK_INFO, BINANCE_PAY_ID, PAYPAL_EMAIL, PLAN_DAYS, PRICE_MONTHLY,
    ADMIN_IDS,
)
from db.database import SessionLocal
from db.models import Payment, User

router = Router()


class PaymentFlow(StatesGroup):
    choosing_method = State()
    waiting_proof   = State()


# ── Paso 1: mostrar métodos ───────────────────────────────────────────────────
@router.callback_query(F.data == "subscribe")
async def cb_subscribe(call: CallbackQuery, state: FSMContext):
    await state.set_state(PaymentFlow.choosing_method)
    await call.message.edit_text(
        f"💎 *Plan Mensual — ${PRICE_MONTHLY:.2f} USD / {PLAN_DAYS} días*\n\n"
        "Elige tu método de pago:",
        parse_mode="Markdown",
        reply_markup=payment_methods(),
    )


# ── Paso 2: mostrar instrucciones según método ───────────────────────────────
async def show_payment_instructions(call: CallbackQuery, method: str, state: FSMContext):
    await state.update_data(method=method)

    if method == "paypal":
        detail = (
            f"🅿️ *PayPal*\n\n"
            f"Envía *${PRICE_MONTHLY:.2f} USD* a:\n"
            f"`{PAYPAL_EMAIL}`\n\n"
            f"Concepto: `Señales VIP - {call.from_user.id}`"
        )
    elif method == "binance":
        detail = (
            f"🟡 *Binance Pay*\n\n"
            f"Envía *${PRICE_MONTHLY:.2f} USDT* a:\n"
            f"Pay ID: `{BINANCE_PAY_ID}`\n\n"
            f"Nota: `Señales VIP - {call.from_user.id}`"
        )
    else:
        detail = (
            f"🏦 *Transferencia Bancaria*\n\n"
            f"{BANK_INFO}\n\n"
            f"Monto: *${PRICE_MONTHLY:.2f} USD*\n"
            f"Referencia: `VIP{call.from_user.id}`"
        )

    await state.set_state(PaymentFlow.waiting_proof)
    await call.message.edit_text(
        f"{detail}\n\n"
        "Después del pago presiona el botón para enviar tu comprobante 👇",
        parse_mode="Markdown",
        reply_markup=payment_sent(),
    )


@router.callback_query(F.data == "pay_paypal")
async def cb_paypal(call: CallbackQuery, state: FSMContext):
    await show_payment_instructions(call, "paypal", state)


@router.callback_query(F.data == "pay_binance")
async def cb_binance(call: CallbackQuery, state: FSMContext):
    await show_payment_instructions(call, "binance", state)


@router.callback_query(F.data == "pay_bank")
async def cb_bank(call: CallbackQuery, state: FSMContext):
    await show_payment_instructions(call, "bank", state)


# ── Paso 3: solicitar comprobante ─────────────────────────────────────────────
@router.callback_query(F.data == "send_proof")
async def cb_send_proof(call: CallbackQuery, state: FSMContext):
    await call.message.edit_text(
        "📎 *Envía tu comprobante de pago*\n\n"
        "Puede ser:\n"
        "• Captura de pantalla 🖼️\n"
        "• Número de referencia / transacción ✍️\n\n"
        "Escribe o adjunta el comprobante ahora:",
        parse_mode="Markdown",
        reply_markup=cancel_kb(),
    )


# ── Paso 4: recibir comprobante (foto o texto) ────────────────────────────────
@router.message(PaymentFlow.waiting_proof)
async def receive_proof(message: Message, state: FSMContext, bot=None):
    data   = await state.get_data()
    method = data.get("method", "unknown")

    # Detectar tipo de comprobante
    if message.photo:
        proof = message.photo[-1].file_id
        proof_display = "📷 Captura de pantalla"
    elif message.document:
        proof = message.document.file_id
        proof_display = "📄 Documento adjunto"
    else:
        proof = message.text or "Sin comprobante"
        proof_display = f"📝 `{proof[:200]}`"

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_id == message.from_user.id).first()
        if not user:
            await message.answer("❌ Error: usuario no registrado. Escribe /start")
            return
        payment = Payment(
            user_id=user.id,
            amount=PRICE_MONTHLY,
            method=method,
            status="pending",
            proof=proof,
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)
        payment_id = payment.id
    finally:
        db.close()

    await message.answer(
        "✅ *Comprobante recibido*\n\n"
        "El admin revisará tu pago en las próximas 24 horas.\n"
        "Te notificaremos aquí cuando se active tu membresía. 🙏",
        parse_mode="Markdown",
    )
    await state.clear()

    # Notificar a los admins
    if bot and ADMIN_IDS:
        from bot.keyboards.markup import admin_payment_actions
        admin_msg = (
            f"💳 *Nuevo pago pendiente*\n\n"
            f"👤 Usuario: @{message.from_user.username or 'N/A'} "
            f"(`{message.from_user.id}`)\n"
            f"💰 Monto: ${PRICE_MONTHLY:.2f} USD\n"
            f"📦 Método: `{method}`\n"
            f"🔖 Comprobante: {proof_display}\n"
            f"🆔 Payment ID: `{payment_id}`"
        )
        for admin_id in ADMIN_IDS:
            try:
                if message.photo:
                    await bot.send_photo(
                        admin_id,
                        message.photo[-1].file_id,
                        caption=admin_msg,
                        parse_mode="Markdown",
                        reply_markup=admin_payment_actions(payment_id),
                    )
                else:
                    await bot.send_message(
                        admin_id,
                        admin_msg,
                        parse_mode="Markdown",
                        reply_markup=admin_payment_actions(payment_id),
                    )
            except Exception:
                pass


@router.callback_query(F.data == "cancel_action")
async def cb_cancel(call: CallbackQuery, state: FSMContext):
    await state.clear()
    from bot.keyboards.markup import main_menu
    await call.message.edit_text(
        "↩️ Acción cancelada.",
        reply_markup=main_menu(),
    )
