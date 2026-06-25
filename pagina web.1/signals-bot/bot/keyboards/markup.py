from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

# ── Inicio ────────────────────────────────────────────────────────────────────
def main_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💎 Suscribirme", callback_data="subscribe")],
        [InlineKeyboardButton(text="📊 Mi estado",   callback_data="status")],
        [InlineKeyboardButton(text="ℹ️ Cómo funciona", callback_data="how")],
    ])

# ── Métodos de pago ───────────────────────────────────────────────────────────
def payment_methods() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🅿️ PayPal",         callback_data="pay_paypal")],
        [InlineKeyboardButton(text="🟡 Binance Pay",    callback_data="pay_binance")],
        [InlineKeyboardButton(text="🏦 Transferencia",  callback_data="pay_bank")],
        [InlineKeyboardButton(text="🔙 Volver",         callback_data="back_main")],
    ])

# ── Confirmación de pago enviado ──────────────────────────────────────────────
def payment_sent() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Ya pagué, aquí mi comprobante",
                              callback_data="send_proof")],
        [InlineKeyboardButton(text="🔙 Volver", callback_data="back_main")],
    ])

# ── Admin: aprobar / rechazar ─────────────────────────────────────────────────
def admin_payment_actions(payment_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Aprobar",
                                 callback_data=f"approve_{payment_id}"),
            InlineKeyboardButton(text="❌ Rechazar",
                                 callback_data=f"reject_{payment_id}"),
        ],
    ])

# ── Cancelar ──────────────────────────────────────────────────────────────────
def cancel_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="❌ Cancelar", callback_data="cancel_action")],
    ])
