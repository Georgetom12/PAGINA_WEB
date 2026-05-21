"""
DegenScout — pump_fun.py + BRIDGE PATCH
"""
from loguru import logger
from telegram import Bot
from telegram.constants import ParseMode
from .. import config, db
from ..services import pumpfun, goplus
from ..utils import format_usd, esc
from bridge_utils import send_gem_from_pump   # ← BRIDGE

async def scan_pump_fun(bot: Bot):
    coins = await pumpfun.latest_coins(limit=100)
    if not coins: return
    for c in coins:
        mint   = c.get("mint") or c.get("address")
        if not mint: continue
        symbol = c.get("symbol","?")
        name   = c.get("name","")
        mcap   = c.get("usd_market_cap") or c.get("market_cap_usd") or 0
        complete = c.get("complete",False)
        if complete: continue
        if mcap < config.PUMPFUN_MIN_MCAP_USD: continue
        token_id = f"pumpfun_grad:{mint}"
        if db.has_seen(token_id): continue
        db.mark_seen(token_id,"solana",mint,symbol)

        progress = min(100,(mcap/config.PUMPFUN_GRADUATION_MCAP_USD)*100)
        pump_in_pool = progress >= 100

        # ── BRIDGE PATCH ─────────────────────────────────
        send_gem_from_pump(mint, symbol, mcap, progress, pump_in_pool=pump_in_pool)
        # ────────────────────────────────────────────────

        replies  = c.get("reply_count",0)
        twitter  = c.get("twitter")
        telegram_link = c.get("telegram")
        website  = c.get("website")
        creator  = c.get("creator")
        safety   = await goplus.safety_solana(mint)
        verdict, risk_lines = goplus.summarize_solana(safety)
        socials = []
        if twitter:       socials.append(f'<a href="{esc(twitter)}">X</a>')
        if telegram_link: socials.append(f'<a href="{esc(telegram_link)}">TG</a>')
        if website:       socials.append(f'<a href="{esc(website)}">Web</a>')
        socials_line = " • ".join(socials) if socials else "—"
        filled = int(progress/10)
        bar = "█"*filled + "░"*(10-filled)
        msg = (
            f"🐺 <b>DegenScout</b>\n🎓 <b>PUMP.FUN — A PUNTO DE GRADUAR</b> {verdict}\n"
            f"<b>{esc(symbol)}</b> — {esc(name)}\n<code>{esc(mint)}</code>\n\n"
            f"💰 MCap: <b>{esc(format_usd(mcap))}</b>\n"
            f"📈 Progreso: <code>{bar}</code> <b>{progress:.1f}%</b>\n"
            f"🎯 Faltan: <b>{esc(format_usd(max(0,config.PUMPFUN_GRADUATION_MCAP_USD-mcap)))}</b> para Raydium\n"
            f"💬 Replies: <b>{replies}</b>\n🔗 {socials_line}\n"
            + (f"👤 Creator: <code>{esc(creator)}</code>\n" if creator else "")
            + "\n<b>Safety:</b>\n" + "\n".join(f"• {esc(r)}" for r in risk_lines[:6]) + "\n\n"
            f'<a href="https://pump.fun/{esc(mint)}">Pump.fun</a> • '
            f'<a href="https://dexscreener.com/solana/{esc(mint)}">Dexscreener</a>'
        )
        try:
            await bot.send_message(chat_id=config.ALERT_CHANNEL_ID, text=msg,
                                   parse_mode=ParseMode.HTML, disable_web_page_preview=True)
        except Exception as e:
            logger.warning(f"send pumpfun alert failed: {e}")
