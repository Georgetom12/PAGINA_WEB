"""
Motor de señales automáticas.
- Loop 1: BTC/ETH/SOL → CHANNEL_ID (canal principal)
- Loop 2: Altcoins Tier 1-4 → ALTCOINS_CHANNEL_ID (canal altcoins)
"""
import asyncio
import logging
from datetime import datetime, timedelta

from aiogram import Bot

from config import (
    CHANNEL_ID,
    ALTCOINS_CHANNEL_ID,
    DEFAULT_SYMBOLS,
    SIGNAL_INTERVAL,
    ALTCOIN_SIGNAL_INTERVAL,
    TIER1_SYMBOLS,
    TIER2_SYMBOLS,
    TIER3_SYMBOLS,
    TIER4_SYMBOLS,
    TIER_CONFIG,
)
from db.database import SessionLocal
from db.models import Signal
from signals.indicators import full_analysis

log = logging.getLogger(__name__)

# Cooldown independiente por símbolo+timeframe
_last_signal_main: dict[str, datetime] = {}
_last_signal_alt:  dict[str, datetime] = {}
COOLDOWN_HOURS_MAIN = 2


# ─── Formateador canal principal (BTC/ETH/SOL) ────────────────────────────────
def format_signal_message(data: dict) -> str:
    sr      = data["sr"]
    macro   = data["macro"]
    oi_str  = f"{data['oi_change']:+.2f}%" if data["oi_change"] is not None else "N/D"
    cross_str = {
        "golden_cross": "✨ Golden Cross (alcista)",
        "death_cross":  "💀 Death Cross (bajista)",
        None: "—",
    }.get(data["ema_cross"], "—")

    return (
        f"📡 *SEÑAL AUTOMÁTICA — {data['symbol']}*\n"
        f"{'─'*32}\n"
        f"*{data['signal']}*  |  Score: `{data['score']:+d}`\n"
        f"{'─'*32}\n"
        f"💵 Precio: `{data['close']:,.4f}` USDT\n"
        f"📊 Temporalidad: `{data['timeframe']}`\n\n"
        f"🔢 *Indicadores*\n"
        f"• RSI(14): `{data['rsi']}` {'🔴 Sobrecompra' if data['rsi']>70 else '🟢 Sobreventa' if data['rsi']<30 else '⚪'}\n"
        f"• EMA 9/21/50/200: `{data['emas'][9]:.2f}` / `{data['emas'][21]:.2f}` / `{data['emas'][50]:.2f}` / `{data['emas'][200]:.2f}`\n"
        f"• Cruce EMA: {cross_str}\n"
        f"• CVD: `{data['cvd']:+,.0f}` {'🟢 Positivo' if data['cvd']>0 else '🔴 Negativo'}\n"
        f"• Volumen: `{data['vol_ratio']:.2f}x` promedio {'🔥 Alto' if data['vol_ratio']>1.5 else ''}\n"
        f"• Open Interest: `{oi_str}` {'📈' if data['oi_change'] and data['oi_change']>5 else '📉' if data['oi_change'] and data['oi_change']<-5 else ''}\n\n"
        f"📐 *Niveles Clave*\n"
        f"• Resistencia: `{sr['resistance']:,.4f}` ({sr['dist_resistance_pct']}% arriba)\n"
        f"• Soporte: `{sr['support']:,.4f}` ({sr['dist_support_pct']}% abajo)\n\n"
        f"🌐 *Ciclo Macro BTC*\n"
        f"• {macro['phase']}\n"
        f"• {macro['pct_cycle']}% del ciclo de 4 años\n"
        f"• Último halving: `{macro['last_halving']}`\n"
        f"• Próximo halving: `{macro['next_halving']}`\n\n"
        f"{'─'*32}\n"
        f"⏰ `{datetime.utcnow().strftime('%d/%m/%Y %H:%M')} UTC`\n"
        f"⚠️ _Señal informativa. No es asesoría financiera._"
    )


# ─── Formateador canal altcoins (Tier 1-4) ────────────────────────────────────
def format_altcoin_message(data: dict, tier: int) -> str:
    sr       = data["sr"]
    oi_str   = f"{data['oi_change']:+.2f}%" if data["oi_change"] is not None else "N/D"
    tier_cfg = TIER_CONFIG[tier]
    cross_str = {
        "golden_cross": "✨ Golden Cross",
        "death_cross":  "💀 Death Cross",
        None: "—",
    }.get(data["ema_cross"], "—")

    tier_emojis = {1: "🔵", 2: "🟣", 3: "🐸", 4: "⚡"}
    emoji = tier_emojis.get(tier, "📡")

    return (
        f"{emoji} *{tier_cfg['name']}*\n"
        f"📡 *SEÑAL — {data['symbol']}*\n"
        f"{'─'*30}\n"
        f"*{data['signal']}*  |  Score: `{data['score']:+d}`\n"
        f"{'─'*30}\n"
        f"💵 Precio: `{data['close']:,.6f}` USDT\n"
        f"📊 Temporalidad: `{data['timeframe']}`\n\n"
        f"🔢 *Indicadores*\n"
        f"• RSI(14): `{data['rsi']}` {'🔴 Sobrecompra' if data['rsi']>70 else '🟢 Sobreventa' if data['rsi']<30 else '⚪'}\n"
        f"• EMA 9/21: `{data['emas'][9]:.4f}` / `{data['emas'][21]:.4f}`\n"
        f"• EMA 50/200: `{data['emas'][50]:.4f}` / `{data['emas'][200]:.4f}`\n"
        f"• Cruce EMA: {cross_str}\n"
        f"• CVD: `{data['cvd']:+,.0f}` {'🟢' if data['cvd']>0 else '🔴'}\n"
        f"• Volumen: `{data['vol_ratio']:.2f}x` {'🔥' if data['vol_ratio']>1.5 else ''}\n"
        f"• Open Interest: `{oi_str}` {'📈' if data['oi_change'] and data['oi_change']>5 else '📉' if data['oi_change'] and data['oi_change']<-5 else ''}\n\n"
        f"📐 *Niveles Clave*\n"
        f"• Resistencia: `{sr['resistance']:,.6f}` ({sr['dist_resistance_pct']}% arriba)\n"
        f"• Soporte: `{sr['support']:,.6f}` ({sr['dist_support_pct']}% abajo)\n\n"
        f"{'─'*30}\n"
        f"⏰ `{datetime.utcnow().strftime('%d/%m/%Y %H:%M')} UTC`\n"
        f"⚠️ _Señal informativa. No es asesoría financiera._"
    )


# ─── Canal principal: BTC / ETH / SOL ─────────────────────────────────────────
async def analyze_and_broadcast(bot: Bot, symbol: str, timeframe: str = "4h"):
    key  = f"{symbol}_{timeframe}"
    last = _last_signal_main.get(key)
    if last and datetime.utcnow() - last < timedelta(hours=COOLDOWN_HOURS_MAIN):
        return

    try:
        data = await full_analysis(symbol, timeframe)
    except Exception as e:
        log.warning(f"Error analizando {symbol}: {e}")
        return

    if "NEUTRAL" in data["signal"]:
        log.info(f"{symbol} {timeframe} → Neutral, sin señal.")
        return

    msg = format_signal_message(data)

    try:
        await bot.send_message(CHANNEL_ID, msg, parse_mode="Markdown")
        _last_signal_main[key] = datetime.utcnow()
        _save_signal(symbol, data["signal"], timeframe, msg, source="auto")
        log.info(f"✅ [PRINCIPAL] {symbol} {timeframe} → {data['signal']}")
    except Exception as e:
        log.error(f"Error enviando señal al canal principal: {e}")


# ─── Canal altcoins: Tier 1-4 ─────────────────────────────────────────────────
async def analyze_and_broadcast_altcoin(bot: Bot, symbol: str, timeframe: str, tier: int):
    key         = f"{symbol}_{timeframe}"
    cooldown_h  = TIER_CONFIG[tier]["cooldown"]
    last        = _last_signal_alt.get(key)
    if last and datetime.utcnow() - last < timedelta(hours=cooldown_h):
        return

    # Si no hay canal configurado, skip
    if not ALTCOINS_CHANNEL_ID:
        log.warning("ALTCOINS_CHANNEL_ID no configurado, saltando altcoins.")
        return

    try:
        data = await full_analysis(symbol, timeframe)
    except Exception as e:
        log.warning(f"Error analizando altcoin {symbol}: {e}")
        return

    if "NEUTRAL" in data["signal"]:
        log.info(f"[T{tier}] {symbol} {timeframe} → Neutral, sin señal.")
        return

    msg = format_altcoin_message(data, tier)

    try:
        await bot.send_message(ALTCOINS_CHANNEL_ID, msg, parse_mode="Markdown")
        _last_signal_alt[key] = datetime.utcnow()
        _save_signal(symbol, data["signal"], timeframe, msg, source=f"auto_tier{tier}")
        log.info(f"✅ [TIER {tier}] {symbol} {timeframe} → {data['signal']}")
    except Exception as e:
        log.error(f"Error enviando señal altcoin {symbol}: {e}")


# ─── Guardar en DB ─────────────────────────────────────────────────────────────
def _save_signal(symbol: str, signal_type: str, timeframe: str, content: str, source: str):
    db = SessionLocal()
    try:
        sig = Signal(
            symbol      = symbol,
            signal_type = signal_type,
            timeframe   = timeframe,
            content     = content,
            source      = source,
        )
        db.add(sig)
        db.commit()
    except Exception as e:
        log.error(f"Error guardando señal en DB: {e}")
    finally:
        db.close()


# ─── Loop canal principal ──────────────────────────────────────────────────────
async def signal_loop(bot: Bot):
    timeframes = ["4h", "1d"]
    log.info("🚀 [PRINCIPAL] Motor de señales BTC/ETH/SOL iniciado.")

    while True:
        for symbol in DEFAULT_SYMBOLS:
            for tf in timeframes:
                await analyze_and_broadcast(bot, symbol, tf)
                await asyncio.sleep(2)

        log.info(f"⏳ [PRINCIPAL] Próximo análisis en {SIGNAL_INTERVAL}s")
        await asyncio.sleep(SIGNAL_INTERVAL)


# ─── Loop canal altcoins (Tier 1-4) ───────────────────────────────────────────
async def altcoin_signal_loop(bot: Bot):
    log.info("🚀 [ALTCOINS] Motor de señales Tier 1-4 iniciado.")

    tiers = [
        (1, TIER1_SYMBOLS),
        (2, TIER2_SYMBOLS),
        (3, TIER3_SYMBOLS),
        (4, TIER4_SYMBOLS),
    ]

    while True:
        for tier_num, symbols in tiers:
            timeframes = TIER_CONFIG[tier_num]["timeframes"]
            for symbol in symbols:
                for tf in timeframes:
                    await analyze_and_broadcast_altcoin(bot, symbol, tf, tier_num)
                    await asyncio.sleep(3)  # pausa mayor para 52 coins

        log.info(f"⏳ [ALTCOINS] Próximo análisis en {ALTCOIN_SIGNAL_INTERVAL}s")
        await asyncio.sleep(ALTCOIN_SIGNAL_INTERVAL)
