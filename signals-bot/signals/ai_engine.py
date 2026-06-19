"""
PSY AI Engine — PSYCHOMETRIKS
Inteligencia artificial via NVIDIA NIM API.
Modelo: meta/llama-3.1-70b-instruct

Recibe todo el contexto del análisis (técnico + patrón + sentiment + decisión)
y genera:
  - Interpretación narrativa experta
  - Trampa de mercado detectada
  - Niveles TP/SL contextualizados
  - Probabilidad razonada
  - Advertencias de divergencia
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
from dataclasses import dataclass, field
from typing import Optional

import aiohttp

log = logging.getLogger(__name__)

NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
NVIDIA_MODEL   = "meta/llama-3.1-70b-instruct"
TIMEOUT        = aiohttp.ClientTimeout(total=30)


# ── Data class ────────────────────────────────────────────
@dataclass
class AIResult:
    interpretacion: str       = ""
    trampa_detectada: str     = ""
    probabilidad: str         = ""
    entrada_sugerida: str     = ""
    tp1: str                  = ""
    tp2: str                  = ""
    sl: str                   = ""
    advertencia: str          = ""
    resumen_ejecutivo: str    = ""
    telegram_block: str       = ""
    error: Optional[str]      = None


# ── Constructor del prompt ────────────────────────────────
def _build_prompt(
    technical: dict,
    pattern,
    sentiment,
    decision,
) -> str:
    sr     = technical.get("sr", {})
    macro  = technical.get("macro", {})
    emas   = technical.get("emas", {})
    cvd    = technical.get("cvd", {})
    macd   = technical.get("macd", {})
    bb     = technical.get("bb", {})
    vol    = technical.get("volume", {})
    oi     = technical.get("oi", {})
    ms     = technical.get("structure", {})

    return f"""Eres un analista cuantitativo experto en trading de criptomonedas con 15 años de experiencia en Smart Money Concepts, Elliott Wave, Wyckoff y análisis on-chain institucional.

Analiza el siguiente dataset completo y responde ÚNICAMENTE en formato JSON válido, sin texto adicional antes o después del JSON.

=== DATASET DE MERCADO ===

ACTIVO: {technical.get('symbol','?')} | TEMPORALIDAD: {technical.get('timeframe','?')}
PRECIO ACTUAL: ${technical.get('close', 0):,.4f}

--- TÉCNICO ---
RSI(14): {technical.get('rsi', 0)}
EMA 9/21/50/200: {emas.get(9,0):.2f} / {emas.get(21,0):.2f} / {emas.get(50,0):.2f} / {emas.get(200,0):.2f}
MACD Histograma: {macd.get('histogram',0):+.4f} | Cruce: {macd.get('cross','none')}
Bollinger %B: {bb.get('pct_b',0.5):.3f} | Squeeze: {bb.get('squeeze', False)}
CVD: {cvd.get('value',0):+,.0f} | Tendencia: {cvd.get('trend','?')} | Momentum: {cvd.get('momentum','?')}
Volumen ratio: {vol.get('ratio',1):.2f}x | Sobre VWAP: {vol.get('above_vwap', False)}
Open Interest cambio: {oi.get('change_pct','N/D')}% | Trend: {oi.get('trend','?')}
Estructura: {ms.get('structure','?')} (HH:{ms.get('hh',0)} LH:{ms.get('lh',0)} HL:{ms.get('hl',0)} LL:{ms.get('ll',0)})
Resistencia: ${sr.get('resistance',0):,.4f} (+{sr.get('dist_resistance_pct',0)}%)
Soporte: ${sr.get('support',0):,.4f} (-{sr.get('dist_support_pct',0)}%)
Resistencia mayor: ${sr.get('resistance_major',0):,.4f}
Soporte mayor: ${sr.get('support_major',0):,.4f}
Ciclo macro BTC: {macro.get('phase','?')} ({macro.get('pct_cycle',0)}% del ciclo de 4 años)

--- PATRÓN HISTÓRICO ---
Régimen: {pattern.regime.type} / {pattern.regime.strength}
Descripción régimen: {pattern.regime.description}
Señal de reversión: {pattern.reversal.type if pattern.reversal.detected else 'Ninguna'}
Descripción reversión: {pattern.reversal.description}
Matches históricos similares: {pattern.stats.sample_size}
Win Rate histórico: {pattern.stats.win_rate_pct}%
Retorno promedio: {pattern.stats.avg_return_pct:+.2f}%
Ganancia promedio: {pattern.stats.avg_gain_pct:+.2f}%
Drawdown promedio: {pattern.stats.avg_drawdown_pct:.2f}%
Mejor caso histórico: {pattern.stats.best_case_pct:+.2f}%
Expectancy: {pattern.stats.expectancy:+.2f}% por operación
Confianza histórica: {pattern.stats.confidence}

--- SENTIMENT ---
Fear & Greed: {sentiment.fear_greed.value}/100 ({sentiment.fear_greed.label})
Funding Rate: {sentiment.funding.value}% ({sentiment.funding.signal})
Long/Short Ratio: {sentiment.long_short.value} ({sentiment.long_short.signal})
Taker Buy/Sell: {sentiment.taker_ratio.value} ({sentiment.taker_ratio.signal})
Top Traders (inst.): {sentiment.top_traders.label} ({sentiment.top_traders.signal})
Mood general: {sentiment.market_mood}

--- DECISION ENGINE ---
Score Final: {decision.final_score}/100
Señal: {decision.signal_type}
Confianza: {decision.confidence}
Score Técnico normalizado: {decision.tech_normalized}/100
Score Patrón normalizado: {decision.pat_normalized}/100
Score Sentiment normalizado: {decision.sent_normalized}/100

=== INSTRUCCIONES ===

Basándote en TODOS los datos anteriores, responde SOLO con este JSON (sin markdown, sin texto extra):

{{
  "interpretacion": "Análisis narrativo experto de 2-3 oraciones explicando la confluencia de señales y por qué este setup es relevante ahora",
  "trampa_detectada": "Nombre de la trampa si la detectas (Judas Swing / Bear Trap / Bull Trap / Liquidity Hunt / Stop Hunt / Ninguna) con breve explicación",
  "probabilidad": "Estimado porcentual de éxito con razonamiento en 1 oración (ej: '68% — win rate histórico respaldado por confluencia técnica y sentiment contrarian')",
  "entrada_sugerida": "Precio o zona de entrada óptima con justificación técnica",
  "tp1": "Primer target con nivel exacto y razón técnica",
  "tp2": "Segundo target con nivel exacto y razón técnica",
  "sl": "Stop loss con nivel exacto y razón técnica (invalidación del setup)",
  "advertencia": "Riesgo principal o señal de alerta a monitorear (o 'Ninguna' si el setup es limpio)",
  "resumen_ejecutivo": "Una sola oración tipo titular — el veredicto final del setup"
}}"""


# ── Llamada a NVIDIA NIM ──────────────────────────────────
async def _call_nvidia(prompt: str) -> Optional[str]:
    api_key = os.getenv("NVIDIA_API_KEY", "")
    if not api_key:
        log.warning("NVIDIA_API_KEY no configurada")
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type":  "application/json",
    }
    payload = {
        "model": NVIDIA_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "Eres un analista cuantitativo experto en crypto trading. Respondes ÚNICAMENTE en JSON válido, sin texto adicional.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "temperature": 0.2,   # bajo para respuestas consistentes
        "top_p": 0.9,
        "max_tokens": 800,
    }

    try:
        async with aiohttp.ClientSession(timeout=TIMEOUT) as session:
            async with session.post(NVIDIA_API_URL, headers=headers, json=payload) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    log.warning(f"NVIDIA API error {resp.status}: {text[:200]}")
                    return None
                data = await resp.json()
                return data["choices"][0]["message"]["content"]
    except asyncio.TimeoutError:
        log.warning("NVIDIA API timeout (30s)")
        return None
    except Exception as e:
        log.warning(f"NVIDIA API error: {e}")
        return None


# ── Parser de respuesta JSON ──────────────────────────────
def _parse_response(raw: Optional[str]) -> Optional[dict]:
    if not raw:
        return None
    try:
        # Limpiar posibles backticks de markdown
        clean = raw.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        return json.loads(clean.strip())
    except Exception as e:
        log.warning(f"Error parseando respuesta AI: {e}\nRaw: {raw[:300]}")
        return None


# ── Constructor del bloque Telegram ──────────────────────
def _build_telegram_block(parsed: dict, symbol: str) -> str:
    lines = [
        f"\n🤖 *PSY-AI ANALYSIS*",
        f"{'─'*32}",
        f"📝 *Interpretación:*",
        f"_{parsed.get('interpretacion', 'N/D')}_",
        f"",
        f"🎯 *Veredicto:* `{parsed.get('resumen_ejecutivo', 'N/D')}`",
        f"",
        f"🎰 *Probabilidad:* {parsed.get('probabilidad', 'N/D')}",
        f"",
    ]

    # Trampa
    trampa = parsed.get("trampa_detectada", "Ninguna")
    if trampa and trampa.lower() != "ninguna":
        lines += [
            f"⚠️ *Trampa Detectada:*",
            f"_{trampa}_",
            f"",
        ]

    # Niveles operativos
    entrada = parsed.get("entrada_sugerida", "")
    tp1     = parsed.get("tp1", "")
    tp2     = parsed.get("tp2", "")
    sl      = parsed.get("sl", "")

    if any([entrada, tp1, tp2, sl]):
        lines += [f"📊 *Niveles Operativos IA:*"]
        if entrada: lines.append(f"• 🎯 Entrada: `{entrada}`")
        if tp1:     lines.append(f"• ✅ TP1: `{tp1}`")
        if tp2:     lines.append(f"• ✅ TP2: `{tp2}`")
        if sl:      lines.append(f"• 🛑 SL:  `{sl}`")
        lines.append("")

    # Advertencia
    advertencia = parsed.get("advertencia", "")
    if advertencia and advertencia.lower() != "ninguna":
        lines += [
            f"⚡ *Riesgo a monitorear:*",
            f"_{advertencia}_",
        ]

    return "\n".join(lines)


# ── Función principal ─────────────────────────────────────
async def run_ai_analysis(
    technical: dict,
    pattern,
    sentiment,
    decision,
) -> AIResult:
    result = AIResult()

    if not os.getenv("NVIDIA_API_KEY"):
        result.error = "NVIDIA_API_KEY no configurada"
        log.info("AI Engine: skipping (sin API key)")
        return result

    try:
        prompt   = _build_prompt(technical, pattern, sentiment, decision)
        raw      = await _call_nvidia(prompt)
        parsed   = _parse_response(raw)

        if not parsed:
            result.error = "No se pudo parsear respuesta AI"
            return result

        result.interpretacion    = parsed.get("interpretacion", "")
        result.trampa_detectada  = parsed.get("trampa_detectada", "")
        result.probabilidad      = parsed.get("probabilidad", "")
        result.entrada_sugerida  = parsed.get("entrada_sugerida", "")
        result.tp1               = parsed.get("tp1", "")
        result.tp2               = parsed.get("tp2", "")
        result.sl                = parsed.get("sl", "")
        result.advertencia       = parsed.get("advertencia", "")
        result.resumen_ejecutivo = parsed.get("resumen_ejecutivo", "")
        result.telegram_block    = _build_telegram_block(parsed, technical.get("symbol",""))

        log.info(f"AI Analysis → {result.resumen_ejecutivo[:80]}")

    except Exception as e:
        result.error = str(e)
        log.warning(f"AI Engine error: {e}", exc_info=True)

    return result
