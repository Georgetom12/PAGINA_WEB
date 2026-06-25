"""
CEX Signals — open_interest.py + BRIDGE PATCH
"""
import aiohttp
from loguru import logger
from telegram import Bot
from telegram.constants import ParseMode
from .. import config, db
from ..utils import esc, format_usd, symbol_clean
from bridge_utils import send_cex_signal   # ← BRIDGE

BINANCE_OI_URL = "https://fapi.binance.com/fapi/v1/openInterest"
BINANCE_PX_URL = "https://fapi.binance.com/fapi/v1/premiumIndex"
BYBIT_OI_URL   = "https://api.bybit.com/v5/market/open-interest"
BITGET_OI_URL  = "https://api.bitget.com/api/v2/mix/market/open-interest"
BINGX_OI_URL   = "https://open-api.bingx.com/openApi/swap/v2/quote/openInterest"

async def _binance_oi(symbol):
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=8)) as s:
            async with s.get(BINANCE_OI_URL, params={"symbol":symbol}) as r:
                if r.status!=200: return None
                d=await r.json(); oi=float(d.get("openInterest") or 0)
            async with s.get(BINANCE_PX_URL, params={"symbol":symbol}) as r2:
                d2=await r2.json(); price=float(d2.get("markPrice") or 0)
            return oi*price if price else None
    except Exception as e: logger.debug(f"[oi] binance {symbol}: {e}"); return None

async def _bybit_oi(symbol):
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=8)) as s:
            async with s.get(BYBIT_OI_URL, params={"category":"linear","symbol":symbol,"intervalTime":"5min","limit":"1"}) as r:
                if r.status!=200: return None
                d=await r.json(); rows=(d.get("result") or {}).get("list") or []
                return float(rows[0].get("openInterestValue") or 0) if rows else None
    except Exception as e: logger.debug(f"[oi] bybit {symbol}: {e}"); return None

async def _check_and_alert(bot, exchange, symbol, current_oi):
    prev = db.get_prev_oi(symbol, exchange)
    db.set_oi(symbol, exchange, current_oi)
    if prev is None or prev==0: return
    change_pct = (current_oi-prev)/prev*100
    if abs(change_pct) < config.OI_SPIKE_PCT: return

    token     = symbol_clean(symbol)
    direction = "SUBIÓ" if change_pct>0 else "BAJÓ"
    emoji     = "📈" if change_pct>0 else "📉"

    # ── BRIDGE PATCH ─────────────────────────────────────
    send_cex_signal(
        signal_type="oi_spike",
        exchange=exchange,
        symbol=token,
        value=change_pct,
        note=f"OI {direction} {change_pct:+.1f}% · actual={format_usd(current_oi)}",
        extra={"change_pct":change_pct,"current_oi":current_oi,"prev_oi":prev}
    )
    # ────────────────────────────────────────────────────

    signal = ("💡 <i>Dinero nuevo entrando — posible movimiento fuerte próximo</i>"
              if change_pct>0 else "💡 <i>Posiciones cerrándose — posible reducción de volatilidad</i>")
    msg=(
        f"💥 <b>CEX Signals</b>\n{emoji} <b>OI SPIKE — {esc(exchange)}</b>\n"
        f"📊 Token: <b>{esc(token)}</b>\n📌 OI {direction}: <b>{change_pct:+.1f}%</b>\n"
        f"💵 OI actual: <b>{esc(format_usd(current_oi))}</b>\n"
        f"💵 OI anterior: <b>{esc(format_usd(prev))}</b>\n\n{signal}"
    )
    try:
        await bot.send_message(chat_id=config.ALERT_CHANNEL_ID, text=msg,
                               parse_mode=ParseMode.HTML, disable_web_page_preview=True)
        logger.info(f"[oi] {exchange} {token} {direction} {change_pct:+.1f}%")
    except Exception as e: logger.warning(f"[oi] send failed: {e}")

async def scan_open_interest(bot: Bot):
    for symbol in config.TOP_SYMBOLS[:10]:
        oi = await _binance_oi(symbol)
        if oi and oi>0: await _check_and_alert(bot,"Binance",symbol,oi)
    for symbol in config.BYBIT_SYMBOLS[:8]:
        oi = await _bybit_oi(symbol)
        if oi and oi>0: await _check_and_alert(bot,"Bybit",symbol,oi)
