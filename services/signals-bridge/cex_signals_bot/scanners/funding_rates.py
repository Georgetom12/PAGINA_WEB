"""
CEX Signals — funding_rates.py + BRIDGE PATCH
"""
import aiohttp
from loguru import logger
from telegram import Bot
from telegram.constants import ParseMode
from .. import config, db
from ..utils import esc, symbol_clean
from bridge_utils import send_cex_signal   # ← BRIDGE

BINANCE_FR_URL = "https://fapi.binance.com/fapi/v1/fundingRate"
BYBIT_FR_URL   = "https://api.bybit.com/v5/market/funding/history"

async def _binance_funding(symbol):
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=8)) as s:
            async with s.get(BINANCE_FR_URL, params={"symbol":symbol,"limit":1}) as r:
                if r.status!=200: return None
                data=await r.json()
                return float(data[0].get("fundingRate") or 0)*100 if data else None
    except Exception as e: logger.debug(f"[fr] binance {symbol}: {e}"); return None

async def _bybit_funding(symbol):
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=8)) as s:
            async with s.get(BYBIT_FR_URL, params={"category":"linear","symbol":symbol,"limit":1}) as r:
                if r.status!=200: return None
                d=await r.json(); rows=(d.get("result") or {}).get("list") or []
                return float(rows[0].get("fundingRate") or 0)*100 if rows else None
    except Exception as e: logger.debug(f"[fr] bybit {symbol}: {e}"); return None

async def _alert_fr(bot, exchange, symbol, fr):
    token    = symbol_clean(symbol)
    event_id = f"fr:{exchange}:{symbol}:{fr:.4f}"
    if db.has_seen(event_id): return
    db.mark_seen(event_id)

    if fr > config.FR_EXTREME_HIGH:
        emoji="🔥"; label="MUY ALTO"; signal="Longs pagando demasiado → probable corrección bajista"; color="🔴"
    else:
        emoji="🧊"; label="MUY BAJO (negativo)"; signal="Shorts pagando demasiado → probable rebote alcista"; color="🟢"

    annualized = fr*3*365

    # ── BRIDGE PATCH ─────────────────────────────────────
    send_cex_signal(
        signal_type="funding",
        exchange=exchange,
        symbol=token,
        value=fr,
        note=f"Funding {fr:+.4f}% · {label}",
        extra={"annualized":annualized,"label":label,"direction":color}
    )
    # ────────────────────────────────────────────────────

    msg=(
        f"💥 <b>CEX Signals</b>\n{emoji} <b>FUNDING RATE EXTREMO — {esc(exchange)}</b>\n"
        f"📊 Token: <b>{esc(token)}</b>\n"
        f"📌 Funding: <b>{fr:+.4f}%</b> por 8h ({color} {label})\n"
        f"📅 Anualizado: <b>{annualized:+.1f}%</b>\n\n"
        f"💡 <i>{esc(signal)}</i>"
    )
    try:
        await bot.send_message(chat_id=config.ALERT_CHANNEL_ID, text=msg,
                               parse_mode=ParseMode.HTML, disable_web_page_preview=True)
        logger.info(f"[fr] {exchange} {token} funding={fr:+.4f}%")
    except Exception as e: logger.warning(f"[fr] send failed: {e}")

async def scan_funding_rates(bot: Bot):
    for symbol in config.TOP_SYMBOLS:
        fr = await _binance_funding(symbol)
        if fr is not None and (fr>config.FR_EXTREME_HIGH or fr<config.FR_EXTREME_LOW):
            await _alert_fr(bot,"Binance",symbol,fr)
    for symbol in config.BYBIT_SYMBOLS:
        fr = await _bybit_funding(symbol)
        if fr is not None and (fr>config.FR_EXTREME_HIGH or fr<config.FR_EXTREME_LOW):
            await _alert_fr(bot,"Bybit",symbol,fr)
