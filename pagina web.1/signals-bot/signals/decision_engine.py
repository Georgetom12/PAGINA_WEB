"""
PSY Decision Engine — PSYCHOMETRIKS
Score ponderado final 0-100 con contexto narrativo completo.

Pesos:
  Técnico   50% (RSI, EMA, MACD, BB, CVD, OI, Estructura, Macro)
  Patrón    30% (Régimen, Reversión, Histórico, Wyckoff)
  Sentiment 20% (Fear & Greed, Funding, L/S, Taker, Top Traders)

Output: mensaje Telegram enriquecido con toda la inteligencia PSY.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

from signals.pattern_engine import PatternResult
from signals.sentiment_engine import SentimentResult

log = logging.getLogger(__name__)

# ── Pesos ─────────────────────────────────────────────────
W_TECH = 0.50
W_PAT  = 0.30
W_SENT = 0.20

# ── Umbrales señal ────────────────────────────────────────
STRONG_BUY  = 72
BUY         = 58
SELL        = 42
STRONG_SELL = 28


@dataclass
class DecisionResult:
    final_score: float      = 50.0
    signal: str             = "⚖️ NEUTRAL"
    signal_type: str        = "NEUTRAL"
    confidence: str         = "BAJA"     # "BAJA" | "MEDIA" | "ALTA"
    conf_emoji: str         = "🔴"
    tech_normalized: float  = 50.0
    pat_normalized: float   = 50.0
    sent_normalized: float  = 50.0
    telegram_block: str     = ""         # bloque PSY INTELLIGENCE para Telegram


# ── Normalización ─────────────────────────────────────────
def _norm_tech(raw: int) -> float:
    # Score técnico: aprox -18 a +18 (nuevo sistema expandido)
    return max(0.0, min(100.0, (max(-18, min(18, raw)) + 18) / 36 * 100))


def _norm_pat(raw: int) -> float:
    # Pattern score: -5 a +5
    return (max(-5, min(5, raw)) + 5) / 10 * 100


def _norm_sent(raw: int) -> float:
    # Sentiment score: aprox -8 a +8
    return max(0.0, min(100.0, (max(-8, min(8, raw)) + 8) / 16 * 100))


# ── Clasificación ─────────────────────────────────────────
def _classify(score: float) -> tuple[str, str]:
    if score >= STRONG_BUY:  return "🚀 COMPRA FUERTE", "STRONG_BUY"
    if score >= BUY:          return "📈 COMPRA",        "BUY"
    if score <= STRONG_SELL:  return "💥 VENTA FUERTE",  "STRONG_SELL"
    if score <= SELL:         return "📉 VENTA",         "SELL"
    return "⚖️ NEUTRAL", "NEUTRAL"


def _confidence(tn: float, pn: float, sn: float, sample: int) -> tuple[str, str]:
    all_bull = tn > 62 and pn > 62 and sn > 62
    all_bear = tn < 38 and pn < 38 and sn < 38
    diverge  = max(abs(tn - pn), abs(tn - sn), abs(pn - sn)) > 30

    if (all_bull or all_bear) and sample >= 8:
        return "ALTA", "🟢"
    if diverge or sample < 3:
        return "BAJA", "🔴"
    return "MEDIA", "🟡"


# ── Construcción del bloque Telegram ─────────────────────
def _build_telegram_block(
    d: DecisionResult,
    technical_data: dict,
    pattern: PatternResult,
    sentiment: SentimentResult,
) -> str:
    lines = []

    # ── Cabecera PSY INTELLIGENCE ─────────────────────────
    lines += [
        f"\n🧠 *PSY INTELLIGENCE*",
        f"{'─'*32}",
        f"🎯 *Score Final:* `{d.final_score:.1f} / 100`",
        f"📊 Técnico: `{d.tech_normalized:.0f}`  🔮 Patrón: `{d.pat_normalized:.0f}`  💭 Sentiment: `{d.sent_normalized:.0f}`",
        f"{d.conf_emoji} Confianza: `{d.confidence}`",
        f"",
    ]

    # ── Análisis técnico avanzado ─────────────────────────
    macd = technical_data.get("macd", {})
    bb   = technical_data.get("bb", {})
    cvd  = technical_data.get("cvd", {})
    vol  = technical_data.get("volume", {})
    ms   = technical_data.get("structure", {})

    macd_label = {
        "bullish": "🟢 Cruce alcista MACD",
        "bearish": "🔴 Cruce bajista MACD",
        "none": f"{'🟢' if macd.get('histogram',0) > 0 else '🔴'} Histograma {'positivo' if macd.get('histogram',0) > 0 else 'negativo'}",
    }.get(macd.get("cross", "none"), "—")

    bb_label = (
        "🔵 Squeeze activo — breakout pendiente" if bb.get("squeeze")
        else f"BB %B: {bb.get('pct_b',0.5):.2f} {'(zona sobreventa)' if bb.get('pct_b',1) < 0.2 else '(zona sobrecompra)' if bb.get('pct_b',0) > 0.8 else ''}"
    )

    struct_emoji = {"uptrend": "🟢", "downtrend": "🔴", "ranging": "🟡"}.get(ms.get("structure",""), "⚪")
    struct_label = {"uptrend": "Tendencia alcista", "downtrend": "Tendencia bajista", "ranging": "Rango"}.get(ms.get("structure",""), "N/D")

    lines += [
        f"📈 *Análisis Avanzado*",
        f"• {macd_label} (MACD: `{macd.get('histogram',0):+.4f}`)",
        f"• {bb_label}",
        f"• CVD: `{cvd.get('value',0):+,.0f}` — tendencia `{cvd.get('trend','?')}` ({cvd.get('momentum','?')})",
        f"• Volumen: `{vol.get('ratio',1):.2f}x` vs avg {'🔥 Institucional' if vol.get('ratio',0) > 2 else ''}  |  {'🟢 Sobre VWAP' if vol.get('above_vwap') else '🔴 Bajo VWAP'}",
        f"• {struct_emoji} Estructura: `{struct_label}` (HH:{ms.get('hh',0)} LH:{ms.get('lh',0)} HL:{ms.get('hl',0)} LL:{ms.get('ll',0)})",
        f"",
    ]

    # ── Pattern Engine ────────────────────────────────────
    regime  = pattern.regime
    reversal= pattern.reversal
    stats   = pattern.stats

    regime_emoji = {"downtrend": "🔴", "uptrend": "🟢", "ranging": "🟡"}.get(regime.type, "⚪")
    lines += [
        f"🔮 *Reconocimiento de Patrón*",
        f"• {regime_emoji} Régimen: `{regime.description}`",
    ]

    if reversal.detected:
        lines.append(f"• ✅ Reversión: `{reversal.description}`")
    else:
        lines.append(f"• ⏳ Sin señal de reversión confirmada aún")

    if stats.sample_size >= 3:
        conf_color = {"HIGH": "🟢", "MEDIUM": "🟡", "LOW": "🔴"}.get(stats.confidence, "⚪")
        lines += [
            f"",
            f"📚 *Histórico — {stats.sample_size} casos similares* {conf_color}",
            f"• ✅ Win Rate: `{stats.win_rate_pct}%`",
            f"• 📈 Retorno promedio: `{stats.avg_return_pct:+.2f}%`",
            f"• 💰 Ganancia promedio: `{stats.avg_gain_pct:+.2f}%`  |  Pérdida prom: `{stats.avg_loss_pct:.2f}%`",
            f"• 📉 Drawdown promedio: `{stats.avg_drawdown_pct:.2f}%`",
            f"• 🏆 Mejor caso: `{stats.best_case_pct:+.2f}%`  |  Peor: `{stats.worst_case_pct:.2f}%`",
            f"• ⚡ Expectancy: `{stats.expectancy:+.2f}%` por operación",
            f"• ⏱️ Pico promedio: `~{stats.avg_bars_to_peak:.0f} velas`",
        ]
    else:
        lines.append(f"• 📉 Sin suficientes matches históricos (mín. 3 necesarios)")

    lines.append("")

    # ── Sentiment Engine ──────────────────────────────────
    mood_bar = _mood_bar(sentiment.fear_greed.value)
    lines += [
        f"💭 *Percepción del Mercado*",
        f"• {sentiment.mood_emoji} Estado: `{sentiment.market_mood}`",
        f"• {mood_bar}",
    ]
    for line in sentiment.summary_lines:
        lines.append(f"• {line}")

    lines += [
        f"",
        f"⚡ *Señal Contrarian:* _{sentiment.contrarian_signal}_",
    ]

    return "\n".join(lines)


def _mood_bar(fg_value: Optional[float]) -> str:
    """Genera una barra visual del Fear & Greed."""
    if fg_value is None:
        return "Índice no disponible"
    filled = round(fg_value / 10)
    bar = "█" * filled + "░" * (10 - filled)
    return f"`[{bar}]` {fg_value}/100"


# ── Función principal ─────────────────────────────────────
def run_decision(
    technical_data: dict,
    pattern: PatternResult,
    sentiment: SentimentResult,
) -> DecisionResult:
    d = DecisionResult()

    tech_raw  = technical_data.get("score", 0)
    pat_raw   = pattern.pattern_score
    sent_raw  = sentiment.sentiment_score

    tn = _norm_tech(tech_raw)
    pn = _norm_pat(pat_raw)
    sn = _norm_sent(sent_raw)

    d.tech_normalized = round(tn, 1)
    d.pat_normalized  = round(pn, 1)
    d.sent_normalized = round(sn, 1)
    d.final_score     = round(tn * W_TECH + pn * W_PAT + sn * W_SENT, 1)

    d.signal, d.signal_type   = _classify(d.final_score)
    d.confidence, d.conf_emoji = _confidence(tn, pn, sn, pattern.stats.sample_size)

    d.telegram_block = _build_telegram_block(d, technical_data, pattern, sentiment)

    log.info(
        f"Decision → score={d.final_score} [{d.signal_type}] "
        f"conf={d.confidence} (T:{tn:.0f} P:{pn:.0f} S:{sn:.0f})"
    )
    return d
