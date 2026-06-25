"""
DegenScout — cmc_listings.py + BRIDGE PATCH
"""
import aiohttp
from loguru import logger
from telegram import Bot
from telegram.constants import ParseMode
from .. import config, db
from ..utils import esc, format_usd
from ..services.coinmarketcap import _headers, BASE, is_enabled
from bridge_utils import send_gem_from_cmc   # ← BRIDGE

CMC_MAX_MCAP_NEW = float(50_000_000)

async def scan_cmc_listings(bot: Bot):
    if not is_enabled(): return
    try:
        params = {"limit":"20","sort":"date_added","sort_dir":"desc","convert":"USD"}
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15)) as s:
            async with s.get(f"{BASE}/v1/cryptocurrency/listings/latest",
                             headers=_headers(), params=params) as r:
                if r.status != 200: return
                data   = await r.json()
                tokens = data.get("data") or []
    except Exception as e:
        logger.debug(f"[cmc_list] error: {e}"); return

    for token in tokens:
        cmc_id = token.get("id")
        symbol = token.get("symbol","?")
        name   = token.get("name","?")
        quote  = (token.get("quote") or {}).get("USD") or {}
        mcap   = float(quote.get("market_cap") or 0)
        price  = float(quote.get("price") or 0)
        vol24h = float(quote.get("volume_24h") or 0)
        pc24h  = float(quote.get("percent_change_24h") or 0)
        rank   = token.get("cmc_rank") or 0
        date_added = token.get("date_added","")[:10]
        if mcap > CMC_MAX_MCAP_NEW: continue
        key = f"cmc_list:{cmc_id}"
        if db.has_seen(key): continue
        db.mark_seen(key,"cmc",str(cmc_id),name)

        # ── BRIDGE PATCH ─────────────────────────────────
        send_gem_from_cmc(cmc_id, symbol, name, mcap, price, vol24h, pc24h)
        # ────────────────────────────────────────────────

        pc_emoji = "📈" if pc24h>=0 else "📉"
        msg = (
            f"🐺 <b>DegenScout</b>\n🆕 <b>NUEVO LISTING CMC</b>\n"
            f"🪙 <b>{esc(name)}</b> <code>{esc(symbol)}</code>\n"
            f"📅 Listado: <b>{esc(date_added)}</b>  |  Rank #{rank}\n\n"
            f"💵 Precio: <b>${price:.6f}</b>\n"
            f"💰 Market Cap: <b>{esc(format_usd(mcap))}</b>\n"
            f"📊 Vol 24h: <b>{esc(format_usd(vol24h))}</b>\n"
            f"{pc_emoji} Δ 24h: <b>{pc24h:+.2f}%</b>\n\n"
            f"💡 <i>Token recién listado en CoinMarketCap — early discovery</i>\n"
            f'<a href="https://coinmarketcap.com/currencies/{esc(name.lower().replace(" ","-"))}/">Ver en CMC</a>'
        )
        try:
            await bot.send_message(chat_id=config.ALERT_CHANNEL_ID, text=msg,
                                   parse_mode=ParseMode.HTML, disable_web_page_preview=True)
            logger.info(f"[cmc_list] {name} ({symbol}) mcap={format_usd(mcap)}")
        except Exception as e: logger.warning(f"[cmc_list] send failed: {e}")
