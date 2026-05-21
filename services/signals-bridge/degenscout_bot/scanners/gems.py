"""
DegenScout — gems.py + BRIDGE PATCH
"""
import time
from loguru import logger
from telegram import Bot
from telegram.constants import ParseMode

from .. import config, db
from ..services import geckoterminal as gecko, goplus
from ..services import coinmarketcap as cmc
from ..services import rugcheck
from ..utils import esc, format_usd, format_age, dexscreener_url
from ..utils.scorer import hold_score, score_label
from bridge_utils import send_gem_from_degen   # ← BRIDGE

SCAN_NETWORKS = list(gecko.ALL_NETWORKS)
MIN_LIQUIDITY_USD = float(10000)
MIN_SCORE = int(60)

_seen: dict[str, float] = {}
_TTL = 3600 * 4

def _recently_alerted(key):
    now = time.time()
    stale = [k for k,t in _seen.items() if now-t>_TTL]
    for k in stale: del _seen[k]
    if key in _seen: return True
    _seen[key] = now
    return False

async def _safety_for_pool(pool):
    chain = pool.get("chain","")
    addr  = pool.get("base_token_address","")
    if not addr: return "⬜",[]
    try:
        if chain == "solana":
            verdict, risks = await rugcheck.full_check(addr)
            if verdict != "⚪️": return verdict, risks
            data = await goplus.safety_solana(addr)
            return goplus.summarize_solana(data)
        else:
            data = await goplus.safety_evm(chain, addr)
            return goplus.summarize_evm(data)
    except Exception as e:
        logger.debug(f"safety check error {chain}:{addr}: {e}")
        return "⬜",[]

async def _process_pool(bot, pool, source):
    addr     = pool.get("base_token_address","")
    chain    = pool.get("chain","")
    name     = pool.get("name","?")
    pool_addr= pool.get("address","")
    if not addr or not chain: return
    key = f"gem:{chain}:{addr}"
    if db.has_seen(key): return
    if _recently_alerted(key): return
    liq = pool.get("liquidity_usd",0)
    if liq < MIN_LIQUIDITY_USD: return
    verdict, risk_lines = await _safety_for_pool(pool)
    if "🔴" in verdict:
        db.mark_seen(key, chain, addr, name); return

    age_min = None
    if pool.get("created_at"):
        try:
            from datetime import datetime, timezone
            created = datetime.fromisoformat(pool["created_at"].replace("Z","+00:00"))
            age_min = (datetime.now(timezone.utc)-created).total_seconds()/60
        except: pass

    score, reasons = hold_score(
        liquidity=liq, volume_24h=pool.get("volume_h24",0),
        volume_1h=pool.get("volume_h1",0),
        price_change_1h=pool.get("price_change_h1",0),
        price_change_6h=pool.get("price_change_h6",0),
        price_change_24h=pool.get("price_change_h24",0),
        buys_24h=pool.get("buys_h24",0), sells_24h=pool.get("sells_h24",0),
        buys_1h=pool.get("buys_h1",0),   sells_1h=pool.get("sells_h1",0),
        safety_verdict=verdict,
        age_minutes=int(age_min) if age_min is not None else None,
        market_cap=float(pool.get("market_cap_usd") or 0),
    )
    if score < MIN_SCORE: return

    db.mark_seen(key, chain, addr, name)
    _seen[key] = time.time()

    # ── BRIDGE PATCH ─────────────────────────────────────
    send_gem_from_degen(pool, score, source="dex", verdict=verdict)
    # ────────────────────────────────────────────────────

    label    = score_label(score)
    pc1h     = pool.get("price_change_h1",0)
    pc24h    = pool.get("price_change_h24",0)
    price    = pool.get("price_usd") or "?"
    fdv      = pool.get("fdv_usd") or pool.get("market_cap_usd") or 0
    buys1h   = pool.get("buys_h1",0)
    sells1h  = pool.get("sells_h1",0)
    dex      = pool.get("dex","")
    reasons_text = "\n".join(f"  • {esc(r)}" for r in reasons[:6])
    risk_text    = "\n".join(f"• {esc(r)}" for r in risk_lines[:6]) or "• Sin datos"
    safety_source = "RugCheck" if chain=="solana" else "GoPlus"

    msg = (
        f"🐺 <b>DegenScout</b>\n💎 <b>GEM DETECTADA</b> {verdict} <code>{chain.upper()}</code>\n"
        f"<b>{esc(name)}</b>  <i>{esc(dex)}</i>\n<code>{esc(addr)}</code>\n\n"
        f"🏆 Hold Score: <b>{score}/100</b> — {esc(label)}\n"
        f"📡 Fuente: <i>{esc(source)}</i>\n\n"
        f"💵 Precio: <b>${esc(str(price)[:12])}</b>\n"
        f"💧 LP: <b>{esc(format_usd(liq))}</b>\n"
        f"💰 FDV: <b>{esc(format_usd(fdv))}</b>\n"
        f"📊 Vol 1h: <b>{esc(format_usd(pool.get('volume_h1',0)))}</b>\n"
        f"📈 Δ 1h/24h: <b>{pc1h:+.1f}%</b> / <b>{pc24h:+.1f}%</b>\n"
        f"🔁 Buys/Sells 1h: <b>{buys1h}/{sells1h}</b>\n"
        f"⏱ Edad: <b>{esc(format_age(age_min))}</b>\n\n"
        f"<b>Razones:</b>\n{reasons_text}\n\n"
        f"<b>Safety ({safety_source}):</b>\n{risk_text}\n\n"
        f'<a href="{dexscreener_url(chain,pool_addr)}">Dexscreener</a>'
    )
    try:
        await bot.send_message(chat_id=config.ALERT_CHANNEL_ID, text=msg,
                               parse_mode=ParseMode.HTML, disable_web_page_preview=True)
        logger.info(f"[gems] {name} ({chain}) score={score}")
    except Exception as e:
        logger.warning(f"[gems] send failed: {e}")

async def scan_gems(bot: Bot):
    for network in SCAN_NETWORKS:
        chain_label = gecko.NETWORK_MAP.get(network, network)
        try:
            pools = await gecko.trending_pools(network)
            for p in pools[:10]: await _process_pool(bot, p, f"trending/{chain_label}")
        except Exception as e: logger.debug(f"[gems] trending {network}: {e}")
        try:
            pools = await gecko.new_pools(network)
            for p in pools[:10]: await _process_pool(bot, p, f"new/{chain_label}")
        except Exception as e: logger.debug(f"[gems] new_pools {network}: {e}")
