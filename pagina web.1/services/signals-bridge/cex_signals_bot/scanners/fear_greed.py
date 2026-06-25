"""
CEX Signals — fear_greed.py + BRIDGE PATCH
"""
import aiohttp
from loguru import logger
from telegram import Bot
from telegram.constants import ParseMode
from .. import config, db
from ..utils import esc
from bridge_utils import send_cex_signal   # ← BRIDGE

FNG_URL       = "https://api.alternative.me/fng/?limit=2"
FEAR_EXTREME  = 15
GREED_EXTREME = 85
_last_value = None

def _label(value):
    if value<=25:   return "😱 Miedo Extremo"
    elif value<=45: return "😰 Miedo"
    elif value<=55: return "😐 Neutral"
    elif value<=75: return "😄 Codicia"
    else:           return "🤑 Codicia Extrema"

async def scan_fear_greed(bot: Bot):
    global _last_value
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as s:
            async with s.get(FNG_URL) as r:
                if r.status!=200: return
                d=await r.json(content_type=None); data=d.get("data") or []
                if not data: return
                current=int(data[0].get("value") or 0)
    except Exception as e: logger.debug(f"[fng] error: {e}"); return

    if current<=0: return
    event_id=f"fng:{current}"

    if current<=FEAR_EXTREME:
        if db.has_seen(event_id): _last_value=current; return
        db.mark_seen(event_id)
        emoji="😱"; zone="MIEDO EXTREMO"; color="🔴"
        signal="Mercado en pánico máximo → históricamente zona de compra"
    elif current>=GREED_EXTREME:
        if db.has_seen(event_id): _last_value=current; return
        db.mark_seen(event_id)
        emoji="🤑"; zone="EUFORIA EXTREMA"; color="🟡"
        signal="Mercado en euforia máxima → posible corrección próxima"
    else:
        _last_value=current; return

    # ── BRIDGE PATCH ─────────────────────────────────────
    send_cex_signal(
        signal_type="fear_greed",
        exchange="Alternative.me",
        symbol="CRYPTO",
        value=current,
        note=f"{zone} · {current}/100",
        extra={"zone":zone,"label":_label(current),"color":color}
    )
    # ────────────────────────────────────────────────────

    msg=(
        f"💥 <b>CEX Signals</b>\n{emoji} <b>FEAR &amp; GREED EXTREMO</b>\n"
        f"📊 Índice: <b>{current}/100</b> — {color} <b>{esc(zone)}</b>\n"
        f"📌 Clasificación: <i>{esc(_label(current))}</i>\n\n"
        f"💡 <i>{esc(signal)}</i>\n\n"
        f"<i>Fuente: alternative.me/crypto/fear-and-greed-index</i>"
    )
    try:
        await bot.send_message(chat_id=config.ALERT_CHANNEL_ID, text=msg,
                               parse_mode=ParseMode.HTML, disable_web_page_preview=True)
        logger.info(f"[fng] alerta: {current}/100 — {zone}")
    except Exception as e: logger.warning(f"[fng] send failed: {e}")
    _last_value=current
