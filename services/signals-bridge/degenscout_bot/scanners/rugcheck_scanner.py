"""
DegenScout — rugcheck_scanner.py + BRIDGE PATCH
"""
from loguru import logger
from telegram import Bot
from telegram.constants import ParseMode
from .. import config, db
from ..services import rugcheck, dexscreener
from ..utils import esc, format_usd, dexscreener_url
from ..utils.scorer import hold_score, score_label
from bridge_utils import send_gem_from_rugcheck   # ← BRIDGE

MIN_SCORE = 55

async def scan_rugcheck_new(bot: Bot):
    try: tokens = await rugcheck.new_tokens()
    except Exception as e: logger.debug(f"[rc_new] error: {e}"); return

    for t in tokens[:20]:
        mint   = t.get("mint","")
        symbol = t.get("symbol","") or mint[:8]
        if not mint: continue
        token_id = f"rc_new:{mint}"
        if db.has_seen(token_id): continue
        verdict, risk_lines = await rugcheck.full_check(mint)
        if "🔴" in verdict:
            db.mark_seen(token_id,"solana",mint,symbol); continue

        pair_info = await dexscreener.token_info("solana",mint)
        liq    = ((pair_info or {}).get("liquidity") or {}).get("usd") or 0
        price  = (pair_info or {}).get("priceUsd") or "?"
        vol24  = ((pair_info or {}).get("volume") or {}).get("h24") or 0
        pc1h   = ((pair_info or {}).get("priceChange") or {}).get("h1") or 0
        buys1h = (((pair_info or {}).get("txns") or {}).get("h1") or {}).get("buys",0)
        sells1h= (((pair_info or {}).get("txns") or {}).get("h1") or {}).get("sells",0)
        pair_addr = (pair_info or {}).get("pairAddress") or mint

        score, reasons = hold_score(liquidity=liq, volume_24h=vol24,
            price_change_1h=pc1h, buys_1h=buys1h, sells_1h=sells1h, safety_verdict=verdict)

        if score < MIN_SCORE and liq < 5000:
            db.mark_seen(token_id,"solana",mint,symbol); continue

        db.mark_seen(token_id,"solana",mint,symbol)

        # ── BRIDGE PATCH ─────────────────────────────────
        # Extraer risk_score de rugcheck
        _, _, risk_score = rugcheck.summarize(await rugcheck.check_token(mint) or {})
        send_gem_from_rugcheck(mint, symbol, verdict, risk_score, liq_usd=liq, vol_usd=vol24, source="rug")
        # ────────────────────────────────────────────────

        label       = score_label(score)
        risk_text   = "\n".join(f"• {esc(r)}" for r in risk_lines[:5]) or "• Sin riesgos detectados"
        reasons_text= "\n".join(f"  • {esc(r)}" for r in reasons[:4])
        mint_auth   = t.get("mintAuthority","")
        freeze_auth = t.get("freezeAuthority","")
        flags = []
        if mint_auth:   flags.append("⚠️ Mint authority activa")
        if freeze_auth: flags.append("⚠️ Freeze authority activa")
        flags_text = "\n".join(flags) if flags else "✅ Sin authorities peligrosas"

        msg = (
            f"🐺 <b>DegenScout</b>\n🆕 <b>NEW TOKEN SOLANA</b> {verdict}\n"
            f"<b>{esc(symbol)}</b>\n<code>{esc(mint)}</code>\n\n"
            f"🏆 Hold Score: <b>{score}/100</b> — {esc(label)}\n\n"
            f"💵 Precio: <b>${esc(str(price)[:12])}</b>\n"
            f"💧 LP: <b>{esc(format_usd(liq))}</b>\n"
            f"📊 Vol 24h: <b>{esc(format_usd(vol24))}</b>\n"
            f"📈 Δ 1h: <b>{pc1h:+.1f}%</b>\n"
            f"🔁 Buys/Sells 1h: <b>{buys1h}/{sells1h}</b>\n\n"
            f"{flags_text}\n\n"
            f"<b>Safety (RugCheck):</b>\n{risk_text}\n\n"
            f"<b>Score:</b>\n{reasons_text}\n\n"
            f'<a href="https://rugcheck.xyz/tokens/{esc(mint)}">RugCheck</a> · '
            f'<a href="{dexscreener_url("solana",pair_addr)}">Dexscreener</a>'
        )
        try:
            await bot.send_message(chat_id=config.ALERT_CHANNEL_ID, text=msg,
                                   parse_mode=ParseMode.HTML, disable_web_page_preview=True)
            logger.info(f"[rc_new] {symbol} ({mint})")
        except Exception as e: logger.warning(f"[rc_new] send failed: {e}")


async def scan_rugcheck_trending(bot: Bot):
    try: tokens = await rugcheck.trending_tokens()
    except Exception as e: logger.debug(f"[rc_trend] error: {e}"); return

    for t in tokens[:10]:
        mint   = t.get("mint","")
        symbol = t.get("symbol","") or mint[:8]
        votes  = t.get("vote_count",0)
        if not mint: continue
        token_id = f"rc_trend:{mint}"
        if db.has_seen(token_id): continue
        verdict, risk_lines = await rugcheck.full_check(mint)
        if "🔴" in verdict:
            db.mark_seen(token_id,"solana",mint,symbol); continue
        db.mark_seen(token_id,"solana",mint,symbol)

        pair_info = await dexscreener.token_info("solana",mint)
        liq  = ((pair_info or {}).get("liquidity") or {}).get("usd") or 0
        price= (pair_info or {}).get("priceUsd") or "?"
        pc1h = ((pair_info or {}).get("priceChange") or {}).get("h1") or 0
        pair_addr = (pair_info or {}).get("pairAddress") or mint

        # ── BRIDGE PATCH ─────────────────────────────────
        _, _, risk_score = rugcheck.summarize(await rugcheck.check_token(mint) or {})
        send_gem_from_rugcheck(mint, symbol, verdict, risk_score, liq_usd=liq, source="rug")
        # ────────────────────────────────────────────────

        risk_text = "\n".join(f"• {esc(r)}" for r in risk_lines[:5]) or "• Sin riesgos detectados"
        msg = (
            f"🐺 <b>DegenScout</b>\n🔥 <b>TRENDING RUGCHECK</b> {verdict} <code>SOLANA</code>\n"
            f"<b>{esc(symbol)}</b>\n<code>{esc(mint)}</code>\n\n"
            f"👍 Votos comunidad: <b>{votes}</b>\n\n"
            f"💵 Precio: <b>${esc(str(price)[:12])}</b>\n"
            f"💧 LP: <b>{esc(format_usd(liq))}</b>\n"
            f"📈 Δ 1h: <b>{pc1h:+.1f}%</b>\n\n"
            f"<b>Safety (RugCheck):</b>\n{risk_text}\n\n"
            f'<a href="https://rugcheck.xyz/tokens/{esc(mint)}">RugCheck</a> · '
            f'<a href="{dexscreener_url("solana",pair_addr)}">Dexscreener</a>'
        )
        try:
            await bot.send_message(chat_id=config.ALERT_CHANNEL_ID, text=msg,
                                   parse_mode=ParseMode.HTML, disable_web_page_preview=True)
            logger.info(f"[rc_trend] {symbol} votos={votes}")
        except Exception as e: logger.warning(f"[rc_trend] send failed: {e}")
