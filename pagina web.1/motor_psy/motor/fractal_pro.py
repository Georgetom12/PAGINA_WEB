"""
PSY MOTOR — CURSOR 5: FRACTALES AVANZADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Detección matemática avanzada de patrones:
  - HCH / HCH Invertido (con volumen confirmación)
  - Doble Techo / Doble Suelo
  - Cuña Alcista / Bajista
  - Canal Alcista / Bajista
  - Triángulo Simétrico / Ascendente / Descendente
  - Velas Fibonacci significativas
  - Divergencias RSI/Precio
  - Zonas de agotamiento extendido

Cada patrón incluye:
  - Confianza matemática 0-100%
  - Confirmación por volumen
  - Objetivo de precio
  - Tiempo estimado de ruptura
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import Optional
import logging

log = logging.getLogger(__name__)


@dataclass
class FractalResult:
    # ── Patrón principal ──────────────────────────────────
    patron:      str   = "NINGUNO"
    tipo:        str   = "NEUTRAL"   # BULLISH|BEARISH|NEUTRAL
    confianza:   float = 0.0         # 0-100
    completado:  bool  = False
    confirmado:  bool  = False       # confirmado por volumen

    # ── Niveles del patrón ────────────────────────────────
    neckline:    float = 0.0
    soporte:     float = 0.0
    resistencia: float = 0.0
    objetivo:    float = 0.0
    stop:        float = 0.0

    # ── Fibonacci del patrón ──────────────────────────────
    fib_618:     float = 0.0
    fib_382:     float = 0.0
    fib_786:     float = 0.0
    fib_e127:    float = 0.0
    fib_e161:    float = 0.0
    en_gp:       bool  = False       # en Golden Pocket

    # ── Velas significativas ──────────────────────────────
    vela_tipo:   str   = "NINGUNA"   # DOJI|HAMMER|SHOOTING_STAR|ENGULFING|etc
    vela_señal:  str   = "NEUTRAL"

    # ── Divergencias ─────────────────────────────────────
    div_rsi_bull: bool = False       # precio baja, RSI sube
    div_rsi_bear: bool = False       # precio sube, RSI baja
    div_tipo:    str   = "NINGUNA"
    div_desc:    str   = ""
    div_confianza: float = 0.0       # 0-100, sube con volumen/EMA/vela confirmando
    div_vol_confirma:  bool = False  # volumen del swing actual más débil que el previo
    div_ema_confirma:  bool = False  # pendiente EMA rápida más débil que en el swing previo
    div_vela_confirma: bool = False  # vela de rechazo (mecha larga) en el swing actual

    # ── Canal / Tendencia ─────────────────────────────────
    canal_tipo:  str   = "NINGUNO"   # ALCISTA|BAJISTA|LATERAL
    canal_sup:   float = 0.0
    canal_inf:   float = 0.0
    en_techo:    bool  = False
    en_suelo:    bool  = False

    # ── Score total ───────────────────────────────────────
    score:       float = 0.0
    narrativa:   list  = field(default_factory=list)


# ══════════════════════════════════════════════════════════
# PIVOTES CON CONFIRMACIÓN DE VOLUMEN
# ══════════════════════════════════════════════════════════
def calc_pivotes_vol(df: pd.DataFrame, n: int = 3) -> tuple:
    """
    Pivotes matemáticos con confirmación de volumen.
    Un pivote es más significativo si el volumen es mayor al promedio.
    """
    h = df["high"].values
    l = df["low"].values
    v = df["volume"].values
    vol_ma = np.convolve(v, np.ones(20)/20, mode="same")

    pivotes_h = []
    pivotes_l = []

    for i in range(n, len(df) - n):
        # Swing High
        if all(h[i] >= h[i-j] for j in range(1, n+1)) and \
           all(h[i] >= h[i+j] for j in range(1, n+1)):
            vol_rel = v[i] / max(vol_ma[i], 1e-10)
            conf = min(100, 50 + vol_rel * 25)  # más volumen = más confianza
            pivotes_h.append({
                "precio": float(h[i]),
                "idx":    i,
                "vol":    float(v[i]),
                "conf":   round(conf, 1),
            })

        # Swing Low
        if all(l[i] <= l[i-j] for j in range(1, n+1)) and \
           all(l[i] <= l[i+j] for j in range(1, n+1)):
            vol_rel = v[i] / max(vol_ma[i], 1e-10)
            conf = min(100, 50 + vol_rel * 25)
            pivotes_l.append({
                "precio": float(l[i]),
                "idx":    i,
                "vol":    float(v[i]),
                "conf":   round(conf, 1),
            })

    return pivotes_h[-15:], pivotes_l[-15:]


# ══════════════════════════════════════════════════════════
# HCH CON CONFIRMACIÓN DE VOLUMEN
# ══════════════════════════════════════════════════════════
def detectar_hch_pro(df: pd.DataFrame,
                      ph: list, pl: list) -> dict:
    """
    HCH con validación matemática estricta:
    1. Cabeza > hombros en precio
    2. Hombros similares (±3%)
    3. Volumen: hombro_izq > cabeza > hombro_der (distribución)
    4. Neckline inclinada o plana
    """
    if len(ph) < 3 or len(pl) < 2:
        return {"detectado": False}

    price = float(df["close"].iloc[-1])

    for i in range(len(ph) - 3, -1, -1):
        if i + 2 >= len(ph):
            continue

        h1 = ph[i]    # hombro izquierdo
        h2 = ph[i+1]  # cabeza
        h3 = ph[i+2]  # hombro derecho

        # Cabeza debe ser mayor
        if h2["precio"] <= h1["precio"] or h2["precio"] <= h3["precio"]:
            continue

        # Hombros similares ±3%
        diff_hombros = abs(h1["precio"] - h3["precio"]) / max(h1["precio"], 1e-10)
        if diff_hombros > 0.08:
            continue

        # Buscar neckline (valles entre hombros)
        valles = [p for p in pl if h1["idx"] < p["idx"] < h3["idx"]]
        if len(valles) < 1:
            continue

        neckline = sum(v["precio"] for v in valles) / len(valles)
        altura   = h2["precio"] - neckline
        objetivo = neckline - altura

        # Confianza base
        simetria   = 1 - diff_hombros / 0.05
        conf_base  = simetria * 60

        # Bonus por volumen (hombro_izq > cabeza = distribución)
        if h1["vol"] > h2["vol"]:
            conf_base += 20

        # Bonus por hombro_der < cabeza en volumen
        if h3["vol"] < h2["vol"]:
            conf_base += 10

        # Precio ya rompió neckline?
        roto = price < neckline
        if roto:
            conf_base += 10

        confianza = min(100, conf_base)

        # Fibonacci del patrón
        fib_618 = neckline - altura * 0.618
        fib_e127 = neckline - altura * 1.272

        return {
            "detectado":   True,
            "patron":      "HCH",
            "tipo":        "BEARISH",
            "confianza":   round(confianza, 1),
            "completado":  True,
            "confirmado":  roto,
            "neckline":    round(neckline, 8),
            "objetivo":    round(objetivo, 8),
            "stop":        round(h2["precio"] * 1.02, 8),
            "fib_618":     round(fib_618, 8),
            "fib_e127":    round(fib_e127, 8),
            "narrativa":   [
                f"🔻 HCH detectado — Cabeza: {h2['precio']:.4f}",
                f"📍 Neckline: {neckline:.4f} {'(ROTO ✅)' if roto else '(sin romper)'}",
                f"🎯 Objetivo: {objetivo:.4f}",
                f"🛑 Stop: {h2['precio'] * 1.02:.4f}",
            ]
        }

    return {"detectado": False}


def detectar_hch_inv_pro(df: pd.DataFrame,
                          ph: list, pl: list) -> dict:
    """HCH Invertido con validación estricta."""
    if len(pl) < 3 or len(ph) < 2:
        return {"detectado": False}

    price = float(df["close"].iloc[-1])

    for i in range(len(pl) - 3, -1, -1):
        if i + 2 >= len(pl):
            continue

        l1 = pl[i]
        l2 = pl[i+1]  # cabeza (el más bajo)
        l3 = pl[i+2]

        if l2["precio"] >= l1["precio"] or l2["precio"] >= l3["precio"]:
            continue

        diff = abs(l1["precio"] - l3["precio"]) / max(l1["precio"], 1e-10)
        if diff > 0.05:
            continue

        picos = [p for p in ph if l1["idx"] < p["idx"] < l3["idx"]]
        if not picos:
            continue

        neckline = sum(p["precio"] for p in picos) / len(picos)
        altura   = neckline - l2["precio"]
        objetivo = neckline + altura

        simetria  = 1 - diff / 0.05
        conf_base = simetria * 60

        # Volumen en cabeza mayor = acumulación
        if l2["vol"] > l1["vol"]:
            conf_base += 15
        if l2["vol"] > l3["vol"]:
            conf_base += 10

        roto = price > neckline
        if roto:
            conf_base += 15

        confianza = min(100, conf_base)

        fib_618 = neckline + altura * 0.618
        fib_e127 = neckline + altura * 1.272

        return {
            "detectado":  True,
            "patron":     "HCH_INV",
            "tipo":       "BULLISH",
            "confianza":  round(confianza, 1),
            "completado": True,
            "confirmado": roto,
            "neckline":   round(neckline, 8),
            "objetivo":   round(objetivo, 8),
            "stop":       round(l2["precio"] * 0.98, 8),
            "fib_618":    round(fib_618, 8),
            "fib_e127":   round(fib_e127, 8),
            "narrativa":  [
                f"🔺 HCH INV — Cabeza: {l2['precio']:.4f}",
                f"📍 Neckline: {neckline:.4f} {'(ROTO ✅)' if roto else ''}",
                f"🎯 Objetivo: {objetivo:.4f}",
            ]
        }

    return {"detectado": False}


# ══════════════════════════════════════════════════════════
# DOBLE TECHO / DOBLE SUELO
# ══════════════════════════════════════════════════════════
def detectar_doble_techo_pro(df: pd.DataFrame, ph: list) -> dict:
    """Doble Techo con confirmación matemática."""
    if len(ph) < 2:
        return {"detectado": False}

    price = float(df["close"].iloc[-1])

    for i in range(len(ph) - 2, -1, -1):
        if i + 1 >= len(ph):
            continue

        p1 = ph[i]
        p2 = ph[i+1]

        # Separación mínima de 10 velas
        if p2["idx"] - p1["idx"] < 10:
            continue

        diff = abs(p1["precio"] - p2["precio"]) / max(p1["precio"], 1e-10)
        if diff > 0.05:
            continue

        nivel = (p1["precio"] + p2["precio"]) / 2
        # Soporte = mínimo entre los dos picos
        vals_entre = df["low"].iloc[p1["idx"]:p2["idx"]]
        soporte = float(vals_entre.min()) if len(vals_entre) > 0 else nivel * 0.95
        altura  = nivel - soporte
        objetivo = soporte - altura

        conf = (1 - diff / 0.03) * 70
        if p2["vol"] < p1["vol"]:
            conf += 20  # segundo pico con menos volumen = distribución
        if price < soporte:
            conf += 10  # ya rompió

        return {
            "detectado":  True,
            "patron":     "DOBLE_TECHO",
            "tipo":       "BEARISH",
            "confianza":  round(min(conf, 100), 1),
            "completado": True,
            "confirmado": price < soporte,
            "neckline":   round(soporte, 8),
            "resistencia": round(nivel, 8),
            "objetivo":   round(objetivo, 8),
            "stop":       round(nivel * 1.02, 8),
            "fib_618":    round(soporte - altura * 0.618, 8),
            "fib_e127":   round(soporte - altura * 1.272, 8),
            "narrativa":  [
                f"🔻 Doble Techo en {nivel:.4f}",
                f"📍 Soporte/Neckline: {soporte:.4f}",
                f"🎯 Objetivo: {objetivo:.4f}",
            ]
        }

    return {"detectado": False}


def detectar_doble_suelo_pro(df: pd.DataFrame, pl: list) -> dict:
    """Doble Suelo con confirmación."""
    if len(pl) < 2:
        return {"detectado": False}

    price = float(df["close"].iloc[-1])

    for i in range(len(pl) - 2, -1, -1):
        if i + 1 >= len(pl):
            continue

        p1 = pl[i]
        p2 = pl[i+1]

        if p2["idx"] - p1["idx"] < 10:
            continue

        diff = abs(p1["precio"] - p2["precio"]) / max(p1["precio"], 1e-10)
        if diff > 0.05:
            continue

        nivel = (p1["precio"] + p2["precio"]) / 2
        highs_entre = df["high"].iloc[p1["idx"]:p2["idx"]]
        resistencia = float(highs_entre.max()) if len(highs_entre) > 0 else nivel * 1.05
        altura      = resistencia - nivel
        objetivo    = resistencia + altura

        conf = (1 - diff / 0.03) * 70
        if p2["vol"] > p1["vol"]:
            conf += 20  # segundo suelo con más volumen = acumulación
        if price > resistencia:
            conf += 10

        return {
            "detectado":  True,
            "patron":     "DOBLE_SUELO",
            "tipo":       "BULLISH",
            "confianza":  round(min(conf, 100), 1),
            "completado": True,
            "confirmado": price > resistencia,
            "neckline":   round(resistencia, 8),
            "soporte":    round(nivel, 8),
            "objetivo":   round(objetivo, 8),
            "stop":       round(nivel * 0.98, 8),
            "fib_618":    round(resistencia + altura * 0.618, 8),
            "fib_e127":   round(resistencia + altura * 1.272, 8),
            "narrativa":  [
                f"🔺 Doble Suelo en {nivel:.4f}",
                f"📍 Resistencia/Neckline: {resistencia:.4f}",
                f"🎯 Objetivo: {objetivo:.4f}",
            ]
        }

    return {"detectado": False}


# ══════════════════════════════════════════════════════════
# TRIÁNGULOS Y CUÑAS
# ══════════════════════════════════════════════════════════
def detectar_triangulo(df: pd.DataFrame, ph: list, pl: list) -> dict:
    """Detecta triángulos: simétrico, ascendente, descendente."""
    if len(ph) < 3 or len(pl) < 3:
        return {"detectado": False}

    price = float(df["close"].iloc[-1])

    # Pendiente de máximos
    h_precios = [p["precio"] for p in ph[-4:]]
    l_precios  = [p["precio"] for p in pl[-4:]]

    if len(h_precios) < 2 or len(l_precios) < 2:
        return {"detectado": False}

    slope_h = (h_precios[-1] - h_precios[0]) / max(h_precios[0], 1e-10)
    slope_l  = (l_precios[-1]  - l_precios[0])  / max(l_precios[0],  1e-10)

    # Convergencia
    convergiendo = (slope_h < 0 and slope_l > 0) or \
                   (abs(slope_h) < 0.02 and slope_l > 0.01) or \
                   (slope_h < -0.01 and abs(slope_l) < 0.02)

    if not convergiendo:
        return {"detectado": False}

    nivel_h = h_precios[-1]
    nivel_l  = l_precios[-1]
    altura   = nivel_h - nivel_l
    apex     = (nivel_h + nivel_l) / 2

    if abs(slope_h) < 0.01 and slope_l > 0.01:
        patron = "TRIANGULO_ASCENDENTE"
        tipo   = "BULLISH"
        objetivo = nivel_h + altura
    elif slope_h < -0.01 and abs(slope_l) < 0.01:
        patron = "TRIANGULO_DESCENDENTE"
        tipo   = "BEARISH"
        objetivo = nivel_l - altura
    else:
        patron = "TRIANGULO_SIMETRICO"
        tipo   = "NEUTRAL"
        objetivo = apex + altura if price > apex else apex - altura

    conf = 55 + abs(slope_h - slope_l) * 100
    conf = min(conf, 80)

    return {
        "detectado":  True,
        "patron":     patron,
        "tipo":       tipo,
        "confianza":  round(conf, 1),
        "completado": True,
        "confirmado": False,
        "resistencia": round(nivel_h, 8),
        "soporte":    round(nivel_l, 8),
        "objetivo":   round(objetivo, 8),
        "stop":       round(apex * (0.97 if tipo == "BULLISH" else 1.03), 8),
        "fib_618":    round(apex + altura * 0.618 * (1 if tipo != "BEARISH" else -1), 8),
        "narrativa":  [f"📐 {patron} — convergencia detectada"]
    }


def detectar_cuna_pro(df: pd.DataFrame, ph: list, pl: list) -> dict:
    """Cuña con confirmación de volumen decreciente."""
    if len(ph) < 3 or len(pl) < 3:
        return {"detectado": False}

    h_precios = [p["precio"] for p in ph[-4:]]
    l_precios  = [p["precio"] for p in pl[-4:]]
    h_vols    = [p["vol"]    for p in ph[-4:]]

    if len(h_precios) < 2:
        return {"detectado": False}

    slope_h = (h_precios[-1] - h_precios[0]) / max(h_precios[0], 1e-10)
    slope_l  = (l_precios[-1]  - l_precios[0])  / max(l_precios[0],  1e-10)

    price  = float(df["close"].iloc[-1])
    nivel_h = h_precios[-1]
    nivel_l  = l_precios[-1]
    altura   = nivel_h - nivel_l

    # Volumen decreciente en la cuña = más confiable
    vol_decrec = len(h_vols) >= 2 and h_vols[-1] < h_vols[0]

    # Cuña alcista (ambas suben, la inf más)
    if slope_h > 0.01 and slope_l > 0.01 and slope_l > slope_h * 1.3:
        conf = 60 + (20 if vol_decrec else 0)
        objetivo = nivel_l - altura
        return {
            "detectado":  True,
            "patron":     "CUNA_ALCISTA",
            "tipo":       "BEARISH",
            "confianza":  round(min(conf,100), 1),
            "completado": True,
            "confirmado": False,
            "resistencia": round(nivel_h, 8),
            "soporte":    round(nivel_l, 8),
            "objetivo":   round(objetivo, 8),
            "stop":       round(nivel_h * 1.02, 8),
            "fib_618":    round(nivel_l - altura * 0.618, 8),
            "narrativa":  [
                f"⚠️ Cuna alcista = distribucion posible",
                f"{'✅ Volumen decreciente confirma' if vol_decrec else ''}",
            ]
        }

    # Cuña bajista (ambas bajan, la sup menos)
    if slope_h < -0.01 and slope_l < -0.01 and abs(slope_h) < abs(slope_l) * 0.8:
        conf = 60 + (20 if vol_decrec else 0)
        objetivo = nivel_h + altura
        return {
            "detectado":  True,
            "patron":     "CUNA_BAJISTA",
            "tipo":       "BULLISH",
            "confianza":  round(min(conf,100), 1),
            "completado": True,
            "confirmado": False,
            "resistencia": round(nivel_h, 8),
            "soporte":    round(nivel_l, 8),
            "objetivo":   round(objetivo, 8),
            "stop":       round(nivel_l * 0.98, 8),
            "fib_618":    round(nivel_h + altura * 0.618, 8),
            "narrativa":  [
                f"✅ Cuna bajista = acumulacion posible",
                f"{'✅ Volumen decreciente confirma' if vol_decrec else ''}",
            ]
        }

    return {"detectado": False}


# ══════════════════════════════════════════════════════════
# VELAS JAPONESAS SIGNIFICATIVAS
# ══════════════════════════════════════════════════════════
def detectar_velas(df: pd.DataFrame) -> dict:
    """
    Detecta velas japonesas significativas en las últimas 3 velas.
    """
    if len(df) < 5:
        return {"tipo": "NINGUNA", "señal": "NEUTRAL"}

    last  = df.iloc[-1]
    prev  = df.iloc[-2]
    prev2 = df.iloc[-3]

    o, h, l, c = float(last["open"]), float(last["high"]), \
                  float(last["low"]),  float(last["close"])
    body  = abs(c - o)
    rng   = max(h - l, 1e-10)
    upper = h - max(c, o)
    lower = min(c, o) - l

    o2, h2, l2, c2 = float(prev["open"]), float(prev["high"]), \
                      float(prev["low"]),  float(prev["close"])

    # Doji — indecisión
    if body / rng < 0.1:
        return {"tipo": "DOJI", "señal": "NEUTRAL",
                "desc": "Doji — indecision, posible reversal"}

    # Hammer (martillo) — bullish
    if lower > body * 2 and upper < body * 0.5 and c > o:
        return {"tipo": "HAMMER", "señal": "BULLISH",
                "desc": "Martillo — rebote alcista probable"}

    # Shooting Star — bearish
    if upper > body * 2 and lower < body * 0.5 and c < o:
        return {"tipo": "SHOOTING_STAR", "señal": "BEARISH",
                "desc": "Shooting Star — reversal bajista probable"}

    # Engulfing alcista
    if c > o and c2 < o2 and c > o2 and o < c2:
        return {"tipo": "BULLISH_ENGULFING", "señal": "BULLISH",
                "desc": "Engulfing alcista — compradores tomaron control"}

    # Engulfing bajista
    if c < o and c2 > o2 and c < o2 and o > c2:
        return {"tipo": "BEARISH_ENGULFING", "señal": "BEARISH",
                "desc": "Engulfing bajista — vendedores tomaron control"}

    # Marubozu alcista — vela fuerte sin mechas
    if c > o and upper < body * 0.05 and lower < body * 0.05:
        return {"tipo": "MARUBOZU_BULL", "señal": "BULLISH",
                "desc": "Marubozu alcista — momentum fuerte"}

    # Marubozu bajista
    if c < o and upper < body * 0.05 and lower < body * 0.05:
        return {"tipo": "MARUBOZU_BEAR", "señal": "BEARISH",
                "desc": "Marubozu bajista — momentum bajista fuerte"}

    # Spinning Top — indecisión con cuerpo pequeño
    if body / rng < 0.3 and upper > body and lower > body:
        return {"tipo": "SPINNING_TOP", "señal": "NEUTRAL",
                "desc": "Spinning Top — indecision"}

    return {"tipo": "NORMAL", "señal": "NEUTRAL", "desc": ""}


# ══════════════════════════════════════════════════════════
# DIVERGENCIAS RSI
# ══════════════════════════════════════════════════════════
def _volumen_relativo_en(df: pd.DataFrame, idx_pos: int, vol_ma_len: int = 20) -> float:
    """Volumen de la vela idx_pos / su propia media móvil de volumen previa."""
    lo = max(0, idx_pos - vol_ma_len)
    ventana = df["volume"].iloc[lo:idx_pos]
    vol_ma = float(ventana.mean()) if len(ventana) else float(df["volume"].iloc[idx_pos])
    if vol_ma <= 0:
        return 1.0
    return float(df["volume"].iloc[idx_pos]) / vol_ma


def _rechazo_en_vela(df: pd.DataFrame, idx_pos: int) -> bool:
    """Pin bar / mecha de rechazo: mecha > 1.5x el cuerpo."""
    o, h, l, c = (float(df[col].iloc[idx_pos]) for col in ("open", "high", "low", "close"))
    rango = h - l
    if rango <= 0:
        return False
    cuerpo = abs(c - o)
    mecha_sup = h - max(o, c)
    mecha_inf = min(o, c) - l
    return mecha_sup > cuerpo * 1.5 or mecha_inf > cuerpo * 1.5


def detectar_divergencias(df: pd.DataFrame, n: int = 14,
                           ema_rapida: int = 9, ema_lenta: int = 21) -> dict:
    """
    Divergencias precio/volumen/momentum, con RSI como confirmación adicional.

    Lógica:
      1. Toma los 2 últimos swings (highs para divergencia bajista,
         lows para divergencia alcista) desde `ph`/`pl` estilo pivote simple.
      2. Compara volumen relativo de cada swing (¿el nuevo extremo trae
         más o menos volumen que el anterior?).
      3. Compara la pendiente de la EMA rápida (9) entre ambos swings
         (¿el momentum viene más débil?).
      4. Divergencia = precio hace un extremo nuevo pero volumen y/o
         momentum vienen más débiles. Confirma con RSI + vela de rechazo.
    """
    n_min = max(n * 3, ema_lenta + 5, 30)
    if len(df) < n_min:
        return {"bull": False, "bear": False, "tipo": "NINGUNA", "desc": "",
                "confianza": 0, "vol_confirma": False, "ema_confirma": False,
                "vela_confirma": False}

    close = df["close"]
    high  = df["high"]
    low   = df["low"]

    # ── RSI (para confirmación adicional, igual que antes) ──
    delta = close.diff()
    up    = delta.clip(lower=0).ewm(com=n-1, adjust=False).mean()
    dn    = (-delta.clip(upper=0)).ewm(com=n-1, adjust=False).mean()
    rsi   = 100 - 100 / (1 + up / dn.replace(0, 1e-10))

    # ── EMA rápida y su pendiente ────────────────────────────
    ema_r = close.ewm(span=ema_rapida, adjust=False).mean()

    def slope_en(idx_pos: int, periodos: int = 3) -> float:
        j = max(0, idx_pos - periodos)
        prev = float(ema_r.iloc[j])
        if prev == 0:
            return 0.0
        return (float(ema_r.iloc[idx_pos]) - prev) / prev * 100

    # ── Swings simples (pivote de `n` velas a cada lado) ─────
    swing_highs, swing_lows = [], []
    lb = n // 2 or 3
    for i in range(lb, len(df) - lb):
        if high.iloc[i] == high.iloc[i-lb:i+lb+1].max():
            swing_highs.append(i)
        if low.iloc[i] == low.iloc[i-lb:i+lb+1].min():
            swing_lows.append(i)

    resultado = {"bull": False, "bear": False, "tipo": "NINGUNA", "desc": "",
                 "confianza": 0, "vol_confirma": False, "ema_confirma": False,
                 "vela_confirma": False}

    # ── Divergencia BAJISTA: precio HH, volumen/momentum LH ──
    if len(swing_highs) >= 2:
        i_prev, i_curr = swing_highs[-2], swing_highs[-1]
        p_prev, p_curr = float(close.iloc[i_prev]), float(close.iloc[i_curr])
        if p_curr > p_prev:
            vol_prev = _volumen_relativo_en(df, i_prev)
            vol_curr = _volumen_relativo_en(df, i_curr)
            vol_debil = vol_curr < vol_prev
            ema_debil = slope_en(i_curr) < slope_en(i_prev)
            rsi_debil = float(rsi.iloc[i_curr]) < float(rsi.iloc[i_prev])

            if vol_debil or ema_debil or rsi_debil:
                vela_conf = _rechazo_en_vela(df, i_curr)
                conf = 30 + (25 if vol_debil else 0) + (25 if ema_debil else 0) \
                       + (10 if rsi_debil else 0) + (10 if vela_conf else 0)
                resultado.update(
                    bear=True, tipo="DIV_BAJISTA_REGULAR",
                    confianza=round(min(conf, 100), 1),
                    vol_confirma=vol_debil, ema_confirma=ema_debil,
                    vela_confirma=vela_conf,
                    desc=(f"Divergencia bajista — nuevo máximo en {p_curr:.4f} vs "
                          f"{p_prev:.4f} previo, con "
                          f"{'volumen' if vol_debil else ''}"
                          f"{' y ' if vol_debil and ema_debil else ''}"
                          f"{'momentum EMA9' if ema_debil else ''} más débil"
                          f"{' + rechazo en vela' if vela_conf else ''}"),
                )

    # ── Divergencia ALCISTA: precio LL, volumen/momentum HL ──
    if resultado["tipo"] == "NINGUNA" and len(swing_lows) >= 2:
        i_prev, i_curr = swing_lows[-2], swing_lows[-1]
        p_prev, p_curr = float(close.iloc[i_prev]), float(close.iloc[i_curr])
        if p_curr < p_prev:
            vol_prev = _volumen_relativo_en(df, i_prev)
            vol_curr = _volumen_relativo_en(df, i_curr)
            vol_debil = vol_curr < vol_prev
            # Pendiente menos negativa = perdiendo fuerza bajista
            ema_debil = slope_en(i_curr) > slope_en(i_prev)
            rsi_debil = float(rsi.iloc[i_curr]) > float(rsi.iloc[i_prev])

            if vol_debil or ema_debil or rsi_debil:
                vela_conf = _rechazo_en_vela(df, i_curr)
                conf = 30 + (25 if vol_debil else 0) + (25 if ema_debil else 0) \
                       + (10 if rsi_debil else 0) + (10 if vela_conf else 0)
                resultado.update(
                    bull=True, tipo="DIV_ALCISTA_REGULAR",
                    confianza=round(min(conf, 100), 1),
                    vol_confirma=vol_debil, ema_confirma=ema_debil,
                    vela_confirma=vela_conf,
                    desc=(f"Divergencia alcista — nuevo mínimo en {p_curr:.4f} vs "
                          f"{p_prev:.4f} previo, con "
                          f"{'volumen' if vol_debil else ''}"
                          f"{' y ' if vol_debil and ema_debil else ''}"
                          f"{'momentum EMA9' if ema_debil else ''} más débil"
                          f"{' + rechazo en vela' if vela_conf else ''}"),
                )

    return resultado


# ══════════════════════════════════════════════════════════
# CANAL DE TENDENCIA
# ══════════════════════════════════════════════════════════
def detectar_canal(df: pd.DataFrame, ph: list, pl: list) -> dict:
    """Detecta canal de tendencia y posición del precio."""
    if len(ph) < 2 or len(pl) < 2:
        return {"tipo": "NINGUNO"}

    price = float(df["close"].iloc[-1])

    h_last2 = ph[-2:]
    l_last2  = pl[-2:]

    slope_h = (h_last2[-1]["precio"] - h_last2[0]["precio"]) / \
              max(h_last2[0]["precio"], 1e-10)
    slope_l  = (l_last2[-1]["precio"]  - l_last2[0]["precio"])  / \
               max(l_last2[0]["precio"],  1e-10)

    canal_h = h_last2[-1]["precio"]
    canal_l  = l_last2[-1]["precio"]
    rango   = canal_h - canal_l

    # Tipo de canal
    if slope_h > 0.02 and slope_l > 0.02:
        tipo = "ALCISTA"
    elif slope_h < -0.02 and slope_l < -0.02:
        tipo = "BAJISTA"
    else:
        tipo = "LATERAL"

    # Posición del precio en el canal
    pos_pct = (price - canal_l) / max(rango, 1e-10) * 100
    en_techo = pos_pct > 75
    en_suelo = pos_pct < 25

    return {
        "tipo":    tipo,
        "sup":     round(canal_h, 8),
        "inf":     round(canal_l, 8),
        "rango":   round(rango, 8),
        "pos_pct": round(pos_pct, 1),
        "en_techo": en_techo,
        "en_suelo": en_suelo,
        "slope_h":  round(slope_h * 100, 3),
        "slope_l":  round(slope_l  * 100, 3),
    }


# ══════════════════════════════════════════════════════════
# FUNCIÓN PRINCIPAL
# ══════════════════════════════════════════════════════════
def analizar_fractales_pro(df: pd.DataFrame,
                            n_pivotes: int = 3) -> FractalResult:
    """
    Análisis fractal completo con todos los patrones.
    Retorna el patrón más relevante + contexto completo.
    """
    fr = FractalResult()
    if df is None or len(df) < 50:
        return fr

    price = float(df["close"].iloc[-1])

    # ── 1. Pivotes con volumen ────────────────────────────
    ph, pl = calc_pivotes_vol(df, n=n_pivotes)

    # ── 2. Detectar todos los patrones ───────────────────
    candidatos = []

    for detector in [
        lambda: detectar_hch_pro(df, ph, pl),
        lambda: detectar_hch_inv_pro(df, ph, pl),
        lambda: detectar_doble_techo_pro(df, ph),
        lambda: detectar_doble_suelo_pro(df, pl),
        lambda: detectar_triangulo(df, ph, pl),
        lambda: detectar_cuna_pro(df, ph, pl),
    ]:
        try:
            result = detector()
            if result.get("detectado"):
                candidatos.append(result)
        except Exception as e:
            log.debug(f"Fractal detector error: {e}")

    # ── 3. Elegir el mejor patrón ─────────────────────────
    if candidatos:
        # Priorizar por confianza y si está confirmado
        mejor = max(candidatos, key=lambda x:
            x.get("confianza", 0) + (20 if x.get("confirmado") else 0))

        fr.patron      = mejor.get("patron", "NINGUNO")
        fr.tipo        = mejor.get("tipo", "NEUTRAL")
        fr.confianza   = mejor.get("confianza", 0)
        fr.completado  = mejor.get("completado", False)
        fr.confirmado  = mejor.get("confirmado", False)
        fr.neckline    = mejor.get("neckline", 0)
        fr.soporte     = mejor.get("soporte", 0)
        fr.resistencia = mejor.get("resistencia", 0)
        fr.objetivo    = mejor.get("objetivo", 0)
        fr.stop        = mejor.get("stop", 0)
        fr.fib_618     = mejor.get("fib_618", 0)
        fr.fib_e127    = mejor.get("fib_e127", 0)
        fr.narrativa   = mejor.get("narrativa", [])
        fr.en_gp       = abs(price - fr.fib_618) / max(price, 1e-10) < 0.025

    # ── 4. Velas significativas ───────────────────────────
    vela = detectar_velas(df)
    fr.vela_tipo  = vela.get("tipo", "NINGUNA")
    fr.vela_señal = vela.get("señal", "NEUTRAL")
    if vela.get("desc"):
        fr.narrativa.append(f"🕯️ {vela['desc']}")

    # ── 5. Divergencias (precio/volumen/EMA, confirmadas por RSI+vela) ──
    div = detectar_divergencias(df)
    fr.div_rsi_bull       = div.get("bull", False)
    fr.div_rsi_bear       = div.get("bear", False)
    fr.div_tipo           = div.get("tipo", "NINGUNA")
    fr.div_desc           = div.get("desc", "")
    fr.div_confianza      = div.get("confianza", 0)
    fr.div_vol_confirma   = div.get("vol_confirma", False)
    fr.div_ema_confirma   = div.get("ema_confirma", False)
    fr.div_vela_confirma  = div.get("vela_confirma", False)
    if div.get("desc"):
        fr.narrativa.append(f"📊 {div['desc']}")

    # ── 6. Canal ──────────────────────────────────────────
    canal = detectar_canal(df, ph, pl)
    fr.canal_tipo = canal.get("tipo", "NINGUNO")
    fr.canal_sup  = canal.get("sup", 0)
    fr.canal_inf  = canal.get("inf", 0)
    fr.en_techo   = canal.get("en_techo", False)
    fr.en_suelo   = canal.get("en_suelo", False)

    if fr.en_techo and fr.canal_tipo == "ALCISTA":
        fr.narrativa.append(f"⚠️ Precio en techo del canal alcista — posible retroceso")
    elif fr.en_suelo and fr.canal_tipo == "BAJISTA":
        fr.narrativa.append(f"⚠️ Precio en suelo del canal bajista — posible rebote")

    # ── 7. Score final del fractal ────────────────────────
    score = 0.0
    if fr.patron != "NINGUNO":
        score += fr.confianza * 0.5
    if fr.confirmado:
        score += 20
    if fr.en_gp:
        score += 15
    if fr.div_rsi_bull or fr.div_rsi_bear:
        score += 5 + (fr.div_confianza / 100) * 10  # hasta +15 si viene muy confirmada
    if fr.vela_señal != "NEUTRAL":
        score += 5

    fr.score = round(min(score, 100), 1)

    log.info(f"✅ Fractal Pro: {fr.patron} ({fr.tipo}) "
             f"conf={fr.confianza}% score={fr.score}")

    return fr
