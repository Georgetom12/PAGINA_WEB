"""
PSY Indicators — PSYCHOMETRIKS
Motor de indicadores técnicos completo.
Usa ccxt con fallback multi-exchange (sin API key).
Prioridad: Bybit → OKX → Bitget → MEXC. Binance se evita como fuente
primaria (bloqueo geográfico en varias regiones); queda solo como último
fallback para no perder cobertura de pares poco comunes.
"""
import asyncio
from datetime import datetime, date
from typing import Optional

import logging
import ccxt.async_support as ccxt
import numpy as np
import pandas as pd

from config import HALVING_DATES
from signals.sentiment_engine import run_sentiment_analysis

log = logging.getLogger(__name__)


# ── Multi-Exchange con fallback automático ────────────────
SPOT_EXCHANGES    = ["bybit", "okx", "bitget", "mexc", "binance"]
FUTURES_EXCHANGES = ["bybit", "okx", "bitget", "binance"]

def get_exchange(name: str = "bybit", futures: bool = False):
    opts = {"enableRateLimit": True}
    if futures:
        opts["options"] = {"defaultType": "future" if name != "bybit" else "linear"}
    return getattr(ccxt, name)(opts)


# ── OHLCV con fallback ────────────────────────────────────
async def fetch_ohlcv(symbol: str, timeframe: str = "4h", limit: int = 600) -> pd.DataFrame:
    last_error = None
    for name in SPOT_EXCHANGES:
        exchange = get_exchange(name)
        try:
            raw = await exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
            await exchange.close()
            if raw and len(raw) > 10:
                log.info(f"OHLCV {symbol} via {name} OK")
                df = pd.DataFrame(raw, columns=["timestamp", "open", "high", "low", "close", "volume"])
                df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
                return df.set_index("timestamp").astype(float)
        except Exception as e:
            last_error = e
            log.debug(f"OHLCV {symbol} via {name} fallo: {str(e)[:60]}")
            try:
                await exchange.close()
            except Exception:
                pass
            continue
    raise Exception(f"Todos los exchanges fallaron para {symbol}: {last_error}")


# ── RSI ───────────────────────────────────────────────────
def calc_rsi(series: pd.Series, period: int = 14) -> float:
    delta = series.diff().dropna()
    gain  = delta.clip(lower=0)
    loss  = (-delta).clip(lower=0)
    avg_g = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_l = loss.ewm(com=period - 1, min_periods=period).mean()
    rs    = avg_g / avg_l.replace(0, np.inf)
    return float((100 - 100 / (1 + rs)).iloc[-1])


# ── MACD ──────────────────────────────────────────────────
def calc_macd(close: pd.Series) -> dict:
    ema12   = close.ewm(span=12, adjust=False).mean()
    ema26   = close.ewm(span=26, adjust=False).mean()
    macd    = ema12 - ema26
    signal  = macd.ewm(span=9, adjust=False).mean()
    hist    = macd - signal
    return {
        "macd":      round(float(macd.iloc[-1]), 4),
        "signal":    round(float(signal.iloc[-1]), 4),
        "histogram": round(float(hist.iloc[-1]), 4),
        "cross":     "bullish" if hist.iloc[-1] > 0 and hist.iloc[-2] <= 0
                     else "bearish" if hist.iloc[-1] < 0 and hist.iloc[-2] >= 0
                     else "none",
    }


# ── Bollinger Bands ───────────────────────────────────────
def calc_bollinger(close: pd.Series, period: int = 20, std: float = 2.0) -> dict:
    sma   = close.rolling(period).mean()
    dev   = close.rolling(period).std()
    upper = sma + std * dev
    lower = sma - std * dev
    price = float(close.iloc[-1])
    u, m, l = float(upper.iloc[-1]), float(sma.iloc[-1]), float(lower.iloc[-1])
    width = (u - l) / m * 100 if m else 0
    pct_b = (price - l) / (u - l) if (u - l) else 0.5
    return {
        "upper":   round(u, 4),
        "middle":  round(m, 4),
        "lower":   round(l, 4),
        "width":   round(width, 2),
        "pct_b":   round(pct_b, 3),
        "squeeze": width < 3.0,
    }


# ── EMA ───────────────────────────────────────────────────
def calc_emas(df: pd.DataFrame) -> dict:
    c = df["close"]
    return {k: round(float(c.ewm(span=k, adjust=False).mean().iloc[-1]), 4)
            for k in [9, 21, 50, 200]}


def ema_cross(df: pd.DataFrame, fast: int = 9, slow: int = 21) -> Optional[str]:
    c   = df["close"]
    f   = c.ewm(span=fast, adjust=False).mean()
    s   = c.ewm(span=slow, adjust=False).mean()
    now = f.iloc[-1] - s.iloc[-1]
    prv = f.iloc[-2] - s.iloc[-2]
    if prv < 0 and now > 0: return "golden_cross"
    if prv > 0 and now < 0: return "death_cross"
    return None


# ── CVD ───────────────────────────────────────────────────
def calc_cvd(df: pd.DataFrame, bars: int = 20) -> dict:
    tail = df.tail(bars).copy()
    tail["delta"] = tail.apply(
        lambda r: r["volume"] if r["close"] >= r["open"] else -r["volume"], axis=1
    )
    cvd_series = tail["delta"].cumsum()
    cvd_now    = float(cvd_series.iloc[-1])
    cvd_prev   = float(cvd_series.iloc[-3]) if len(cvd_series) >= 3 else cvd_now
    return {
        "value":   round(cvd_now, 2),
        "trend":   "bullish" if cvd_now > 0 else "bearish",
        "momentum": "accelerating" if abs(cvd_now) > abs(cvd_prev) else "decelerating",
    }


# ── Volumen ───────────────────────────────────────────────
def calc_volume(df: pd.DataFrame, period: int = 20) -> dict:
    avg = float(df["volume"].rolling(period).mean().iloc[-1])
    cur = float(df["volume"].iloc[-1])
    ratio = cur / avg if avg else 1.0
    # VWAP últimas 20 velas
    tail = df.tail(period)
    typical = (tail["high"] + tail["low"] + tail["close"]) / 3
    vwap = float((typical * tail["volume"]).sum() / tail["volume"].sum()) if tail["volume"].sum() else 0
    return {
        "ratio":  round(ratio, 2),
        "vwap":   round(vwap, 4),
        "above_vwap": float(df["close"].iloc[-1]) > vwap,
    }


# ── Open Interest ─────────────────────────────────────────
async def fetch_open_interest(symbol: str) -> dict:
    try:
        exchange = get_exchange("bybit", futures=True)
        try:
            history = await exchange.fetch_open_interest_history(symbol, "1h", limit=25)
        finally:
            await exchange.close()
        if history and len(history) >= 2:
            oi_new   = history[-1]["openInterestAmount"]
            oi_old   = history[0]["openInterestAmount"]
            oi_4h    = history[-5]["openInterestAmount"] if len(history) >= 5 else oi_old
            change   = ((oi_new - oi_old) / oi_old) * 100 if oi_old else 0
            change4h = ((oi_new - oi_4h) / oi_4h) * 100 if oi_4h else 0
            return {
                "change_pct":    round(change, 2),
                "change_4h_pct": round(change4h, 2),
                "trend": "rising" if change > 2 else "falling" if change < -2 else "flat",
            }
    except Exception:
        pass
    return {"change_pct": None, "change_4h_pct": None, "trend": "unknown"}


# ── Soporte / Resistencia ─────────────────────────────────
def calc_sr(df: pd.DataFrame) -> dict:
    # Pivots de 20 barras
    high20 = float(df["high"].rolling(20).max().iloc[-1])
    low20  = float(df["low"].rolling(20).min().iloc[-1])
    # Pivots de 50 barras
    high50 = float(df["high"].rolling(50).max().iloc[-1])
    low50  = float(df["low"].rolling(50).min().iloc[-1])
    close  = float(df["close"].iloc[-1])
    return {
        "resistance":          round(high20, 4),
        "support":             round(low20, 4),
        "resistance_major":    round(high50, 4),
        "support_major":       round(low50, 4),
        "dist_resistance_pct": round((high20 - close) / close * 100, 2),
        "dist_support_pct":    round((close - low20) / close * 100, 2),
    }


# ── Estructura de mercado (Higher Highs / Lower Lows) ────
def calc_market_structure(df: pd.DataFrame) -> dict:
    highs = df["high"].tail(10).values
    lows  = df["low"].tail(10).values
    hh = sum(1 for i in range(1, len(highs)) if highs[i] > highs[i-1])
    lh = sum(1 for i in range(1, len(highs)) if highs[i] < highs[i-1])
    hl = sum(1 for i in range(1, len(lows))  if lows[i] > lows[i-1])
    ll = sum(1 for i in range(1, len(lows))  if lows[i] < lows[i-1])

    if hh >= 6 and hl >= 5:
        structure = "uptrend"
    elif lh >= 6 and ll >= 5:
        structure = "downtrend"
    else:
        structure = "ranging"

    return {
        "structure": structure,
        "hh": hh, "lh": lh, "hl": hl, "ll": ll,
    }


# ── Ciclo macro BTC ───────────────────────────────────────
def macro_phase() -> dict:
    halvings   = sorted([datetime.strptime(d, "%Y-%m-%d").date() for d in HALVING_DATES])
    today      = date.today()
    last_halv  = max(h for h in halvings if h <= today)
    next_halv  = min((h for h in halvings if h > today), default=None)
    days_since = (today - last_halv).days
    cycle_len  = 1461
    pct        = (days_since / cycle_len) * 100

    if pct < 15:
        phase, bias = "🟡 Acumulación post-halving", "neutral"
    elif pct < 45:
        phase, bias = "🟢 Bull run activo", "bullish"
    elif pct < 65:
        phase, bias = "🔴 Distribución / techo de ciclo", "bearish"
    else:
        phase, bias = "🔵 Bear market / acumulación profunda", "neutral-bearish"

    return {
        "phase":        phase,
        "bias":         bias,
        "days_since":   days_since,
        "pct_cycle":    round(pct, 1),
        "last_halving": str(last_halv),
        "next_halving": str(next_halv) if next_halv else "N/A",
    }


# ── Análisis completo ─────────────────────────────────────
async def full_analysis(symbol: str, timeframe: str = "4h") -> dict:
    df  = await fetch_ohlcv(symbol, timeframe)
    close = df["close"]

    rsi    = calc_rsi(close)
    emas   = calc_emas(df)
    macd   = calc_macd(close)
    bb     = calc_bollinger(close)
    cvd    = calc_cvd(df)
    vol    = calc_volume(df)
    sr     = calc_sr(df)
    cross  = ema_cross(df)
    ms     = calc_market_structure(df)
    oi     = await fetch_open_interest(symbol)
    macro  = macro_phase()
    sentiment = await run_sentiment_analysis(symbol)

    price = float(close.iloc[-1])

    # ── Score técnico compuesto ──────────────────────────
    score = 0

    # RSI
    if rsi < 25:    score += 3
    elif rsi < 35:  score += 2
    elif rsi < 45:  score += 1
    elif rsi > 80:  score -= 3
    elif rsi > 70:  score -= 2
    elif rsi > 60:  score -= 1

    # EMA alignment
    if emas[9] > emas[21] > emas[50]: score += 2
    elif emas[9] > emas[21]:          score += 1
    elif emas[9] < emas[21] < emas[50]: score -= 2
    elif emas[9] < emas[21]:            score -= 1

    # EMA cross
    if cross == "golden_cross":  score += 2
    elif cross == "death_cross": score -= 2

    # MACD
    if macd["cross"] == "bullish": score += 2
    elif macd["cross"] == "bearish": score -= 2
    elif macd["histogram"] > 0: score += 1
    else: score -= 1

    # Bollinger
    if bb["pct_b"] < 0.1:  score += 2   # precio en banda inferior
    elif bb["pct_b"] > 0.9: score -= 2  # precio en banda superior

    # CVD
    if cvd["trend"] == "bullish" and cvd["momentum"] == "accelerating":  score += 2
    elif cvd["trend"] == "bullish":   score += 1
    elif cvd["trend"] == "bearish" and cvd["momentum"] == "accelerating": score -= 2
    else: score -= 1

    # Volumen
    if vol["ratio"] > 2.0: score += 1
    if vol["above_vwap"]:  score += 1
    else:                  score -= 1

    # OI
    if oi["change_pct"] is not None:
        if oi["change_pct"] > 5:    score += 1
        elif oi["change_pct"] < -5: score -= 1

    # Estructura de mercado
    if ms["structure"] == "uptrend":   score += 2
    elif ms["structure"] == "downtrend": score -= 2

    # Macro
    if macro["bias"] == "bullish":            score += 1
    elif macro["bias"].startswith("bear"):    score -= 1

    # Sentimiento contrarian (peso reducido: confirma, no domina el score técnico)
    score += round(sentiment.sentiment_score / 2)

    # Clasificar señal
    if score >= 8:     signal = "🚀 COMPRA FUERTE"
    elif score >= 4:   signal = "📈 COMPRA"
    elif score <= -8:  signal = "💥 VENTA FUERTE"
    elif score <= -4:  signal = "📉 VENTA"
    else:              signal = "⚖️ NEUTRAL"

    return {
        "symbol":    symbol,
        "timeframe": timeframe,
        "close":     price,
        "rsi":       round(rsi, 2),
        "emas":      emas,
        "macd":      macd,
        "bb":        bb,
        "cvd":       cvd,
        "volume":    vol,
        "sr":        sr,
        "oi":        oi,
        "ema_cross": cross,
        "structure": ms,
        "macro":     macro,
        "sentiment": sentiment,
        "score":     score,
        "signal":    signal,
        "_df":       df,
    }
