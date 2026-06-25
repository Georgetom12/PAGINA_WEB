"""
CEX Signals — liquidations.py + BRIDGE PATCH
"""
import asyncio, json, time
import aiohttp
from loguru import logger
from telegram import Bot
from telegram.constants import ParseMode
from .. import config, db
from ..utils import esc, format_usd, symbol_clean
from bridge_utils import send_cex_signal   # ← BRIDGE

BINANCE_WS_URL = "wss://fstream.binance.com/ws/!forceOrder@arr"
BYBIT_WS_URL   = "wss://stream.bybit.com/v5/public/linear"
OKX_LIQ_URL    = "https://www.okx.com/api/v5/public/liquidation-orders"
BITGET_LIQ_URL = "https://api.bitget.com/api/v2/mix/market/liquidation-order"

_seen: dict[str,float] = {}
_SEEN_TTL = 3600

def _recently_seen(key):
    now = time.time()
    stale=[k for k,t in _seen.items() if now-t>_SEEN_TTL]
    for k in stale: del _seen[k]
    if key in _seen: return True
    _seen[key]=now; return False

async def _send_liq_alert(bot, exchange, symbol, side, usd, price):
    token = symbol_clean(symbol)
    is_long_liq = side.upper() in ("SELL","LONG","BUY_LIQUIDATION")
    if exchange=="Bybit": is_long_liq = side.lower()=="sell"
    emoji    = "💥🔴" if is_long_liq else "💥🟢"
    liq_type = "LONG liquidado" if is_long_liq else "SHORT liquidado"
    impact   = ""
    if usd>=5_000_000: impact="\n🚨 <b>LIQUIDACIÓN MASIVA — posible spike</b>"
    elif usd>=2_000_000: impact="\n⚠️ <i>Liquidación muy grande</i>"

    # ── BRIDGE PATCH ─────────────────────────────────────
    send_cex_signal(
        signal_type="liquidation",
        exchange=exchange,
        symbol=token,
        value=usd,
        note=f"{liq_type} · ${price:,.4f}",
        extra={"side":liq_type,"price":price,"is_long_liq":is_long_liq}
    )
    # ────────────────────────────────────────────────────

    msg=(
        f"💥 <b>CEX Signals</b>\n{emoji} <b>LIQUIDACIÓN — {esc(exchange)}</b>\n"
        f"📊 Token: <b>{esc(token)}</b>\n📌 Tipo: <b>{liq_type}</b>\n"
        f"💵 Monto: <b>{esc(format_usd(usd))}</b>\n💲 Precio: <b>${price:,.4f}</b>{impact}"
    )
    try:
        await bot.send_message(chat_id=config.ALERT_CHANNEL_ID, text=msg,
                               parse_mode=ParseMode.HTML, disable_web_page_preview=True)
        logger.info(f"[liq] {exchange} {liq_type} {token} {format_usd(usd)}")
    except Exception as e: logger.warning(f"[liq] send failed: {e}")

async def run_binance_stream(bot):
    while True:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.ws_connect(BINANCE_WS_URL, heartbeat=20) as ws:
                    logger.info("[liq] Binance WS conectado")
                    async for msg in ws:
                        if msg.type==aiohttp.WSMsgType.TEXT:
                            try:
                                data=json.loads(msg.data); order=data.get("o") or {}
                                sym=order.get("s",""); side=order.get("S","")
                                qty=float(order.get("q") or 0); price=float(order.get("ap") or order.get("p") or 0)
                                usd=qty*price
                                if usd>=config.LIQ_MIN_USD:
                                    await _send_liq_alert(bot,"Binance",sym,side,usd,price)
                            except: pass
                        elif msg.type in (aiohttp.WSMsgType.CLOSED,aiohttp.WSMsgType.ERROR): break
        except Exception as e: logger.warning(f"[liq] Binance WS error: {e}")
        await asyncio.sleep(15)

async def run_bybit_stream(bot):
    topics=[f"liquidation.{s}" for s in config.BYBIT_SYMBOLS]
    while True:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.ws_connect(BYBIT_WS_URL, heartbeat=20) as ws:
                    await ws.send_json({"op":"subscribe","args":topics})
                    logger.info("[liq] Bybit WS conectado")
                    async for msg in ws:
                        if msg.type==aiohttp.WSMsgType.TEXT:
                            try:
                                data=json.loads(msg.data)
                                if data.get("topic","").startswith("liquidation."):
                                    d=data.get("data") or {}
                                    sym=d.get("symbol",""); side=d.get("side","")
                                    size=float(d.get("size") or 0); price=float(d.get("price") or 0)
                                    usd=size*price; key=f"bybit:{sym}:{d.get('updatedTime','')}"
                                    if usd>=config.LIQ_MIN_USD and not _recently_seen(key):
                                        await _send_liq_alert(bot,"Bybit",sym,side,usd,price)
                            except: pass
                        elif msg.type in (aiohttp.WSMsgType.CLOSED,aiohttp.WSMsgType.ERROR): break
        except Exception as e: logger.warning(f"[liq] Bybit WS error: {e}")
        await asyncio.sleep(15)

async def scan_okx_liquidations(bot):
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as s:
            async with s.get(OKX_LIQ_URL, params={"instType":"SWAP","state":"filled","limit":"50"}) as r:
                if r.status!=200: return
                data=await r.json()
                for item in (data.get("data") or []):
                    for d in (item.get("details") or []):
                        order_id=d.get("ordId") or d.get("tradeId","")
                        key=f"okx:{order_id}"
                        if not order_id or _recently_seen(key): continue
                        inst_id=item.get("instId",""); side=d.get("side","")
                        qty=float(d.get("sz") or 0); price=float(d.get("bkPx") or d.get("px") or 0)
                        usd=qty*price
                        if usd>=config.LIQ_MIN_USD:
                            await _send_liq_alert(bot,"OKX",inst_id,side,usd,price)
    except Exception as e: logger.debug(f"[liq] OKX error: {e}")

async def scan_bitget_liquidations(bot):
    for symbol in config.BITGET_SYMBOLS[:8]:
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as s:
                async with s.get(BITGET_LIQ_URL,
                    params={"symbol":symbol,"productType":"usdt-futures","pageSize":"20"}) as r:
                    if r.status!=200: continue
                    data=await r.json()
                    for item in (data.get("data") or {}).get("liquidationOrderList") or []:
                        order_id=item.get("orderId",""); key=f"bitget:{order_id}"
                        if not order_id or _recently_seen(key): continue
                        side=item.get("side",""); qty=float(item.get("size") or 0)
                        price=float(item.get("priceAvg") or item.get("price") or 0)
                        usd=qty*price
                        if usd>=config.LIQ_MIN_USD:
                            await _send_liq_alert(bot,"Bitget",symbol,side,usd,price)
        except Exception as e: logger.debug(f"[liq] Bitget {symbol} error: {e}")
