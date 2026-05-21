"""
Motor de indicadores técnicos.
Usa ccxt para obtener datos de Binance (sin clave API para datos públicos).
"""
import asyncio
from datetime import datetime, date
from typing import Optional
import ccxt.async_support as ccxt
import pandas as pd
import numpy as np

from config import HALVING_DATES


# ─── Exchange ─────────────────────────────────────────────────────────────────
def get_exchange():
    return ccxt.binance({"enableRateLimit": True})


# ─── OHLCV ────────────────────────────────────────────────────────────────────
async def fetch_ohlcv(symbol: str, timeframe: str = "4h", limit: int = 250) -> pd.DataFrame:
    exchange = get_exchange()
    try:
        raw = await exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
    finally:
        await exchange.close()

    df = pd.DataFrame(raw, columns=["timestamp", "open", "high", "low", "close", "volume"])
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
    df = df.set_index("timestamp")
    return df.astype(float)


# ─── RSI ──────────────────────────────────────────────────────────────────────
def calc_rsi(series: pd.Series, period: int = 14) -> float:
    delta  = series.diff().dropna()
    gain   = delta.clip(lower=0)
    loss   = (-delta).clip(lower=0)
    avg_g  = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_l  = loss.ewm(com=period - 1, min_periods=period).mean()
    rs     = avg_g / avg_l.replace(0, np.inf)
    rsi    = 100 - (100 / (1 + rs))
    return float(rsi.iloc[-1])


# ─── EMA ──────────────────────────────────────────────────────────────────────
def calc_emas(df: pd.DataFrame) -> dict:
    close = df["close"]
    return {
        9:   float(close.ewm(span=9,   adjust=False).mean().iloc[-1]),
        21:  float(close.ewm(span=21,  adjust=False).mean().iloc[-1]),
        50:  float(close.ewm(span=50,  adjust=False).mean().iloc[-1]),
        200: float(close.ewm(span=200, adjust=False).mean().iloc[-1]),
    }


# ─── EMA cross ────────────────────────────────────────────
def ema_cross(df: pd.DataFrame, fast: int = 9, slow: int = 21) -> Optional[str]:
    close = df["close"]
    fast_ema = close.ewm(span=fast, adjust=False).mean()
    slow_ema = close.ewm(span=slow, adjust=False).mean()
    diff_now  = fast_ema.iloc[-1] - slow_ema.iloc[-1]
    diff_prev = fast_ema.iloc[-2] - slow_ema.iloc[-2]
    if diff_prev < 0 and diff_now > 0:
        return "golden_cross"
    if diff_prev > 0 and diff_now < 0:
        return "death_cross"
    return None


# ─── CVD (Cumulative Volume Delta) ───────────────────────────────────────────
def calc_cvd(df: pd.DataFrame) -> float:
    """
    Aproximación: velas alcistas suman volumen, bajistas lo restan.
    Retorna el delta acumulado de las últimas 20 velas.
    """
    tail = df.tail(20).copy()
    tail["delta"] = tail.apply(
        lambda r: r["volume"] if r["close"] >= r["open"] else -r["volume"], axis=1
    )
    return float(tail["delta"].sum())


# ─── Volumen ──────────────────────────────────────────────
def vol_ratio(df: pd.DataFrame, period: int = 20) -> float:
    avg = df["volume"].rolling(period).mean().iloc[-1]
    cur = df["volume"].iloc[-1]
    return cur / avg if avg else 1.0


# ─── Open Interest (Binance Futures) ─────────────────────
async def fetch_open_interest(symbol: str) -> Optional[float]:
    """
    Devuelve cambio % de OI en las últimas 8h (datos públicos Binance Futures).
    """
    try:
        exchange = ccxt.binance({"enableRateLimit": True, "options": {"defaultType": "future"}})
        try:
            oiHistory = await exchange.fetch_open_interest_history(symbol, "1h", limit=9)
        finally:
            await exchange.close()
        if oiHistory and len(oiHistory) >= 2:
            oi_new = oiHistory[-1]["openInterestAmount"]
            oi_old = oiHistory[0]["openInterestAmount"]
            return ((oi_new - oi_old) / oi_old) * 100 if oi_old else 0.0
    except Exception:
        pass
    return None


# ─── Soporte / Resistencia ────────────────────────────────
def calc_support_resistance(df: pd.DataFrame, window: int = 20) -> dict:
    high   = df["high"].rolling(window).max().iloc[-1]
    low    = df["low"].rolling(window).min().iloc[-1]
    close  = df["close"].iloc[-1]
    dist_r = ((high - close) / close) * 100
    dist_s = ((close - low)  / close) * 100
    return {
        "resistance": round(high, 4),
        "support":    round(low, 4),
        "dist_resistance_pct": round(dist_r, 2),
        "dist_support_pct":    round(dist_s, 2),
    }


# ─── Ciclo macro (halvings BTC) ───────────────────────────
def macro_phase() -> dict:
    halvings   = sorted([datetime.strptime(d, "%Y-%m-%d").date() for d in HALVING_DATES])
    today      = date.today()
    last_halv  = max(h for h in halvings if h <= today)
    next_halv  = min((h for h in halvings if h > today), default=None)
    days_since = (today - last_halv).days
    cycle_len  = 1461  # ~4 años

    pct = (days_since / cycle_len) * 100

    if pct < 15:
        phase = "🟡 Acumulación post-halving"
        bias  = "neutral"
    elif pct < 45:
        phase = "🟢 Mercado alcista (bull run)"
        bias  = "bullish"
    elif pct < 65:
        phase = "🔴 Distribución / techo"
        bias  = "bearish"
    else:
        phase = "🔵 Mercado bajista / acumulación"
        bias  = "neutral-bearish"

    return {
        "phase":        phase,
        "bias":         bias,
        "days_since":   days_since,
        "pct_cycle":    round(pct, 1),
        "last_halving": str(last_halv),
        "next_halving": str(next_halv) if next_halv else "N/A",
    }


# ─── Análisis completo ────────────────────────────────────
async def full_analysis(symbol: str, timeframe: str = "4h") -> dict:
    df   = await fetch_ohlcv(symbol, timeframe)
    rsi  = calc_rsi(df["close"])
    emas = calc_emas(df)
    cvd  = calc_cvd(df)
    vol  = vol_ratio(df)
    sr   = calc_support_resistance(df)
    cross = ema_cross(df)
    oi_change = await fetch_open_interest(symbol)
    macro = macro_phase()

    close = float(df["close"].iloc[-1])

    # ─── Señal compuesta ──────────────────────────────────
    score = 0
    if rsi < 30:   score += 2
    elif rsi < 45: score += 1
    elif rsi > 70: score -= 2
    elif rsi > 55: score -= 1

    if emas[9] > emas[21]: score += 1
    else:                  score -= 1

    if cross == "golden_cross": score += 2
    elif cross == "death_cross": score -= 2

    if cvd > 0:  score += 1
    else:        score -= 1

    if vol > 1.5: score += 1

    if oi_change is not None:
        if oi_change > 5:   score += 1
        elif oi_change < -5: score -= 1

    if macro["bias"] == "bullish":        score += 1
    elif macro["bias"].startswith("bear"): score -= 1

    if score >= 4:     signal = "🚀 COMPRA FUERTE"
    elif score >= 2:   signal = "📈 COMPRA"
    elif score <= -4:  signal = "💥 VENTA FUERTE"
    elif score <= -2:  signal = "📉 VENTA"
    else:              signal = "⚖️ NEUTRAL"

    return {
        "symbol":     symbol,
        "timeframe":  timeframe,
        "close":      close,
        "rsi":        round(rsi, 2),
        "emas":       {k: round(v, 4) for k, v in emas.items()},
        "cvd":        round(cvd, 2),
        "vol_ratio":  round(vol, 2),
        "sr":         sr,
        "oi_change":  round(oi_change, 2) if oi_change is not None else None,
        "ema_cross":  cross,
        "macro":      macro,
        "score":      score,
        "signal":     signal,
    }
