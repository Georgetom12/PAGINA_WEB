"""
PSY MOTOR — CURSOR 3: DICTAMEN UNIFICADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Evalúa TODO lo del núcleo y genera UN SOLO dictamen:
  - Dirección macro vs micro
  - Detección de contradicciones
  - Zona óptima de entrada calculada matemáticamente
  - TPs corto plazo (1H-4H)
  - TPs largo plazo (1D-1W)
  - Nivel de confianza 0-100%
  - Razón matemática clara
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional
import logging
from motor.nucleo import NucleoResult

log = logging.getLogger(__name__)


def _fmt(p: float) -> str:
    if p <= 0: return "─"
    if p >= 1000:   return f"{p:,.2f}"
    if p >= 1:      return f"{p:.4f}"
    if p >= 0.01:   return f"{p:.6f}"
    return f"{p:.8f}"


@dataclass
class DictamenMotor:
    symbol:     str   = ""
    precio:     float = 0.0

    # ── Dictamen principal ────────────────────────────────
    dictamen:   str   = ""  # texto completo
    direccion:  str   = "NEUTRAL"
    confianza:  float = 0.0
    accion:     str   = "ESPERAR"  # ENTRAR|ESPERAR|EVITAR

    # ── Contexto ─────────────────────────────────────────
    contexto:   list  = field(default_factory=list)
    contradiccion: bool = False
    resolucion: str   = ""

    # ── Zonas ────────────────────────────────────────────
    zona_entrada:  float = 0.0
    zona_razon:    str   = ""

    # ── TPs corto plazo (1H-4H) ──────────────────────────
    tp1_corto:  float = 0.0
    tp2_corto:  float = 0.0
    tp3_corto:  float = 0.0

    # ── TPs largo plazo (1D-1W) ──────────────────────────
    tp1_macro:  float = 0.0
    tp2_macro:  float = 0.0
    tp3_macro:  float = 0.0

    # ── SL ───────────────────────────────────────────────
    sl:         float = 0.0
    sl_razon:   str   = ""

    # ── Score ─────────────────────────────────────────────
    score_total: float = 0.0


def generar_dictamen(nr: NucleoResult,
                     funding: dict = None,
                     oi: dict = None,
                     macro_data: dict = None) -> DictamenMotor:
    """
    Genera el dictamen unificado evaluando TODO.
    """
    dm = DictamenMotor(symbol=nr.symbol, precio=nr.price)
    precio = nr.price
    if not funding: funding = {}
    if not oi:      oi = {}
    if not macro_data: macro_data = {}

    fund_rate    = funding.get("rate_pct", 0)
    oi_change    = oi.get("oi_change_pct", 0)
    longs_pagan  = funding.get("longs_pay", False)
    shorts_pagan = funding.get("shorts_pay", False)
    squeeze_risk = funding.get("squeeze_risk", False)

    # ════════════════════════════════════════════════════
    # PASO 1: Evaluar dirección con TODOS los datos
    # ════════════════════════════════════════════════════
    score_bull = 0.0
    score_bear = 0.0
    razones    = []

    # Dirección macro del núcleo
    if nr.direccion_macro == "ALCISTA":
        score_bull += 25
        razones.append("📈 Macro alcista (RSI+ADX+CVD+Slope)")
    elif nr.direccion_macro == "BAJISTA":
        score_bear += 25
        razones.append("📉 Macro bajista")

    # Dirección micro
    if nr.direccion_micro == "ALCISTA":
        score_bull += 15
        razones.append("⚡ Micro alcista (4H)")
    elif nr.direccion_micro == "BAJISTA":
        score_bear += 15
        razones.append("⚡ Micro bajista (4H)")

    # Fractal
    # NOTA: nr.fractal_confianza viene en escala 0-100 (no 0-1).
    # Antes se multiplicaba directo (20 * 95.7 = 1914) inflando el score
    # y dejando "CONFIANZA 9570%" en pantalla. Se normaliza a 0-1 aquí.
    conf_frac = nr.fractal_confianza / 100.0
    if nr.fractal_completado:
        if nr.fractal_tipo in ("HCH",):
            score_bear += 20 * conf_frac
            razones.append(f"🔻 Fractal {nr.fractal_tipo} completado "
                          f"(conf {nr.fractal_confianza:.0f}%)")
        elif nr.fractal_tipo in ("HCH_INV", "DOBLE_SUELO"):
            score_bull += 20 * conf_frac
            razones.append(f"🔺 Fractal {nr.fractal_tipo} completado")
        elif nr.fractal_tipo == "DOBLE_TECHO":
            score_bear += 15 * conf_frac
            razones.append(f"🔻 Doble Techo detectado")
        elif nr.fractal_tipo == "CUNA_ALCISTA":
            score_bear += 10
            razones.append("⚠️ Cuña alcista = distribución posible")
        elif nr.fractal_tipo == "CUNA_BAJISTA":
            score_bull += 10
            razones.append("✅ Cuña bajista = acumulación posible")

    # Divergencia precio/volumen/EMA (ver motor/fractal_pro.py::detectar_divergencias)
    div_conf = getattr(nr, "div_confianza", 0) / 100.0
    if nr.div_tipo == "DIV_BAJISTA_REGULAR":
        score_bear += 15 * div_conf
        razones.append(f"📊 Divergencia bajista (conf {getattr(nr,'div_confianza',0):.0f}%) "
                        f"— {getattr(nr,'div_desc','')}")
    elif nr.div_tipo == "DIV_ALCISTA_REGULAR":
        score_bull += 15 * div_conf
        razones.append(f"📊 Divergencia alcista (conf {getattr(nr,'div_confianza',0):.0f}%) "
                        f"— {getattr(nr,'div_desc','')}")

    # Canal de regresión
    if nr.precio_en_canal == "SUPERIOR":
        score_bear += 10
        razones.append("📊 Precio en techo del canal de regresión")
    elif nr.precio_en_canal == "INFERIOR":
        score_bull += 10
        razones.append("📊 Precio en suelo del canal de regresión")

    # VWAP
    if nr.precio_vwap == "SOBRE":
        score_bull += 8
    else:
        score_bear += 8

    # CVD cascada
    if nr.cvd_cascade_bull:
        score_bull += 12
        razones.append("🌊 CVD compradores en cascada (TFs bajos)")
    elif nr.cvd_cascade_bear:
        score_bear += 12
        razones.append("🌊 CVD vendedores en cascada")

    # POC imanes
    if nr.pocs_abajo >= 3:
        score_bear += 15
        razones.append(f"🧲 {nr.pocs_abajo} POCs abajo — imanes de liquidez")
    elif nr.pocs_abajo == 0:
        score_bull += 10
        razones.append("💧 Camino libre — sin POCs abajo")

    # Funding
    if longs_pagan and fund_rate > 0.05:
        score_bear += 10
        razones.append(f"💸 Funding +{fund_rate:.3f}% — longs pagan caro")
    elif shorts_pagan:
        score_bull += 10
        razones.append(f"💥 Funding {fund_rate:.3f}% — squeeze posible")

    # OI
    if oi_change > 5:
        razones.append(f"📈 OI subiendo +{oi_change:.1f}% — tendencia real")
    elif oi_change < -5:
        razones.append(f"📉 OI bajando {oi_change:.1f}% — tendencia debilitando")

    # Agotamiento
    if nr.agotamiento_score >= 60:
        if nr.agotamiento_dir == "ALCISTA":
            score_bear += 15
            razones.append(f"⚡ Agotamiento alcista {nr.agotamiento_score:.0f}/100 — reversal posible")
        elif nr.agotamiento_dir == "BAJISTA":
            score_bull += 15
            razones.append(f"⚡ Agotamiento bajista — rebote posible")

    # Macro externo (DXY, VIX, SPX)
    dxy_change = macro_data.get("DXY_change", 0)
    vix_level  = macro_data.get("VIX_level", 20)
    spx_change = macro_data.get("SPX_change", 0)

    if dxy_change > 0.5:
        score_bear += 5
        razones.append(f"💵 DXY subiendo +{dxy_change:.1f}% — riesgo OFF")
    elif dxy_change < -0.5:
        score_bull += 5
        razones.append(f"💵 DXY bajando {dxy_change:.1f}% — riesgo ON")

    if vix_level > 25:
        score_bear += 5
        razones.append(f"😱 VIX alto ({vix_level:.0f}) — miedo en mercados")
    elif vix_level < 15:
        score_bull += 3

    # ════════════════════════════════════════════════════
    # PASO 2: Determinar dirección y confianza
    # ════════════════════════════════════════════════════
    total = score_bull + score_bear
    if total > 0:
        pct_bull = score_bull / total * 100
        pct_bear = score_bear / total * 100
    else:
        pct_bull = pct_bear = 50

    dm.score_total = round(max(score_bull, score_bear), 1)

    # Detectar contradicción macro vs micro
    dm.contradiccion = (nr.direccion_macro != nr.direccion_micro and
                        nr.direccion_macro != "NEUTRAL" and
                        nr.direccion_micro != "NEUTRAL")

    if pct_bull > 60:
        dm.direccion = "ALCISTA"
        dm.confianza = round(pct_bull, 1)
    elif pct_bear > 60:
        dm.direccion = "BAJISTA"
        dm.confianza = round(pct_bear, 1)
    else:
        dm.direccion = "NEUTRAL"
        dm.confianza = round(max(pct_bull, pct_bear), 1)

    # ════════════════════════════════════════════════════
    # PASO 3: Calcular zonas y TPs
    # ════════════════════════════════════════════════════
    # Zona óptima de entrada
    if dm.direccion == "ALCISTA":
        # Preferir zonas abajo con mayor confluencia
        if nr.zona_optima_long > 0:
            dm.zona_entrada = nr.zona_optima_long
            # Buscar descripción de esa zona
            for p, d, s in nr.zonas_clave:
                if abs(p - dm.zona_entrada) / max(precio, 1e-10) < 0.02:
                    dm.zona_razon = d
                    break
        elif nr.fib_618 > 0 and nr.fib_618 < precio:
            dm.zona_entrada = nr.fib_618
            dm.zona_razon   = "Fib 61.8% del fractal"
        else:
            # Si no hay zona clara, sugiere entrada actual
            dm.zona_entrada = precio
            dm.zona_razon   = "Precio actual (sin retroceso claro)"

        # TPs corto plazo (hacia arriba desde entrada)
        rng_corto = precio * 0.03  # 3% como referencia mínima
        poc_arriba = [p for p in nr.poc_map.values() if p > precio]

        dm.tp1_corto = round(precio * 1.03, 8)
        dm.tp2_corto = round(precio * 1.06, 8)
        dm.tp3_corto = round(precio * 1.10, 8)

        # Usar zonas de confluencia arriba como TPs — limitadas a 20% del
        # precio: "CORTO PLAZO (1H-4H)" no debe poder mostrar un TP a un
        # -78%/+78%, aunque algún nivel de la lista venga distorsionado
        zonas_arriba = [(p,d,s) for p,d,s in nr.zonas_clave
                        if precio * 1.01 < p < precio * 1.20]
        if len(zonas_arriba) >= 1: dm.tp1_corto = round(zonas_arriba[0][0], 8)
        if len(zonas_arriba) >= 2: dm.tp2_corto = round(zonas_arriba[1][0], 8)
        if len(zonas_arriba) >= 3: dm.tp3_corto = round(zonas_arriba[2][0], 8)

        # TPs macro
        dm.tp1_macro = nr.fib_e127 if nr.fib_e127 > precio else round(precio * 1.15, 8)
        dm.tp2_macro = nr.fib_e161 if nr.fib_e161 > precio else round(precio * 1.25, 8)
        dm.tp3_macro = nr.fractal_objetivo if nr.fractal_objetivo > precio else round(precio * 1.40, 8)

        # SL
        dm.sl = round(min(nr.zona_optima_long * 0.97,
                          precio * 0.95), 8)
        dm.sl_razon = "Debajo de zona óptima -3%"

    elif dm.direccion == "BAJISTA":
        # Zona óptima SHORT: arriba con confluencia
        if nr.zona_optima_short > 0:
            dm.zona_entrada = nr.zona_optima_short
            for p, d, s in nr.zonas_clave:
                if abs(p - dm.zona_entrada) / max(precio, 1e-10) < 0.02:
                    dm.zona_razon = d
                    break
        elif nr.fib_618 > 0 and nr.fib_618 > precio:
            dm.zona_entrada = nr.fib_618
            dm.zona_razon   = "Fib 61.8% resistencia"
        elif nr.fractal_neckline > 0:
            dm.zona_entrada = nr.fractal_neckline
            dm.zona_razon   = f"Neckline {nr.fractal_tipo}"
        else:
            dm.zona_entrada = precio
            dm.zona_razon   = "Precio actual"

        # TPs corto (hacia abajo)
        dm.tp1_corto = round(precio * 0.97, 8)
        dm.tp2_corto = round(precio * 0.94, 8)
        dm.tp3_corto = round(precio * 0.90, 8)

        zonas_abajo = [(p,d,s) for p,d,s in nr.zonas_clave
                       if precio * 0.80 < p < precio * 0.99]
        if len(zonas_abajo) >= 1: dm.tp1_corto = round(zonas_abajo[0][0], 8)
        if len(zonas_abajo) >= 2: dm.tp2_corto = round(zonas_abajo[1][0], 8)
        if len(zonas_abajo) >= 3: dm.tp3_corto = round(zonas_abajo[2][0], 8)

        # TPs macro
        dm.tp1_macro = nr.fib_e127 if 0 < nr.fib_e127 < precio else round(precio * 0.85, 8)
        dm.tp2_macro = nr.fib_e161 if 0 < nr.fib_e161 < precio else round(precio * 0.75, 8)
        dm.tp3_macro = nr.fractal_objetivo if 0 < nr.fractal_objetivo < precio else round(precio * 0.65, 8)

        # SL
        dm.sl = round(max(nr.zona_optima_short * 1.03,
                          precio * 1.05), 8)
        dm.sl_razon = "Arriba de zona óptima +3%"

    else:
        dm.zona_entrada = precio
        dm.zona_razon   = "Mercado lateral — sin dirección clara"
        dm.sl           = precio

    # ════════════════════════════════════════════════════
    # PASO 4: Acción recomendada
    # ════════════════════════════════════════════════════
    if dm.confianza >= 70 and dm.direccion != "NEUTRAL":
        if dm.contradiccion:
            dm.accion = "ESPERAR"  # contradicción → esperar confirmación
        elif abs(precio - dm.zona_entrada) / max(precio, 1e-10) < 0.02:
            dm.accion = "ENTRAR"   # precio cerca de zona óptima
        else:
            dm.accion = "ESPERAR"  # esperar retroceso a zona
    elif dm.confianza >= 55:
        dm.accion = "ESPERAR"
    else:
        dm.accion = "EVITAR"

    # ════════════════════════════════════════════════════
    # PASO 5: Generar texto del dictamen
    # ════════════════════════════════════════════════════
    conf_emoji = "🟢" if dm.confianza >= 70 else "🟡" if dm.confianza >= 55 else "🔴"
    accion_emoji = "✅ ENTRAR" if dm.accion == "ENTRAR" else \
                   "⏳ ESPERAR" if dm.accion == "ESPERAR" else "🚫 EVITAR"

    # Resolución de contradicción
    if dm.contradiccion:
        dm.resolucion = (
            f"Macro {nr.direccion_macro} pero Micro {nr.direccion_micro} — "
            f"domina {'macro' if score_bull + score_bear > 40 else 'micro'}"
        )

    # Dictamen principal
    if dm.direccion == "ALCISTA":
        if dm.contradiccion:
            dm.dictamen = (
                f"📈 ALCISTA CON PRECAUCIÓN — Macro apunta arriba pero "
                f"micro contradice. {dm.resolucion}. "
                f"Zona óptima de entrada: {_fmt(dm.zona_entrada)} ({dm.zona_razon})"
            )
        elif nr.agotamiento_score >= 60 and nr.agotamiento_dir == "ALCISTA":
            dm.dictamen = (
                f"⚠️ ALCISTA PERO AGOTADO — El precio puede bajar primero "
                f"a buscar zona {_fmt(dm.zona_entrada)} antes de continuar arriba. "
                f"Agotamiento: {nr.agotamiento_score:.0f}/100"
            )
        elif nr.pocs_abajo >= 2:
            dm.dictamen = (
                f"📈 ALCISTA CON RETROCESO PREVIO — {nr.pocs_abajo} POCs abajo "
                f"como imanes. El precio irá a buscarlos antes de subir. "
                f"Entrada óptima: {_fmt(dm.zona_entrada)}"
            )
        else:
            dm.dictamen = (
                f"🚀 ALCISTA — Tendencia clara. "
                f"Entrada óptima: {_fmt(dm.zona_entrada)} ({dm.zona_razon}). "
                f"Camino libre hacia TPs"
            )

    elif dm.direccion == "BAJISTA":
        if nr.fractal_completado and nr.fractal_tipo == "HCH":
            dm.dictamen = (
                f"🔻 BAJISTA — HCH completado. Precio puede rebotar hasta "
                f"{_fmt(dm.zona_entrada)} (zona SHORT óptima — {dm.zona_razon}) "
                f"antes de continuar bajando hacia {_fmt(nr.fractal_objetivo)}"
            )
        elif dm.contradiccion:
            dm.dictamen = (
                f"📉 BAJISTA CON PRECAUCIÓN — {dm.resolucion}. "
                f"Zona SHORT: {_fmt(dm.zona_entrada)}"
            )
        else:
            dm.dictamen = (
                f"📉 BAJISTA — {nr.direccion_macro} en macro. "
                f"Zona SHORT óptima: {_fmt(dm.zona_entrada)} ({dm.zona_razon})"
            )
    else:
        dm.dictamen = (
            f"⚖️ LATERAL — Sin dirección clara. "
            f"Esperar rompimiento de zona {_fmt(precio * 0.97)}-{_fmt(precio * 1.03)}"
        )

    # Contexto detallado
    dm.contexto = razones[:6]  # máximo 6 razones
    dm.contexto.append(f"{conf_emoji} Confianza: {dm.confianza:.0f}% — {accion_emoji}")

    if nr.fractal_completado:
        dm.contexto.append(
            f"🔺 Fractal {nr.fractal_tipo} | Objetivo: {_fmt(nr.fractal_objetivo)}"
        )

    if nr.en_zona_618:
        dm.contexto.append(f"◆ Golden Pocket 61.8% — zona óptima confirmada")

    if nr.adx_maduro:
        dm.contexto.append(f"⚠️ ADX maduro en macro — tendencia puede agotarse")

    log.info(f"✅ Dictamen {nr.symbol}: {dm.direccion} {dm.confianza:.0f}% — {dm.accion}")

    return dm


def formatear_mensaje(dm: DictamenMotor) -> str:
    """Formatea el dictamen para Telegram."""
    emoji_dir = "🟢" if dm.direccion == "ALCISTA" else \
                "🔴" if dm.direccion == "BAJISTA" else "⚪"

    msg = f"""
🦄 *PSY MOTOR — {dm.symbol}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{emoji_dir} *{dm.dictamen}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 *ZONA ÓPTIMA*
Entrada: `{dm.zona_entrada:.8g}`
Razón: _{dm.zona_razon}_
SL: `{dm.sl:.8g}` ← _{dm.sl_razon}_

⚡ *CORTO PLAZO (1H-4H)*
TP1: `{dm.tp1_corto:.8g}`
TP2: `{dm.tp2_corto:.8g}`
TP3: `{dm.tp3_corto:.8g}`

🌙 *LARGO PLAZO (1D-1W)*
TP1: `{dm.tp1_macro:.8g}`
TP2: `{dm.tp2_macro:.8g}`
TP3: `{dm.tp3_macro:.8g}`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 *ANÁLISIS*
"""
    for c in dm.contexto:
        msg += f"{c}\n"

    msg += f"\n_PSY Motor v1.0 — No es asesoría financiera_"
    return msg.strip()
