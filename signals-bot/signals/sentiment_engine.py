"""
PSY Sentiment Engine — PSYCHOMETRIKS
Análisis de percepción del mercado con 5 fuentes de datos.

Fuentes (100% gratuitas, sin API key, sin bloqueo geográfico):
  1. Fear & Greed Index        → alternative.me
  2. Funding Rate              → Bybit API v5 pública (linear perpetual)
  3. Long/Short Ratio          → Bybit API v5 pública (account-ratio)
  4. Taker Buy/Sell Ratio      → OKX API v5 pública (rubik/stat/taker-volume)
  5. Top Trader L/S Ratio      → OKX API v5 pública (rubik/stat top-trader, contratos)

Nota de migración (PSYCHOMETRIKS, 2026): este módulo usaba originalmente
fapi.binance.com para las 4 fuentes de futuros. Se migró a Bybit + OKX porque
Binance bloquea por geo-IP en varias regiones (incluyendo partes de LATAM) y
PSYCHOMETRIKS prioriza Bybit/OKX/CoinGecko como fuentes primarias.

Lógica: CONTRARIAN
  - Fear Extremo  → oportunidad de compra
  - Greed Extremo → señal de precaución / venta
  - Funding muy negativo (shorts pagando) → rebote cercano
  - Demasiados Shorts → squeeze inminente
"""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Optional

import aiohttp
import numpy as np

log = logging.getLogger(__name__)

TIMEOUT = aiohttp.ClientTimeout(total=10)

BYBIT_BASE = "https://api.bybit.com"
OKX_BASE = "https://www.okx.com"


@dataclass
class SentimentLayer:
    name: str  = ""
    value: Optional[float] = None
    label: str = "N/D"
    signal: str = "NEUTRAL"
    score: int  = 0
    emoji: str  = "⚪"
    description: str = ""


@dataclass
class SentimentResult:
    fear_greed: SentimentLayer    = field(default_factory=SentimentLayer)
    funding:    SentimentLayer    = field(default_factory=SentimentLayer)
    long_short: SentimentLayer    = field(default_factory=SentimentLayer)
    taker_ratio: SentimentLayer   = field(default_factory=SentimentLayer)
    top_traders: SentimentLayer   = field(default_factory=SentimentLayer)
    sentiment_score: int          = 0
    market_mood: str              = ""
    mood_emoji: str               = "😐"
    contrarian_signal: str        = ""
    summary_lines: list[str]      = field(default_factory=list)


def _okx_inst_id(symbol: str) -> str:
    base = symbol.upper().replace("USDT", "").replace("USD", "")
    return f"{base}-USDT-SWAP"


def _okx_ccy(symbol: str) -> str:
    return symbol.upper().replace("USDT", "").replace("USD", "")


async def _fetch_fear_greed() -> SentimentLayer:
    layer = SentimentLayer(name="Fear & Greed")
    try:
        async with aiohttp.ClientSession(timeout=TIMEOUT) as s:
            async with s.get("https://api.alternative.me/fng/?limit=2") as r:
                if r.status != 200:
                    return layer
                data = await r.json()
                now  = int(data["data"][0]["value"])
                prev = int(data["data"][1]["value"]) if len(data["data"]) > 1 else now
                label = data["data"][0]["value_classification"]
                delta = now - prev

                layer.value = now
                layer.label = label

                if now <= 15:
                    layer.signal = "STRONG_BULL"; layer.score = 2; layer.emoji = "😱"
                    layer.description = f"Fear & Greed: {now}/100 — {label} (contrarian: oportunidad de acumulación)"
                elif now <= 30:
                    layer.signal = "BULL"; layer.score = 1; layer.emoji = "😨"
                    layer.description = f"Fear & Greed: {now}/100 — {label}"
                elif now <= 60:
                    layer.signal = "NEUTRAL"; layer.score = 0; layer.emoji = "😐"
                    layer.description = f"Fear & Greed: {now}/100 — {label}"
                elif now <= 80:
                    layer.signal = "BEAR"; layer.score = -1; layer.emoji = "😏"
                    layer.description = f"Fear & Greed: {now}/100 — {label} (precaución)"
                else:
                    layer.signal = "STRONG_BEAR"; layer.score = -2; layer.emoji = "🤑"
                    layer.description = f"Fear & Greed: {now}/100 — {label} (contrarian: distribución posible)"

                trend = f" (↑{delta:+d} vs ayer)" if delta != 0 else ""
                layer.description += trend
    except Exception as e:
        log.debug(f"Fear & Greed error: {e}")
    return layer


async def _fetch_funding(symbol: str) -> SentimentLayer:
    layer = SentimentLayer(name="Funding Rate")
    try:
        url = f"{BYBIT_BASE}/v5/market/funding/history"
        params = {"category": "linear", "symbol": symbol, "limit": 3}
        async with aiohttp.ClientSession(timeout=TIMEOUT) as s:
            async with s.get(url, params=params) as r:
                if r.status != 200:
                    return layer
                payload = await r.json()
                data = (payload.get("result") or {}).get("list") or []
                if not data:
                    return layer
                rate = float(data[0]["fundingRate"]) * 100

                layer.value = round(rate, 5)
                layer.label = f"{rate:+.4f}%"

                if rate < -0.05:
                    layer.signal = "STRONG_BULL"; layer.score = 2; layer.emoji = "🔥"
                    layer.description = f"Funding: {rate:+.4f}% — Shorts pagando muy alto (squeeze alcista inminente)"
                elif rate < -0.01:
                    layer.signal = "BULL"; layer.score = 1; layer.emoji = "📈"
                    layer.description = f"Funding: {rate:+.4f}% — Ligera presión bajista en futuros"
                elif rate > 0.08:
                    layer.signal = "STRONG_BEAR"; layer.score = -2; layer.emoji = "💸"
                    layer.description = f"Funding: {rate:+.4f}% — Longs pagando en exceso (sobrecalentado)"
                elif rate > 0.03:
                    layer.signal = "BEAR"; layer.score = -1; layer.emoji = "📉"
                    layer.description = f"Funding: {rate:+.4f}% — Mercado sesgado hacia longs"
                else:
                    layer.signal = "NEUTRAL"; layer.score = 0; layer.emoji = "➡️"
                    layer.description = f"Funding: {rate:+.4f}% — Equilibrado"
    except Exception as e:
        log.debug(f"Funding error (Bybit): {e}")
    return layer


async def _fetch_long_short(symbol: str) -> SentimentLayer:
    layer = SentimentLayer(name="Long/Short Ratio")
    try:
        url = f"{BYBIT_BASE}/v5/market/account-ratio"
        params = {"category": "linear", "symbol": symbol, "period": "1h", "limit": 3}
        async with aiohttp.ClientSession(timeout=TIMEOUT) as s:
            async with s.get(url, params=params) as r:
                if r.status != 200:
                    return layer
                payload = await r.json()
                data = (payload.get("result") or {}).get("list") or []
                if not data:
                    return layer
                latest = data[0]
                buy_ratio  = float(latest["buyRatio"])
                sell_ratio = float(latest["sellRatio"])
                ratio = buy_ratio / sell_ratio if sell_ratio > 0 else 1.0

                layer.value = round(ratio, 3)
                layer.label = f"{ratio:.2f}"

                if ratio < 0.6:
                    layer.signal = "STRONG_BULL"; layer.score = 2; layer.emoji = "🐂"
                    layer.description = f"L/S Ratio: {ratio:.2f} — Demasiados shorts → squeeze probable"
                elif ratio < 0.85:
                    layer.signal = "BULL"; layer.score = 1; layer.emoji = "📊"
                    layer.description = f"L/S Ratio: {ratio:.2f} — Ligero sesgo bajista retail"
                elif ratio > 2.0:
                    layer.signal = "STRONG_BEAR"; layer.score = -2; layer.emoji = "🐻"
                    layer.description = f"L/S Ratio: {ratio:.2f} — Mercado apalancado en longs (corrección pendiente)"
                elif ratio > 1.5:
                    layer.signal = "BEAR"; layer.score = -1; layer.emoji = "⚠️"
                    layer.description = f"L/S Ratio: {ratio:.2f} — Longs dominantes, precaución"
                else:
                    layer.signal = "NEUTRAL"; layer.score = 0; layer.emoji = "⚖️"
                    layer.description = f"L/S Ratio: {ratio:.2f} — Equilibrado"
    except Exception as e:
        log.debug(f"L/S ratio error (Bybit): {e}")
    return layer


async def _fetch_taker_ratio(symbol: str) -> SentimentLayer:
    layer = SentimentLayer(name="Taker Buy/Sell")
    try:
        ccy = _okx_ccy(symbol)
        url = f"{OKX_BASE}/api/v5/rubik/stat/taker-volume"
        params = {"ccy": ccy, "instType": "CONTRACTS", "period": "1H"}
        async with aiohttp.ClientSession(timeout=TIMEOUT) as s:
            async with s.get(url, params=params) as r:
                if r.status != 200:
                    return layer
                payload = await r.json()
                rows = payload.get("data") or []
                if not rows:
                    return layer
                recent = rows[:5]
                ratios = []
                for row in recent:
                    sell_vol = float(row[1])
                    buy_vol  = float(row[2])
                    if sell_vol > 0:
                        ratios.append(buy_vol / sell_vol)
                ratio = float(np.mean(ratios)) if ratios else 1.0

                layer.value = round(ratio, 3)
                layer.label = f"{ratio:.3f}"

                if ratio > 1.3:
                    layer.signal = "BULL"; layer.score = 1; layer.emoji = "🟢"
                    layer.description = f"Taker Buy/Sell: {ratio:.3f} — Más compradores agresivos que vendedores"
                elif ratio < 0.75:
                    layer.signal = "BEAR"; layer.score = -1; layer.emoji = "🔴"
                    layer.description = f"Taker Buy/Sell: {ratio:.3f} — Vendedores agresivos dominan"
                else:
                    layer.signal = "NEUTRAL"; layer.score = 0; layer.emoji = "⚪"
                    layer.description = f"Taker Buy/Sell: {ratio:.3f} — Equilibrado"
    except Exception as e:
        log.debug(f"Taker ratio error (OKX): {e}")
    return layer


async def _fetch_top_traders(symbol: str) -> SentimentLayer:
    layer = SentimentLayer(name="Top Traders (inst.)")
    try:
        inst_id = _okx_inst_id(symbol)
        url = f"{OKX_BASE}/api/v5/rubik/stat/contracts/long-short-account-ratio-contract-top-trader"
        params = {"instId": inst_id, "period": "1H"}
        async with aiohttp.ClientSession(timeout=TIMEOUT) as s:
            async with s.get(url, params=params) as r:
                if r.status != 200:
                    return layer
                payload = await r.json()
                rows = payload.get("data") or []
                if not rows:
                    return layer
                ratio = float(rows[0][1])
                long_pct  = ratio / (1 + ratio) * 100
                short_pct = 100 - long_pct

                layer.value = round(ratio, 3)
                layer.label = f"L:{long_pct:.1f}% / S:{short_pct:.1f}%"

                if ratio > 1.5:
                    layer.signal = "BULL"; layer.score = 1; layer.emoji = "🏛️"
                    layer.description = f"Top Traders: {long_pct:.1f}% largos — Smart money alcista"
                elif ratio < 0.7:
                    layer.signal = "BEAR"; layer.score = -1; layer.emoji = "🏦"
                    layer.description = f"Top Traders: {short_pct:.1f}% cortos — Smart money bajista"
                else:
                    layer.signal = "NEUTRAL"; layer.score = 0; layer.emoji = "🏛️"
                    layer.description = f"Top Traders: {long_pct:.1f}% L / {short_pct:.1f}% S — Sin sesgo claro"
    except Exception as e:
        log.debug(f"Top traders error (OKX): {e}")
    return layer


def _classify_mood(fg_value: Optional[float], total_score: int) -> tuple[str, str, str]:
    if fg_value is not None:
        if fg_value <= 15:   return "EXTREME FEAR", "😱", "⚡ Contrarian alcista: el mercado está en pánico máximo, históricamente zona de acumulación institucional"
        elif fg_value <= 30: return "FEAR", "😨", "📊 Mercado en miedo — oportunidad progresiva de acumulación"
        elif fg_value <= 55: return "NEUTRAL", "😐", "➡️ Sentimiento neutro — esperar confirmación técnica"
        elif fg_value <= 75: return "GREED", "😏", "⚠️ Avaricia creciente — reducir tamaño de posiciones"
        else:                return "EXTREME GREED", "🤑", "🔴 Euforia extrema — históricamente zona de distribución"
    if total_score >= 4:   return "FEAR", "😨", "Sesgo contrarian alcista"
    elif total_score <= -4: return "GREED", "😏", "Sesgo contrarian bajista"
    return "NEUTRAL", "😐", "Sentimiento equilibrado"


async def run_sentiment_analysis(symbol: str = "BTCUSDT") -> SentimentResult:
    result = SentimentResult()
    sym    = symbol.upper()
    if not sym.endswith("USDT"):
        sym += "USDT"

    fg, fund, ls, taker, top = await asyncio.gather(
        _fetch_fear_greed(),
        _fetch_funding(sym),
        _fetch_long_short(sym),
        _fetch_taker_ratio(sym),
        _fetch_top_traders(sym),
        return_exceptions=True,
    )

    result.fear_greed  = fg    if isinstance(fg, SentimentLayer)    else SentimentLayer(name="Fear & Greed")
    result.funding     = fund  if isinstance(fund, SentimentLayer)  else SentimentLayer(name="Funding Rate")
    result.long_short  = ls    if isinstance(ls, SentimentLayer)    else SentimentLayer(name="Long/Short")
    result.taker_ratio = taker if isinstance(taker, SentimentLayer) else SentimentLayer(name="Taker Buy/Sell")
    result.top_traders = top   if isinstance(top, SentimentLayer)   else SentimentLayer(name="Top Traders")

    result.sentiment_score = (
        round(result.fear_greed.score * 1.5) +
        result.funding.score +
        result.long_short.score +
        result.taker_ratio.score +
        result.top_traders.score
    )

    result.market_mood, result.mood_emoji, result.contrarian_signal = _classify_mood(
        result.fear_greed.value, result.sentiment_score
    )

    layers = [result.fear_greed, result.funding, result.long_short,
              result.taker_ratio, result.top_traders]
    result.summary_lines = [
        f"{l.emoji} {l.description}"
        for l in layers if l.description
    ]

    return result
