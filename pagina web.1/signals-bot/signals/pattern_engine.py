"""
PSY Pattern Engine — PSYCHOMETRIKS
Reconocimiento de patrones históricos + detección de régimen.

Módulos:
  1. Regime Detector   → bajista / alcista / ranging con scoring
  2. Reversal Detector → CHoCH, BOS, Wyckoff Spring, Absorption
  3. Historical Matcher → correlación de Pearson en ventana deslizante
  4. Stats Calculator  → win rate, avg gain, drawdown, expectancy
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
import pandas as pd

log = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────
BEARISH_BARS_MIN  = 5      # barras mínimas bajo EMA para confirmar régimen
EMA_REGIME        = 21     # EMA usada para régimen
LOOKBACK          = 500    # barras históricas a escanear
FORWARD_BARS      = 20     # barras a medir hacia adelante
PATTERN_WINDOW    = 15     # tamaño del patrón actual a comparar
MIN_SIMILARITY    = 0.72   # correlación mínima (Pearson)
MAX_MATCHES       = 30     # máximo de matches a retornar


# ── Data classes ──────────────────────────────────────────
@dataclass
class RegimeInfo:
    type: str = "ranging"          # "downtrend" | "uptrend" | "ranging"
    strength: str = "weak"         # "weak" | "moderate" | "strong"
    bars_in_regime: int = 0
    ema_distance_pct: float = 0.0  # % distancia precio vs EMA regime
    lower_highs: int = 0
    lower_lows: int = 0
    description: str = ""


@dataclass
class ReversalSignal:
    detected: bool = False
    type: str = ""          # "CHoCH" | "BOS" | "Spring" | "Absorption" | "HL_Structure"
    strength: str = ""      # "weak" | "moderate" | "strong"
    description: str = ""
    score: int = 0          # contribución al score final


@dataclass
class HistoricalMatch:
    bar_index: int = 0
    similarity: float = 0.0
    forward_return_pct: float = 0.0
    max_gain_pct: float = 0.0
    max_drawdown_pct: float = 0.0
    bars_to_peak: int = 0


@dataclass
class PatternStats:
    sample_size: int = 0
    win_rate_pct: float = 0.0
    avg_return_pct: float = 0.0
    avg_gain_pct: float = 0.0
    avg_loss_pct: float = 0.0
    avg_drawdown_pct: float = 0.0
    best_case_pct: float = 0.0
    worst_case_pct: float = 0.0
    avg_bars_to_peak: float = 0.0
    expectancy: float = 0.0    # win_rate * avg_gain - loss_rate * avg_loss
    confidence: str = "LOW"    # "LOW" | "MEDIUM" | "HIGH"


@dataclass
class PatternResult:
    regime: RegimeInfo = field(default_factory=RegimeInfo)
    reversal: ReversalSignal = field(default_factory=ReversalSignal)
    matches: list[HistoricalMatch] = field(default_factory=list)
    stats: PatternStats = field(default_factory=PatternStats)
    pattern_score: int = 0   # -5 a +5


# ── Helpers ───────────────────────────────────────────────
def _norm(s: pd.Series) -> pd.Series:
    mn, mx = s.min(), s.max()
    if mx == mn:
        return pd.Series(np.zeros(len(s)), index=s.index)
    return (s - mn) / (mx - mn)


def _pearson(a: pd.Series, b: pd.Series) -> float:
    if len(a) < 4 or len(a) != len(b):
        return 0.0
    try:
        c = np.corrcoef(a.values, b.values)[0, 1]
        return float(c) if not np.isnan(c) else 0.0
    except Exception:
        return 0.0


# ── 1. Regime Detector ────────────────────────────────────
def detect_regime(df: pd.DataFrame) -> RegimeInfo:
    close  = df["close"]
    high   = df["high"]
    low    = df["low"]
    ema    = close.ewm(span=EMA_REGIME, adjust=False).mean()

    price  = float(close.iloc[-1])
    ema_v  = float(ema.iloc[-1])
    ema_dist = (price - ema_v) / ema_v * 100

    # Barras consecutivas bajo/sobre EMA
    below = (close < ema).values[::-1]
    above = (close > ema).values[::-1]
    bars_below = next((i for i, v in enumerate(below) if not v), len(below))
    bars_above = next((i for i, v in enumerate(above) if not v), len(above))

    # Higher/Lower Highs y Lows en las últimas 10 barras
    h = high.tail(10).values
    l = low.tail(10).values
    hh = sum(1 for i in range(1, len(h)) if h[i] > h[i-1])
    lh = sum(1 for i in range(1, len(h)) if h[i] < h[i-1])
    hl = sum(1 for i in range(1, len(l)) if l[i] > l[i-1])
    ll = sum(1 for i in range(1, len(l)) if l[i] < l[i-1])

    regime = RegimeInfo()
    regime.ema_distance_pct = round(ema_dist, 2)
    regime.lower_highs = lh
    regime.lower_lows  = ll

    # Clasificar régimen
    if bars_below >= BEARISH_BARS_MIN and lh >= 5 and ll >= 4:
        regime.type = "downtrend"
        regime.bars_in_regime = bars_below
        if bars_below >= 15 and lh >= 7:
            regime.strength = "strong"
            regime.description = f"Tendencia bajista fuerte — {bars_below} barras bajo EMA{EMA_REGIME}, {lh} Lower Highs consecutivos"
        elif bars_below >= 8:
            regime.strength = "moderate"
            regime.description = f"Tendencia bajista moderada — {bars_below} barras bajo EMA{EMA_REGIME}"
        else:
            regime.strength = "weak"
            regime.description = f"Inicio de tendencia bajista — {bars_below} barras bajo EMA{EMA_REGIME}"

    elif bars_above >= BEARISH_BARS_MIN and hh >= 5 and hl >= 4:
        regime.type = "uptrend"
        regime.bars_in_regime = bars_above
        if bars_above >= 15 and hh >= 7:
            regime.strength = "strong"
            regime.description = f"Tendencia alcista fuerte — {bars_above} barras sobre EMA{EMA_REGIME}"
        else:
            regime.strength = "moderate"
            regime.description = f"Tendencia alcista — {bars_above} barras sobre EMA{EMA_REGIME}"
    else:
        regime.type = "ranging"
        regime.strength = "weak"
        regime.description = "Mercado en rango / indecisión estructural"

    return regime


# ── 2. Reversal Detector ──────────────────────────────────
def detect_reversal(df: pd.DataFrame, regime: RegimeInfo) -> ReversalSignal:
    close  = df["close"]
    high   = df["high"]
    low    = df["low"]
    volume = df["volume"]
    ema    = close.ewm(span=EMA_REGIME, adjust=False).mean()

    rev = ReversalSignal()

    # ── CHoCH: vela actual supera el high de las 3 previas ────────
    recent_high = float(high.iloc[-4:-1].max())
    if float(close.iloc[-1]) > recent_high and regime.type == "downtrend":
        rev.detected    = True
        rev.type        = "CHoCH"
        rev.strength    = "strong"
        rev.score       = 3
        rev.description = f"CHoCH confirmado — precio rompió ${recent_high:,.2f} (estructura bajista rota)"
        return rev

    # ── BOS: cruce alcista de EMA21 con cuerpo sólido ─────────────
    ema_cross_up = (float(close.iloc[-2]) < float(ema.iloc[-2]) and
                    float(close.iloc[-1]) > float(ema.iloc[-1]))
    body_size = abs(float(close.iloc[-1]) - float(df["open"].iloc[-1]))
    avg_body  = abs(df["close"] - df["open"]).tail(20).mean()
    if ema_cross_up and body_size > avg_body * 0.8:
        rev.detected    = True
        rev.type        = "BOS"
        rev.strength    = "moderate"
        rev.score       = 2
        rev.description = f"BOS — cruce alcista de EMA{EMA_REGIME} con cuerpo sólido"
        return rev

    # ── Wyckoff Spring: mínimo que penetra soporte y rebota ──────
    low50 = float(low.rolling(50).min().iloc[-3])  # soporte 50b excluyendo últimas 2
    if (float(low.iloc[-2]) < low50 and          # penetró soporte
        float(close.iloc[-1]) > low50 and         # cerró por encima
        float(volume.iloc[-2]) > float(volume.rolling(20).mean().iloc[-2]) * 1.5):  # vol alto
        rev.detected    = True
        rev.type        = "Spring"
        rev.strength    = "strong"
        rev.score       = 3
        rev.description = f"Wyckoff Spring — penetración falsa del soporte ${low50:,.2f} con volumen alto"
        return rev

    # ── Absorción: vela bajista grande con cierre en el tercio superior ──
    last = df.iloc[-1]
    candle_range = float(last["high"]) - float(last["low"])
    close_pos    = (float(last["close"]) - float(last["low"])) / candle_range if candle_range else 0
    vol_high     = float(last["volume"]) > float(volume.rolling(20).mean().iloc[-1]) * 1.8
    if (float(last["open"]) > float(last["close"]) and  # vela bajista
        close_pos > 0.65 and                             # cierra en tercio superior
        vol_high):
        rev.detected    = True
        rev.type        = "Absorption"
        rev.strength    = "moderate"
        rev.score       = 2
        rev.description = "Absorción — vela bajista con cierre en tercio superior y volumen institucional"
        return rev

    # ── Higher Lows acumulativos ──────────────────────────────────
    lows6 = low.tail(6).values
    hl_count = sum(1 for i in range(1, len(lows6)) if lows6[i] > lows6[i-1])
    if hl_count >= 4:
        rev.detected    = True
        rev.type        = "HL_Structure"
        rev.strength    = "weak"
        rev.score       = 1
        rev.description = f"Higher Lows — {hl_count}/5 mínimos ascendentes (acumulación progresiva)"
        return rev

    return rev  # sin señal


# ── 3. Historical Matcher ─────────────────────────────────
def find_matches(df: pd.DataFrame) -> list[HistoricalMatch]:
    close = df["close"]
    n     = len(close)

    if n < PATTERN_WINDOW + FORWARD_BARS + 20:
        return []

    # Patrón actual normalizado
    current = _norm(close.iloc[-PATTERN_WINDOW:])

    matches: list[HistoricalMatch] = []
    start = max(0, n - LOOKBACK)
    end   = n - PATTERN_WINDOW - FORWARD_BARS

    for i in range(start, end):
        window = close.iloc[i: i + PATTERN_WINDOW]
        if len(window) < PATTERN_WINDOW:
            continue

        sim = _pearson(current, _norm(window))
        if sim < MIN_SIMILARITY:
            continue

        # Medir resultado hacia adelante
        entry  = float(close.iloc[i + PATTERN_WINDOW - 1])
        if entry == 0:
            continue
        fwd    = close.iloc[i + PATTERN_WINDOW: i + PATTERN_WINDOW + FORWARD_BARS]
        if len(fwd) < FORWARD_BARS:
            continue

        rets   = (fwd - entry) / entry * 100
        fwd_ret     = float(rets.iloc[-1])
        max_gain    = float(rets.max())
        max_dd      = float(rets.min())
        bars_peak   = int(rets.idxmax() - fwd.index[0]).days // 1 if hasattr(rets.idxmax(), 'days') else int(np.argmax(rets.values))

        matches.append(HistoricalMatch(
            bar_index          = i,
            similarity         = round(sim, 3),
            forward_return_pct = round(fwd_ret, 2),
            max_gain_pct       = round(max_gain, 2),
            max_drawdown_pct   = round(max_dd, 2),
            bars_to_peak       = bars_peak,
        ))

        if len(matches) >= MAX_MATCHES:
            break

    return matches


# ── 4. Stats Calculator ───────────────────────────────────
def calc_pattern_stats(matches: list[HistoricalMatch]) -> PatternStats:
    s = PatternStats()
    if not matches:
        return s

    returns  = [m.forward_return_pct for m in matches]
    gains    = [r for r in returns if r > 0]
    losses   = [r for r in returns if r <= 0]
    all_gain = [m.max_gain_pct for m in matches]
    all_dd   = [m.max_drawdown_pct for m in matches]

    s.sample_size      = len(matches)
    s.win_rate_pct     = round(len(gains) / len(returns) * 100, 1)
    s.avg_return_pct   = round(float(np.mean(returns)), 2)
    s.avg_gain_pct     = round(float(np.mean(gains)), 2) if gains else 0.0
    s.avg_loss_pct     = round(float(np.mean(losses)), 2) if losses else 0.0
    s.avg_drawdown_pct = round(float(np.mean(all_dd)), 2)
    s.best_case_pct    = round(float(max(all_gain)), 2)
    s.worst_case_pct   = round(float(min(returns)), 2)

    peaks = [m.bars_to_peak for m in matches if m.bars_to_peak > 0]
    s.avg_bars_to_peak = round(float(np.mean(peaks)), 1) if peaks else 0.0

    win_r  = s.win_rate_pct / 100
    loss_r = 1 - win_r
    s.expectancy = round(
        win_r * s.avg_gain_pct - loss_r * abs(s.avg_loss_pct), 2
    )

    # Confianza
    if s.sample_size >= 15 and s.win_rate_pct >= 60:
        s.confidence = "HIGH"
    elif s.sample_size >= 7 and s.win_rate_pct >= 50:
        s.confidence = "MEDIUM"
    else:
        s.confidence = "LOW"

    return s


# ── 5. Score de patrón ────────────────────────────────────
def calc_pattern_score(regime: RegimeInfo, reversal: ReversalSignal, stats: PatternStats) -> int:
    score = 0

    # Régimen bajista previo = contexto correcto para buscar reversal
    if regime.type == "downtrend":
        score += 1   # hay algo que revertir

    # Señal de reversión
    score += reversal.score

    # Validación histórica
    if stats.sample_size >= 5:
        if stats.win_rate_pct >= 65:   score += 2
        elif stats.win_rate_pct >= 55: score += 1
        elif stats.win_rate_pct <= 35: score -= 1

        if stats.expectancy > 3:  score += 1
        elif stats.expectancy < 0: score -= 1

    # Penalización: régimen bajista fuerte sin reversión
    if regime.type == "downtrend" and regime.strength == "strong" and not reversal.detected:
        score -= 2

    return max(-5, min(5, score))


# ── Función principal ─────────────────────────────────────
async def run_pattern_analysis(df: pd.DataFrame) -> PatternResult:
    result = PatternResult()
    try:
        result.regime   = detect_regime(df)
        result.reversal = detect_reversal(df, result.regime)

        if result.regime.type in ("downtrend", "ranging") or result.reversal.detected:
            result.matches = find_matches(df)

        result.stats         = calc_pattern_stats(result.matches)
        result.pattern_score = calc_pattern_score(result.regime, result.reversal, result.stats)

        log.info(
            f"Pattern → regime={result.regime.type}/{result.regime.strength}, "
            f"reversal={result.reversal.type}, matches={result.stats.sample_size}, "
            f"wr={result.stats.win_rate_pct}%, score={result.pattern_score}"
        )
    except Exception as e:
        log.warning(f"Pattern Engine error: {e}", exc_info=True)

    return result
