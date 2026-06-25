"""
CEX Signals — long_short.py + BRIDGE PATCH
"""
import asyncio
from loguru import logger
from telegram import Bot
from telegram.constants import ParseMode
from .. import config, db
from ..utils import esc, symbol_clean
from ..services.coinglass import multi_exchange_ls
from bridge_utils import send_cex_signal   # ← BRIDGE

LONG_EXTREME  = float(70)
SHORT_EXTREME = float(65)

SYMBOLS_LS = [
    ("BTCUSDT","BTCUSDT"),("ETHUSDT","ETHUSDT"),("SOLUSDT","SOLUSDT"),
    ("BNBUSDT","BNBUSDT"),("XRPUSDT","XRPUSDT"),("DOGEUSDT","DOGEUSDT"),("PEPEUSDT","PEPEUSDT"),
]

async def _alert_ls(bot, symbol, long_pct, short_pct, source):
    token    = symbol_clean(symbol)
    event_id = f"ls:{symbol}:{int(long_pct)}"
    if db.has_seen(event_id): return
    db.mark_seen(event_id)

    if long_pct>=LONG_EXTREME:
        emoji="🐂🔥"; label="LONGS EXTREMOS"; color="🔴"
        signal=f"El {long_pct:.1f}% del mercado está largo → riesgo de corrección bajista"
    else:
        emoji="🐻🔥"; label="SHORTS EXTREMOS"; color="🟢"
        signal=f"El {short_pct:.1f}% del mercado está corto → riesgo de short squeeze alcista"

    # ── BRIDGE PATCH ─────────────────────────────────────
    send_cex_signal(
        signal_type="long_short",
        exchange=source,
        symbol=token,
        value=long_pct,
        note=f"{label} · Longs={long_pct:.1f}% Shorts={short_pct:.1f}%",
        extra={"long_pct":long_pct,"short_pct":short_pct,"label":label}
    )
    # ────────────────────────────────────────────────────

    msg=(
        f"💥 <b>CEX Signals</b>\n{emoji} <b>RATIO L/S EXTREMO — {esc(source)}</b>\n"
        f"📊 Token: <b>{esc(token)}</b>\n📌 Estado: {color} <b>{label}</b>\n\n"
        f"🐂 Longs: <b>{long_pct:.1f}%</b>\n🐻 Shorts: <b>{short_pct:.1f}%</b>\n\n"
        f"💡 <i>{esc(signal)}</i>"
    )
    try:
        await bot.send_message(chat_id=config.ALERT_CHANNEL_ID, text=msg,
                               parse_mode=ParseMode.HTML, disable_web_page_preview=True)
        logger.info(f"[ls] {token} longs={long_pct:.1f}% shorts={short_pct:.1f}%")
    except Exception as e: logger.warning(f"[ls] send failed: {e}")

async def scan_long_short(bot: Bot):
    for sym_bn, sym_by in SYMBOLS_LS:
        try:
            data = await multi_exchange_ls(sym_bn, sym_by)
            if not data: continue
            long_pct=data["long_pct"]; short_pct=data["short_pct"]; source=data["source"]
            if long_pct>=LONG_EXTREME or short_pct>=SHORT_EXTREME:
                await _alert_ls(bot, sym_bn, long_pct, short_pct, source)
            await asyncio.sleep(0.5)
        except Exception as e: logger.debug(f"[ls] {sym_bn}: {e}")
