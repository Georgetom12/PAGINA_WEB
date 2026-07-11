"""
PSY MOTOR — CURSOR 2: NÚCLEO DE ANÁLISIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Procesa el libro de datos y genera análisis matemático puro:
  - Pivotes matemáticos multi-TF
  - Detección de fractales (HCH, Doble T/S, Cuñas, Canales)
  - Canal de regresión lineal
  - VWAP institucional
  - Fibonacci por fractal detectado
  - RSI/ADX/CVD en cascada
  - POC real (Money Flow Profile)
  - Zonas de confluencia
  - Score de agotamiento
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import Optional
import logging

log = logging.getLogger(__name__)

try:
    from motor.fractal_pro import analizar_fractales_pro, FractalResult
    FRACTAL_PRO = True
except ImportError:
    FRACTAL_PRO = False


# ══════════════════════════════════════════════════════════
# DATACLASS — RESULTADO DEL NÚCLEO
# ══════════════════════════════════════════════════════════
@dataclass
class NucleoResult:
    symbol:    str = ""
    timeframe: str = ""
    price:     float = 0.0

    # ── Pivotes ──────────────────────────────────────────
    pivotes_high: list = field(default_factory=list)  # [(precio, idx)]
    pivotes_low:  list = field(default_factory=list)

    # ── Fractal detectado ─────────────────────────────────
    fractal_tipo:       str   = "NINGUNO"  # HCH|HCH_INV|DOBLE_T|DOBLE_S|CUNA_ALCISTA|CUNA_BAJISTA|CANAL
    fractal_completado: bool  = False
    fractal_neckline:   float = 0.0
    fractal_objetivo:   float = 0.0
    fractal_confianza:  float = 0.0

    # ── Fibonacci del fractal ─────────────────────────────
    fib_origen:  float = 0.0
    fib_destino: float = 0.0
    fib_618:     float = 0.0  # zona óptima de entrada
    fib_382:     float = 0.0
    fib_236:     float = 0.0
    fib_786:     float = 0.0
    fib_e127:    float = 0.0  # extensión 127.2%
    fib_e161:    float = 0.0  # extensión 161.8%
    en_zona_618: bool  = False

    # ── Canal de regresión ────────────────────────────────
    regresion_superior: float = 0.0
    regresion_inferior: float = 0.0
    regresion_media:    float = 0.0
    regresion_slope:    float = 0.0  # pendiente
    precio_en_canal:    str   = "MEDIO"  # SUPERIOR|INFERIOR|MEDIO|FUERA

    # ── VWAP ─────────────────────────────────────────────
    vwap:        float = 0.0
    precio_vwap: str   = "SOBRE"  # SOBRE|BAJO

    # ── RSI cascada ───────────────────────────────────────
    rsi_map:    dict = field(default_factory=dict)  # {tf: rsi}
    rsi_energy: float = 0.0  # vaso de agua
    rsi_agotado: bool = False

    # ── ADX cascada ───────────────────────────────────────
    adx_map:    dict = field(default_factory=dict)
    adx_maduro: bool = False  # ADX > 40 en macro

    # ── CVD cascada ───────────────────────────────────────
    cvd_map:    dict = field(default_factory=dict)
    cvd_cascade_bull: bool = False
    cvd_cascade_bear: bool = False

    # ── POC cascada ───────────────────────────────────────
    poc_map:    dict = field(default_factory=dict)  # {tf: poc_price}
    pocs_abajo: int   = 0  # imanes abajo
    pocs_arriba: int  = 0

    # ── Bollinger ─────────────────────────────────────────
    bb_upper:   float = 0.0
    bb_lower:   float = 0.0
    bb_squeeze: bool  = False
    precio_bb:  str   = "MEDIO"

    # ── Zonas de confluencia ──────────────────────────────
    zonas_clave: list = field(default_factory=list)

    # ── Fractal Pro ───────────────────────────────────────
    fractal_pro_patron: str   = "NINGUNO"
    fractal_pro_tipo:   str   = "NEUTRAL"
    fractal_pro_conf:   float = 0.0
    fractal_pro_obj:    float = 0.0
    fractal_pro_stop:   float = 0.0
    fractal_pro_fib618: float = 0.0
    fractal_pro_score:  float = 0.0
    fractal_pro_narrativa: list = field(default_factory=list)
    vela_tipo:          str   = "NINGUNA"
    vela_señal:         str   = "NEUTRAL"
    div_rsi_bull:       bool  = False
    div_rsi_bear:       bool  = False
    div_tipo:           str   = "NINGUNA"
    canal_tipo:         str   = "NINGUNO"
    en_techo:           bool  = False
    en_suelo:           bool  = False  # [(precio, tipo, score)]
    zona_optima_long:  float = 0.0
    zona_optima_short: float = 0.0
    zona_score:        float = 0.0

    # ── Score de agotamiento ──────────────────────────────
    agotamiento_score: float = 0.0  # 0-100
    agotamiento_dir:   str   = "NINGUNO"  # ALCISTA|BAJISTA

    # ── Dirección del núcleo ──────────────────────────────
    direccion_macro: str   = "NEUTRAL"
    direccion_micro: str   = "NEUTRAL"
    confianza:       float = 0.0


# ══════════════════════════════════════════════════════════
# PIVOTES MATEMÁTICOS
# ══════════════════════════════════════════════════════════
def calc_pivotes(df: pd.DataFrame, n: int = 5) -> tuple[list, list]:
    """
    Detecta pivotes matemáticos (swing highs/lows).
    n = número de velas a cada lado para confirmar el pivote.
    """
    high  = df["high"].values
    low   = df["low"].values
    price = float(df["close"].iloc[-1])

    pivotes_h = []
    pivotes_l = []

    for i in range(n, len(df) - n):
        # Swing High: máximo de las últimas n velas a cada lado
        if all(high[i] > high[i-j] for j in range(1, n+1)) and \
           all(high[i] > high[i+j] for j in range(1, n+1)):
            pivotes_h.append((float(high[i]), i))

        # Swing Low: mínimo
        if all(low[i] < low[i-j] for j in range(1, n+1)) and \
           all(low[i] < low[i+j] for j in range(1, n+1)):
            pivotes_l.append((float(low[i]), i))

    return pivotes_h[-10:], pivotes_l[-10:]  # Últimos 10


# ══════════════════════════════════════════════════════════
# DETECCIÓN DE FRACTALES
# ══════════════════════════════════════════════════════════
def detectar_hch(pivotes_h: list, pivotes_l: list,
                 tolerancia: float = 0.03) -> dict:
    """
    Detecta patrón Hombro-Cabeza-Hombro.
    Necesita 3 pivotes altos donde el central es mayor.
    """
    if len(pivotes_h) < 3:
        return {"detectado": False}

    # Tomar los últimos 3 pivotes altos
    for i in range(len(pivotes_h) - 3, -1, -1):
        h1_p, h1_i = pivotes_h[i]
        h2_p, h2_i = pivotes_h[i+1]
        h3_p, h3_i = pivotes_h[i+2]

        # Cabeza debe ser mayor que hombros
        if h2_p <= h1_p or h2_p <= h3_p:
            continue

        # Hombros deben ser similares (dentro de tolerancia)
        diff = abs(h1_p - h3_p) / max(h1_p, h3_p)
        if diff > tolerancia * 2:
            continue

        # Neckline = promedio de los valles entre hombros
        valles_entre = [l for l, li in pivotes_l
                       if h1_i < li < h3_i]
        if len(valles_entre) < 1:
            continue

        neckline = sum(valles_entre) / len(valles_entre)

        # Objetivo = neckline - altura del patrón
        altura = h2_p - neckline
        objetivo = neckline - altura

        # Confianza basada en simetría
        simetria = 1 - diff
        confianza = simetria * 0.8 + 0.2

        return {
            "detectado":  True,
            "tipo":       "HCH",
            "hombro_izq": h1_p,
            "cabeza":     h2_p,
            "hombro_der": h3_p,
            "neckline":   round(neckline, 8),
            "objetivo":   round(objetivo, 8),
            "confianza":  round(confianza, 2),
        }

    return {"detectado": False}


def detectar_hch_invertido(pivotes_h: list, pivotes_l: list,
                            tolerancia: float = 0.03) -> dict:
    """Detecta HCH Invertido (bullish reversal)."""
    if len(pivotes_l) < 3:
        return {"detectado": False}

    for i in range(len(pivotes_l) - 3, -1, -1):
        l1_p, l1_i = pivotes_l[i]
        l2_p, l2_i = pivotes_l[i+1]
        l3_p, l3_i = pivotes_l[i+2]

        if l2_p >= l1_p or l2_p >= l3_p:
            continue

        diff = abs(l1_p - l3_p) / max(l1_p, l3_p)
        if diff > tolerancia * 2:
            continue

        picos_entre = [h for h, hi in pivotes_h if l1_i < hi < l3_i]
        if not picos_entre:
            continue

        neckline = sum(picos_entre) / len(picos_entre)
        altura   = neckline - l2_p
        objetivo = neckline + altura

        return {
            "detectado": True,
            "tipo":      "HCH_INV",
            "neckline":  round(neckline, 8),
            "objetivo":  round(objetivo, 8),
            "confianza": round(1 - diff, 2),
        }

    return {"detectado": False}


def detectar_doble_techo(pivotes_h: list, tolerancia: float = 0.02) -> dict:
    """Detecta Doble Techo (bearish)."""
    if len(pivotes_h) < 2:
        return {"detectado": False}

    p1, i1 = pivotes_h[-2]
    p2, i2 = pivotes_h[-1]

    diff = abs(p1 - p2) / max(p1, p2)
    if diff > tolerancia:
        return {"detectado": False}

    objetivo = min(p1, p2) - abs(p1 - p2) * 3

    return {
        "detectado": True,
        "tipo":      "DOBLE_TECHO",
        "nivel":     round((p1 + p2) / 2, 8),
        "objetivo":  round(objetivo, 8),
        "confianza": round(1 - diff / tolerancia, 2),
    }


def detectar_doble_suelo(pivotes_l: list, tolerancia: float = 0.02) -> dict:
    """Detecta Doble Suelo (bullish)."""
    if len(pivotes_l) < 2:
        return {"detectado": False}

    p1, i1 = pivotes_l[-2]
    p2, i2 = pivotes_l[-1]

    diff = abs(p1 - p2) / max(p1, p2)
    if diff > tolerancia:
        return {"detectado": False}

    objetivo = max(p1, p2) + abs(p1 - p2) * 3

    return {
        "detectado": True,
        "tipo":      "DOBLE_SUELO",
        "nivel":     round((p1 + p2) / 2, 8),
        "objetivo":  round(objetivo, 8),
        "confianza": round(1 - diff / tolerancia, 2),
    }


def detectar_cuna(pivotes_h: list, pivotes_l: list) -> dict:
    """Detecta Cuña (convergencia de máximos y mínimos)."""
    if len(pivotes_h) < 3 or len(pivotes_l) < 3:
        return {"detectado": False}

    # Pendiente de máximos
    h_prices = [p for p, i in pivotes_h[-3:]]
    l_prices  = [p for p, i in pivotes_l[-3:]]

    slope_h = (h_prices[-1] - h_prices[0]) / max(h_prices[0], 1e-10)
    slope_l  = (l_prices[-1] - l_prices[0]) / max(l_prices[0], 1e-10)

    # Cuña alcista: ambas líneas suben pero la inferior más rápido
    if slope_h > 0 and slope_l > 0 and slope_l > slope_h * 1.2:
        return {
            "detectado": True,
            "tipo":      "CUNA_ALCISTA",
            "bias":      "BEARISH",  # cuña alcista = distribución
            "confianza": 0.65,
        }

    # Cuña bajista: ambas líneas bajan pero la superior menos
    if slope_h < 0 and slope_l < 0 and abs(slope_h) < abs(slope_l) * 0.8:
        return {
            "detectado": True,
            "tipo":      "CUNA_BAJISTA",
            "bias":      "BULLISH",
            "confianza": 0.65,
        }

    return {"detectado": False}


# ══════════════════════════════════════════════════════════
# FIBONACCI DEL FRACTAL
# ══════════════════════════════════════════════════════════
def calc_fib_fractal(origen: float, destino: float) -> dict:
    """
    Calcula niveles Fibonacci entre origen y destino del fractal.
    origen  = punto de partida del movimiento
    destino = punto final del movimiento
    """
    rng = abs(destino - origen)
    direccion = "UP" if destino > origen else "DOWN"

    if direccion == "UP":
        # Retrocesos (desde destino hacia origen)
        f236 = destino - rng * 0.236
        f382 = destino - rng * 0.382
        f50  = destino - rng * 0.500
        f618 = destino - rng * 0.618
        f786 = destino - rng * 0.786
        f886 = destino - rng * 0.886
        # Extensiones (más allá del destino)
        e127 = destino + rng * 0.272
        e161 = destino + rng * 0.618
    else:
        # Retrocesos
        f236 = destino + rng * 0.236
        f382 = destino + rng * 0.382
        f50  = destino + rng * 0.500
        f618 = destino + rng * 0.618
        f786 = destino + rng * 0.786
        f886 = destino + rng * 0.886
        # Extensiones
        e127 = destino - rng * 0.272
        e161 = destino - rng * 0.618

    return {
        "origen":   round(origen, 8),
        "destino":  round(destino, 8),
        "rango":    round(rng, 8),
        "dir":      direccion,
        "f236":     round(f236, 8),
        "f382":     round(f382, 8),
        "f50":      round(f50,  8),
        "f618":     round(f618, 8),  # Golden Pocket inicio
        "f786":     round(f786, 8),  # Golden Pocket fin
        "f886":     round(f886, 8),
        "e127":     round(e127, 8),
        "e161":     round(e161, 8),
    }


# ══════════════════════════════════════════════════════════
# CANAL DE REGRESIÓN LINEAL
# ══════════════════════════════════════════════════════════
def calc_regresion_lineal(df: pd.DataFrame,
                           lookback: int = 100) -> dict:
    """Canal de regresión lineal."""
    tail  = df.tail(lookback)
    close = tail["close"].values
    x     = np.arange(len(close))

    # Regresión lineal
    coeffs = np.polyfit(x, close, 1)
    slope  = coeffs[0]
    intercept = coeffs[1]

    # Línea de regresión
    y_pred = np.polyval(coeffs, x)
    residuals = close - y_pred
    std = np.std(residuals)

    # Canal ±2 desviaciones estándar
    precio = float(close[-1])
    y_actual = float(y_pred[-1])
    superior  = y_actual + 2 * std
    inferior  = y_actual - 2 * std

    if precio > superior * 0.98:
        pos = "SUPERIOR"
    elif precio < inferior * 1.02:
        pos = "INFERIOR"
    else:
        pos = "MEDIO"

    return {
        "media":     round(y_actual, 8),
        "superior":  round(superior, 8),
        "inferior":  round(inferior, 8),
        "slope":     round(slope, 8),
        "slope_pct": round(slope / max(y_actual, 1e-10) * 100, 4),
        "posicion":  pos,
        "std":       round(std, 8),
    }


# ══════════════════════════════════════════════════════════
# VWAP
# ══════════════════════════════════════════════════════════
def calc_vwap(df: pd.DataFrame) -> float:
    """VWAP del período completo."""
    hlc3 = (df["high"] + df["low"] + df["close"]) / 3
    vwap = (hlc3 * df["volume"]).sum() / df["volume"].sum()
    return round(float(vwap), 8)


# ══════════════════════════════════════════════════════════
# BOLLINGER BANDS
# ══════════════════════════════════════════════════════════
def calc_bb(df: pd.DataFrame, n: int = 20, std: float = 2.0) -> dict:
    sma   = df["close"].rolling(n).mean()
    sigma = df["close"].rolling(n).std()
    upper = sma + std * sigma
    lower = sma - std * sigma
    price = float(df["close"].iloc[-1])
    u = float(upper.iloc[-1])
    l = float(lower.iloc[-1])
    width = (u - l) / max(float(sma.iloc[-1]), 1e-10) * 100

    pos = "SUPERIOR" if price >= u * 0.99 else \
          "INFERIOR" if price <= l * 1.01 else "MEDIO"

    return {"upper": round(u,8), "lower": round(l,8),
            "mid": round(float(sma.iloc[-1]),8),
            "width": round(width,2), "pos": pos,
            "squeeze": width < 3.0}


# ══════════════════════════════════════════════════════════
# RSI + ADX + CVD
# ══════════════════════════════════════════════════════════
def _rsi(close: pd.Series, n: int = 14) -> float:
    d = close.diff()
    u = d.clip(lower=0).ewm(com=n-1, adjust=False).mean()
    v = (-d.clip(upper=0)).ewm(com=n-1, adjust=False).mean()
    rs = u / v.replace(0, 1e-10)
    return round(float((100 - 100/(1+rs)).iloc[-1]), 2)

def _adx(df: pd.DataFrame, n: int = 14) -> dict:
    h, l, c = df["high"], df["low"], df["close"]
    tr  = pd.concat([h-l, (h-c.shift()).abs(), (l-c.shift()).abs()], axis=1).max(axis=1)
    dmp = (h.diff().clip(lower=0)).where(h.diff() > -l.diff(), 0)
    dmm = (-l.diff().clip(upper=0)).where(-l.diff() > h.diff(), 0)
    atr = tr.ewm(span=n, adjust=False).mean()
    dip = 100 * dmp.ewm(span=n, adjust=False).mean() / atr.replace(0,1e-10)
    dim = 100 * dmm.ewm(span=n, adjust=False).mean() / atr.replace(0,1e-10)
    dx  = 100 * (dip-dim).abs() / (dip+dim).replace(0,1e-10)
    adx = dx.ewm(span=n, adjust=False).mean()
    return {"adx": round(float(adx.iloc[-1]),2),
            "dip": round(float(dip.iloc[-1]),2),
            "dim": round(float(dim.iloc[-1]),2)}

def _cvd(df: pd.DataFrame, n: int = 20) -> float:
    buy  = ((df["close"]-df["low"])/(df["high"]-df["low"]).clip(lower=1e-10)*df["volume"]).rolling(n).mean()
    sell = ((df["high"]-df["close"])/(df["high"]-df["low"]).clip(lower=1e-10)*df["volume"]).rolling(n).mean()
    total = buy + sell
    delta = (buy - sell) / total.replace(0,1e-10) * 100
    return round(float(delta.iloc[-1]), 2)


# ══════════════════════════════════════════════════════════
# POC REAL (Money Flow Profile)
# ══════════════════════════════════════════════════════════
# ══════════════════════════════════════════════════════════
# PSY DEPTH CALCULATOR — PORTADO EXACTO DEL PINE SCRIPT
# macro_high = ta.highest(high, 300)
# macro_low  = ta.lowest(low, 300)
# ph = ta.pivothigh(high, left=10, right=10)
# pl = ta.pivotlow(low, left=10, right=10)
# ══════════════════════════════════════════════════════════

def psy_depth_fibonacci(df: pd.DataFrame,
                         lookback_macro: int = 300,
                         pivot_left: int = 10,
                         pivot_right: int = 10) -> dict:
    """
    Portado EXACTO del PSY DEPTH CALCULATOR v1.2.
    Mismo algoritmo que TradingView — mismos niveles y confluence score.
    """
    if df is None or len(df) < pivot_left + pivot_right + 10:
        return {}

    high  = df["high"].values
    low   = df["low"].values
    close = df["close"].values

    # ── MACRO: ta.highest/lowest ───────────────────────────
    lb = min(lookback_macro, len(df))
    macro_high = float(np.max(high[-lb:]))
    macro_low  = float(np.min(low[-lb:]))
    macro_range = macro_high - macro_low

    if macro_range <= 0:
        return {}

    price = float(close[-1])

    # ── FIBONACCI MACRO (exacto Pine Script) ───────────────
    p_0    = macro_high
    p_236  = macro_high - macro_range * 0.236
    p_382  = macro_high - macro_range * 0.382
    p_50   = macro_high - macro_range * 0.500
    p_618  = macro_high - macro_range * 0.618
    p_705  = macro_high - macro_range * 0.705
    p_786  = macro_high - macro_range * 0.786
    p_886  = macro_high - macro_range * 0.886
    p_100  = macro_low

    # Extensiones bajistas
    p_e127 = macro_high - macro_range * 1.272
    p_e138 = macro_high - macro_range * 1.382
    p_e161 = macro_high - macro_range * 1.618
    p_e200 = macro_high - macro_range * 2.000
    p_e261 = macro_high - macro_range * 2.618

    # ── MICRO: ta.pivothigh/pivotlow ───────────────────────
    # Portado exacto: busca el último pivote confirmado
    last_ph = macro_high * 0.98  # default si no hay pivote
    last_pl = macro_low  * 1.02

    n = len(df)
    for i in range(n - pivot_right - 1, pivot_left, -1):
        # Pivot High: máximo de pivot_left a cada lado
        is_ph = all(high[i] >= high[i-j] for j in range(1, pivot_left+1)) and                 all(high[i] >= high[i+j] for j in range(1, pivot_right+1))
        if is_ph:
            last_ph = float(high[i])
            break

    for i in range(n - pivot_right - 1, pivot_left, -1):
        # Pivot Low
        is_pl = all(low[i] <= low[i-j] for j in range(1, pivot_left+1)) and                 all(low[i] <= low[i+j] for j in range(1, pivot_right+1))
        if is_pl:
            last_pl = float(low[i])
            break

    micro_high  = last_ph
    micro_low   = last_pl
    micro_range = micro_high - micro_low

    # Fibonacci Micro
    mf_382 = micro_high - micro_range * 0.382 if micro_range > 0 else 0
    mf_50  = micro_high - micro_range * 0.500 if micro_range > 0 else 0
    mf_618 = micro_high - micro_range * 0.618 if micro_range > 0 else 0
    mf_786 = micro_high - micro_range * 0.786 if micro_range > 0 else 0

    # ── VALIDACIÓN DE RANGO (portado de la versión Pine) ───
    # Pine tenía: fib_range_valid = (fib_range/close) < cap_por_timeframe.
    # Este port en Python NO tenía ese cap -> si el lookback agarra un
    # macro_high/macro_low muy distantes (ej. ATH viejo), el 78.6% cae
    # a un precio absurdo (ej. 14,231 con BTC en 62k). Se restaura el cap.
    range_pct = macro_range / max(price, 1e-10)
    rango_macro_valido = range_pct < 0.55

    # ── ZONA ÓPTIMA (Golden Pocket) ────────────────────────
    if rango_macro_valido:
        optimal_low  = min(p_618, p_786)
        optimal_high = max(p_618, p_786)
    elif micro_range > 0:
        # Fallback: rango macro inválido -> usar el Fibonacci MICRO
        # (basado en el último pivote real, mucho más cercano al precio)
        optimal_low  = min(mf_618, mf_786)
        optimal_high = max(mf_618, mf_786)
    else:
        # Último fallback: banda simple +-3% del precio actual
        optimal_low  = price * 0.97
        optimal_high = price * 1.03

    entry_mid    = (optimal_low + optimal_high) / 2
    sl_price     = optimal_low * 0.97
    sl_pct       = round((entry_mid - sl_price) / entry_mid * 100, 2)

    in_golden = optimal_low <= price <= optimal_high

    # ── WYCKOFF ZONES (exacto Pine Script) ─────────────────
    wyck_resistance = macro_high
    wyck_mid        = (macro_high + macro_low) / 2
    wyck_support    = macro_low * 1.05
    wyck_spring     = macro_low * 0.96

    # ── EMAs (para confluence score) ───────────────────────
    close_s = pd.Series(close)
    ema20  = float(close_s.ewm(span=20,  adjust=False).mean().iloc[-1])
    ema50  = float(close_s.ewm(span=50,  adjust=False).mean().iloc[-1])
    ema100 = float(close_s.ewm(span=100, adjust=False).mean().iloc[-1])
    ema200 = float(close_s.ewm(span=200, adjust=False).mean().iloc[-1])
    ema800 = float(close_s.ewm(span=800, adjust=False).mean().iloc[-1])              if len(close_s) >= 800 else ema200

    # ── ORDER BLOCK (para confluence) ──────────────────────
    vol = df["volume"].values
    vol_sma = float(pd.Series(vol).rolling(20).mean().iloc[-1])
    # Último OB alcista
    bull_ob_h = bull_ob_l = 0.0
    for i in range(len(df)-1, max(len(df)-50, 0), -1):
        if close[i] > df["open"].values[i] and vol[i] > vol_sma * 1.2:
            bull_ob_h = float(high[i])
            bull_ob_l = float(low[i])
            break

    # ── CONFLUENCE SCORE — exacto f_conf() del Pine Script ─
    def f_conf(lvl: float) -> int:
        tol = lvl * 0.025
        sc  = 0
        if abs(lvl - ema20)  < tol:             sc += 1
        if abs(lvl - ema50)  < tol:             sc += 1
        if abs(lvl - ema100) < tol:             sc += 2
        if abs(lvl - ema200) < tol:             sc += 3
        if abs(lvl - ema800) < tol:             sc += 2
        if abs(lvl - wyck_mid)     < tol * 1.5: sc += 2
        if abs(lvl - wyck_support) < tol * 1.5: sc += 3
        if abs(lvl - wyck_spring)  < tol * 1.5: sc += 2
        if bull_ob_l > 0 and bull_ob_l <= lvl <= bull_ob_h: sc += 3
        if abs(lvl - mf_382) < tol:             sc += 2
        if abs(lvl - mf_50)  < tol:             sc += 2
        if abs(lvl - mf_618) < tol:             sc += 2
        if abs(lvl - mf_786) < tol:             sc += 2
        return min(sc, 10)

    cs_382 = f_conf(p_382)
    cs_50  = f_conf(p_50)
    cs_618 = f_conf(p_618)
    cs_786 = f_conf(p_786)
    cs_886 = f_conf(p_886)

    # Mejor nivel por confluence score
    best = max([
        (cs_382, p_382, "38.2%"),
        (cs_50,  p_50,  "50.0%"),
        (cs_618, p_618, "61.8%"),
        (cs_786, p_786, "78.6%"),
        (cs_886, p_886, "88.6%"),
    ], key=lambda x: x[0])

    # ── BEAR SCORE (exacto Pine Script) ────────────────────
    close_s2  = df["close"]
    ema200_s  = close_s2.ewm(span=200, adjust=False).mean()
    ema50_s   = close_s2.ewm(span=50,  adjust=False).mean()

    bear_raw = 0
    if price < float(ema200_s.iloc[-1]):   bear_raw += 2
    if price < float(ema50_s.iloc[-1]):    bear_raw += 1
    if price < macro_high * 0.95:          bear_raw += 2
    # Velas bearish (simplificado)
    o, c = float(df["open"].iloc[-1]), float(df["close"].iloc[-1])
    o1, c1 = float(df["open"].iloc[-2]), float(df["close"].iloc[-2])
    if c < o and abs(c-o) > abs(c1-o1) and o > c1 and c < o1 and c1 > o1:
        bear_raw += 3  # bearish engulfing

    bear_score = min(40 + bear_raw * 8, 100)
    verdict = "BEARISH" if bear_score >= 65 else               "NEUTRAL" if bear_score >= 40 else "BULLISH"

    # ── Posición del precio en el rango Fib ────────────────
    pct_from_high = (macro_high - price) / macro_range * 100 if macro_range > 0 else 50

    if pct_from_high <= 0:       zone = "IMPULSO"
    elif pct_from_high <= 23.6:  zone = "0-23.6% Impulso"
    elif pct_from_high <= 38.2:  zone = "23.6-38.2%"
    elif pct_from_high <= 50.0:  zone = "38.2-50%"
    elif pct_from_high <= 61.8:  zone = "50-61.8%"
    elif pct_from_high <= 70.5:  zone = "0.618 entrada"
    elif pct_from_high <= 78.6:  zone = "GOLDEN POCKET"
    elif pct_from_high <= 88.6:  zone = "0.786-0.886 Profundo"
    elif pct_from_high <= 100:   zone = "0.886-1.0 Neutralizacion"
    elif pct_from_high <= 110:   zone = "DESTROY -1.1"
    elif pct_from_high <= 127:   zone = "DESTROY -1.27"
    elif pct_from_high <= 161.8: zone = "DESTROY -1.618"
    else:                        zone = "DESTROY -2.0+"

    return {
        # Macro
        "macro_high":  round(macro_high,  8),
        "macro_low":   round(macro_low,   8),
        "macro_range": round(macro_range, 8),
        "rango_macro_valido": rango_macro_valido,
        # Fibonacci Macro
        "p_0":    round(p_0,    8),
        "p_236":  round(p_236,  8),
        "p_382":  round(p_382,  8),
        "p_50":   round(p_50,   8),
        "p_618":  round(p_618,  8),
        "p_705":  round(p_705,  8),
        "p_786":  round(p_786,  8),
        "p_886":  round(p_886,  8),
        "p_100":  round(p_100,  8),
        # Extensiones
        "p_e127": round(p_e127, 8),
        "p_e138": round(p_e138, 8),
        "p_e161": round(p_e161, 8),
        "p_e200": round(p_e200, 8),
        "p_e261": round(p_e261, 8),
        # Micro Fibonacci
        "micro_high": round(micro_high, 8),
        "micro_low":  round(micro_low,  8),
        "mf_382": round(mf_382, 8),
        "mf_50":  round(mf_50,  8),
        "mf_618": round(mf_618, 8),
        "mf_786": round(mf_786, 8),
        # Zona optima
        "optimal_low":  round(optimal_low,  8),
        "optimal_high": round(optimal_high, 8),
        "entry_mid":    round(entry_mid,    8),
        "sl_price":     round(sl_price,     8),
        "sl_pct":       sl_pct,
        "in_golden":    in_golden,
        # Wyckoff
        "wyck_resistance": round(wyck_resistance, 8),
        "wyck_mid":        round(wyck_mid,        8),
        "wyck_support":    round(wyck_support,     8),
        "wyck_spring":     round(wyck_spring,      8),
        # EMAs
        "ema20": round(ema20,8), "ema50": round(ema50,8),
        "ema100": round(ema100,8), "ema200": round(ema200,8),
        # Confluence scores
        "cs_382": cs_382, "cs_50": cs_50, "cs_618": cs_618,
        "cs_786": cs_786, "cs_886": cs_886,
        "best_level":      best[2],
        "best_level_price": round(best[1], 8),
        "best_level_score": best[0],
        # Zona y bear score
        "zone":         zone,
        "pct_from_high": round(pct_from_high, 2),
        "bear_score":   bear_score,
        "verdict":      verdict,
        # Order Block
        "bull_ob_h": round(bull_ob_h, 8),
        "bull_ob_l": round(bull_ob_l, 8),
    }


def calc_poc(df: pd.DataFrame, rows: int = 50) -> float:
    """POC usando Money Flow Profile real."""
    if len(df) < 10:
        return float(df["close"].iloc[-1])

    p_high = float(df["high"].max())
    p_low  = float(df["low"].min())
    step   = (p_high - p_low) / rows

    if step <= 0:
        return float(df["close"].iloc[-1])

    mf = [0.0] * rows
    for _, bar in df.iterrows():
        h, l, c, v = float(bar["high"]), float(bar["low"]), \
                     float(bar["close"]), float(bar["volume"])
        mf_bar = v * (h + l + c) / 3
        for j in range(rows):
            rl = p_low + j * step
            rh = rl + step
            if h >= rl and l < rh:
                r = max(h-l, 1e-10)
                if l >= rl and h > rh:
                    por = (rh-l)/r
                elif h <= rh and l < rl:
                    por = (h-rl)/r
                elif l >= rl and h <= rh:
                    por = 1.0
                else:
                    por = step/r
                mf[j] += mf_bar * por

    poc_idx = mf.index(max(mf))
    return round(p_low + (poc_idx + 0.5) * step, 8)


# ══════════════════════════════════════════════════════════
# ZONAS DE CONFLUENCIA
# ══════════════════════════════════════════════════════════
def calc_zonas_confluencia(nr: NucleoResult,
                            precio: float,
                            tolerancia_pct: float = 0.02) -> list:
    """
    Identifica zonas donde COINCIDEN múltiples indicadores.
    Cada zona tiene un score según cuántos indicadores coinciden.

    Retorna: [(precio, descripcion, score)]
    """
    # Recopilar todos los niveles importantes
    niveles = []

    # Fibonacci del fractal
    if nr.fib_618:  niveles.append((nr.fib_618, "Fib 61.8%",  3))
    if nr.fib_786:  niveles.append((nr.fib_786, "Fib 78.6%",  2))
    if nr.fib_382:  niveles.append((nr.fib_382, "Fib 38.2%",  2))
    if nr.fib_e127: niveles.append((nr.fib_e127,"Ext 127.2%", 2))
    if nr.fib_e161: niveles.append((nr.fib_e161,"Ext 161.8%", 3))

    # POC cascade
    for tf, poc in nr.poc_map.items():
        peso = {"15m":1,"1h":2,"4h":3,"1d":4,"1w":5}.get(tf, 1)
        niveles.append((poc, f"POC {tf}", peso))

    # VWAP
    if nr.vwap: niveles.append((nr.vwap, "VWAP", 2))

    # Canal de regresión
    if nr.regresion_superior: niveles.append((nr.regresion_superior, "Canal Superior", 2))
    if nr.regresion_inferior: niveles.append((nr.regresion_inferior, "Canal Inferior", 2))

    # Bollinger
    if nr.bb_upper: niveles.append((nr.bb_upper, "BB Superior", 1))
    if nr.bb_lower: niveles.append((nr.bb_lower, "BB Inferior", 1))

    # Fractal neckline
    if nr.fractal_neckline: niveles.append((nr.fractal_neckline, f"Neckline {nr.fractal_tipo}", 3))

    # Calcular confluencias
    zonas = []
    tol   = precio * tolerancia_pct

    for i, (precio_i, desc_i, peso_i) in enumerate(niveles):
        if precio_i <= 0:
            continue
        score = peso_i
        descs = [desc_i]

        for j, (precio_j, desc_j, peso_j) in enumerate(niveles):
            if i == j or precio_j <= 0:
                continue
            if abs(precio_i - precio_j) <= tol:
                score += peso_j
                descs.append(desc_j)

        if score > 0:
            zona_precio = round(precio_i, 8)
            desc_final  = " + ".join(sorted(set(descs)))
            zonas.append((zona_precio, desc_final, round(score, 1)))

    # Deduplicar y ordenar por score
    zonas_unicas = {}
    for p, d, s in zonas:
        key = round(p / (tol * 2)) * (tol * 2)  # agrupar cercanas
        if key not in zonas_unicas or zonas_unicas[key][2] < s:
            zonas_unicas[key] = (p, d, s)

    return sorted(zonas_unicas.values(), key=lambda x: x[2], reverse=True)


# ══════════════════════════════════════════════════════════
# FUNCIÓN PRINCIPAL DEL NÚCLEO
# ══════════════════════════════════════════════════════════
def analizar_nucleo(symbol: str, ohlcv_map: dict, modo: str = "swing") -> NucleoResult:
    """
    Análisis matemático completo usando el libro de datos.
    ohlcv_map = {"5m": df, "15m": df, "30m": df, "1h": df, "4h": df, "1d": df, "1w": df}

    modo="swing"    -> TF base 4H (fallback 1D, 1H) — análisis de temporalidad alta
    modo="scalping" -> TF base 15M (fallback 30M, 5M, 1H) — análisis para scalping
    """
    nr = NucleoResult(symbol=symbol)

    if modo == "scalping":
        def _ok(tf):
            d = ohlcv_map.get(tf)
            return d if (d is not None and not d.empty) else None
        df_base = _ok("15m") if _ok("15m") is not None else \
                  _ok("30m") if _ok("30m") is not None else \
                  _ok("5m")  if _ok("5m")  is not None else \
                  ohlcv_map.get("1h")
    else:
        # Usar 4H como TF base (swing / temporalidad alta)
        df_4h = ohlcv_map.get("4h")
        df_1h = ohlcv_map.get("1h")
        df_base = df_4h if (df_4h is not None and not df_4h.empty) else df_1h
    if df_base is None or len(df_base) < 50:
        log.warning(f"[{symbol}] Sin datos suficientes en núcleo")
        return nr

    nr.price = float(df_base["close"].iloc[-1])
    precio   = nr.price

    # ── 1. Pivotes matemáticos ────────────────────────────
    nr.pivotes_high, nr.pivotes_low = calc_pivotes(df_base, n=5)

    # ── 2. PSY DEPTH FIBONACCI (portado exacto del Pine Script) ────
    try:
        psy = psy_depth_fibonacci(df_base)
        if psy:
            rango_valido = psy.get("rango_macro_valido", True)
            if rango_valido:
                nr.fib_618 = psy.get("p_618", 0)
                nr.fib_786 = psy.get("p_786", 0)
                nr.fib_382 = psy.get("p_382", 0)
            else:
                # Rango macro inválido (ATH/low muy lejanos) -> estos niveles
                # alimentan calc_zonas_confluencia() y de ahí los TPs de
                # CORTO PLAZO; si se dejan en el valor macro absurdo, un TP
                # "corto plazo (1H-4H)" puede terminar mostrando un -78%.
                # Se usa el Fibonacci MICRO (pivote real reciente) en su lugar.
                nr.fib_618 = psy.get("mf_618", 0)
                nr.fib_786 = psy.get("mf_786", 0)
                nr.fib_382 = psy.get("mf_382", 0)
            nr.fib_e127    = psy.get("p_e127", 0)
            nr.fib_e161    = psy.get("p_e161", 0)
            nr.fractal_neckline = psy.get("optimal_low", 0)
            nr.__dict__["psy_depth"]   = psy
            nr.__dict__["cs_382"]      = psy.get("cs_382", 0)
            nr.__dict__["cs_618"]      = psy.get("cs_618", 0)
            nr.__dict__["cs_786"]      = psy.get("cs_786", 0)
            nr.__dict__["best_level"]  = psy.get("best_level", "─")
            nr.__dict__["best_score"]  = psy.get("best_level_score", 0)
            nr.__dict__["bear_score"]  = psy.get("bear_score", 50)
            nr.__dict__["verdict"]     = psy.get("verdict", "NEUTRAL")
            nr.__dict__["zone"]        = psy.get("zone", "─")
            nr.__dict__["in_golden"]   = psy.get("in_golden", False)
            nr.__dict__["entry_mid"]   = psy.get("entry_mid", 0)
            nr.__dict__["sl_price"]    = psy.get("sl_price", 0)
            nr.__dict__["wyck_support"]= psy.get("wyck_support", 0)
            nr.__dict__["wyck_spring"] = psy.get("wyck_spring", 0)
            nr.__dict__["wyck_mid"]    = psy.get("wyck_mid", 0)
            nr.__dict__["macro_high"]  = psy.get("macro_high", 0)
            nr.__dict__["macro_low"]   = psy.get("macro_low", 0)
            nr.__dict__["mf_618"]      = psy.get("mf_618", 0)
            nr.__dict__["mf_382"]      = psy.get("mf_382", 0)
    except Exception as e:
        log.debug(f"PSY DEPTH {symbol}: {e}")

    # ── 2b. Detección de fractales ────────────────────────
    fractales = [
        detectar_hch(nr.pivotes_high, nr.pivotes_low),
        detectar_hch_invertido(nr.pivotes_high, nr.pivotes_low),
        detectar_doble_techo(nr.pivotes_high),
        detectar_doble_suelo(nr.pivotes_low),
        detectar_cuna(nr.pivotes_high, nr.pivotes_low),
    ]

    # Tomar el fractal con mayor confianza
    fractal = max([f for f in fractales if f.get("detectado")],
                  key=lambda f: f.get("confianza", 0),
                  default={"detectado": False})

    if fractal.get("detectado"):
        nr.fractal_tipo      = fractal.get("tipo", "NINGUNO")
        nr.fractal_neckline  = fractal.get("neckline", 0)
        nr.fractal_objetivo  = fractal.get("objetivo", 0)
        nr.fractal_confianza = fractal.get("confianza", 0)
        nr.fractal_completado = True

        # Fibonacci del fractal detectado
        if nr.fractal_tipo in ("HCH",):
            # Bajista: de pico de cabeza a neckline
            fib = calc_fib_fractal(fractal.get("cabeza",0), nr.fractal_neckline)
        elif nr.fractal_tipo in ("HCH_INV",):
            fib = calc_fib_fractal(0, nr.fractal_objetivo)  # alcista
        else:
            # Para doble techo/suelo usar el rango
            nivel = fractal.get("nivel", precio)
            fib = calc_fib_fractal(nivel, fractal.get("objetivo", nivel))

        nr.fib_618  = fib.get("f618", 0)
        nr.fib_786  = fib.get("f786", 0)
        nr.fib_382  = fib.get("f382", 0)
        nr.fib_e127 = fib.get("e127", 0)
        nr.fib_e161 = fib.get("e161", 0)
        nr.en_zona_618 = abs(precio - nr.fib_618) / max(precio, 1e-10) < 0.03

    # ── 3. Canal de regresión ─────────────────────────────
    reg = calc_regresion_lineal(df_base)
    nr.regresion_superior = reg["superior"]
    nr.regresion_inferior = reg["inferior"]
    nr.regresion_media    = reg["media"]
    nr.regresion_slope    = reg["slope_pct"]
    nr.precio_en_canal    = reg["posicion"]

    # ── 3b. Fractal Pro ──────────────────────────────────
    if FRACTAL_PRO:
        try:
            fr = analizar_fractales_pro(df_base)
            nr.fractal_pro_patron  = fr.patron
            nr.fractal_pro_tipo    = fr.tipo
            nr.fractal_pro_conf    = fr.confianza
            nr.fractal_pro_obj     = fr.objetivo
            nr.fractal_pro_stop    = fr.stop
            nr.fractal_pro_fib618  = fr.fib_618
            nr.fractal_pro_score   = fr.score
            nr.fractal_pro_narrativa = fr.narrativa
            nr.vela_tipo           = fr.vela_tipo
            nr.vela_señal          = fr.vela_señal
            nr.div_rsi_bull        = fr.div_rsi_bull
            nr.div_rsi_bear        = fr.div_rsi_bear
            nr.div_tipo            = fr.div_tipo
            nr.__dict__["div_desc"]          = fr.div_desc
            nr.__dict__["div_confianza"]     = fr.div_confianza
            nr.__dict__["div_vol_confirma"]  = fr.div_vol_confirma
            nr.__dict__["div_ema_confirma"]  = fr.div_ema_confirma
            nr.__dict__["div_vela_confirma"] = fr.div_vela_confirma
            nr.canal_tipo          = fr.canal_tipo
            nr.en_techo            = fr.en_techo
            nr.en_suelo            = fr.en_suelo
            # Actualizar fractal del núcleo si fractal_pro es más confiable
            if fr.confianza > nr.fractal_confianza:
                nr.fractal_tipo      = fr.patron
                nr.fractal_confianza = fr.confianza
                nr.fractal_objetivo  = fr.objetivo
                nr.fib_618           = fr.fib_618
                nr.fib_e127          = fr.fib_e127
        except Exception as e:
            log.debug(f"Fractal Pro error: {e}")

    # ── 4. VWAP ───────────────────────────────────────────
    nr.vwap        = calc_vwap(df_base)
    nr.precio_vwap = "SOBRE" if precio > nr.vwap else "BAJO"

    # ── 5. RSI cascada (vaso de agua) ─────────────────────
    rsi_vals = {}
    for tf, df in ohlcv_map.items():
        if df is not None and len(df) >= 15:
            rsi_vals[tf] = _rsi(df["close"])
    nr.rsi_map = rsi_vals

    if rsi_vals:
        macro_tf  = "1d" if "1d" in rsi_vals else list(rsi_vals.keys())[-1]
        rsi_macro = rsi_vals[macro_tf]
        # Vaso de agua: % disponible hacia arriba
        nr.rsi_energy = round(100 - rsi_macro, 1)
        nr.rsi_agotado = rsi_macro > 75 or rsi_macro < 25

    # ── 6. ADX cascada ────────────────────────────────────
    adx_vals = {}
    for tf, df in ohlcv_map.items():
        if df is not None and len(df) >= 28:
            adx_vals[tf] = _adx(df)
    nr.adx_map = adx_vals

    macro_adx = adx_vals.get("1d", {}).get("adx", 0)
    nr.adx_maduro = macro_adx > 40

    # ── 7. CVD cascada ────────────────────────────────────
    cvd_vals = {}
    for tf, df in ohlcv_map.items():
        if df is not None and len(df) >= 20:
            cvd_vals[tf] = _cvd(df)
    nr.cvd_map = cvd_vals

    low_tfs = ["15m", "30m", "1h"]
    nr.cvd_cascade_bull = all(cvd_vals.get(tf, 0) > 3  for tf in low_tfs if tf in cvd_vals)
    nr.cvd_cascade_bear = all(cvd_vals.get(tf, 0) < -3 for tf in low_tfs if tf in cvd_vals)

    # ── 8. POC cascada ────────────────────────────────────
    poc_vals = {}
    for tf, df in ohlcv_map.items():
        if df is not None and len(df) >= 20:
            poc_vals[tf] = calc_poc(df)
    nr.poc_map = poc_vals

    nr.pocs_abajo  = sum(1 for p in poc_vals.values() if p < precio * 0.985)
    nr.pocs_arriba = sum(1 for p in poc_vals.values() if p > precio * 1.015)

    # ── 9. Bollinger ──────────────────────────────────────
    bb = calc_bb(df_base)
    nr.bb_upper   = bb["upper"]
    nr.bb_lower   = bb["lower"]
    nr.bb_squeeze = bb["squeeze"]
    nr.precio_bb  = bb["pos"]

    # ── 10. Zonas de confluencia ──────────────────────────
    nr.zonas_clave = calc_zonas_confluencia(nr, precio)

    if nr.zonas_clave:
        # Zona óptima LONG: zona con mayor score DEBAJO del precio.
        # Limitado a 25% del precio: una "entrada óptima" no debería
        # saltar a un nivel absurdamente lejano aunque tenga buen score.
        zonas_abajo = [(p,d,s) for p,d,s in nr.zonas_clave
                       if precio * 0.75 < p < precio * 0.99]
        if zonas_abajo:
            nr.zona_optima_long = zonas_abajo[0][0]
            nr.zona_score       = zonas_abajo[0][2]

        # Zona óptima SHORT: zona con mayor score ARRIBA del precio
        zonas_arriba = [(p,d,s) for p,d,s in nr.zonas_clave
                        if precio * 1.01 < p < precio * 1.25]
        if zonas_arriba:
            nr.zona_optima_short = zonas_arriba[0][0]

    # ── 11. Score de agotamiento ──────────────────────────
    agot = 0.0
    # RSI agotado
    if nr.rsi_agotado: agot += 30
    # ADX maduro
    if nr.adx_maduro:  agot += 20
    # Precio en extremo del canal
    if nr.precio_en_canal in ("SUPERIOR", "INFERIOR"): agot += 25
    # Precio en extremo de Bollinger
    if nr.precio_bb in ("SUPERIOR", "INFERIOR"): agot += 15
    # CVD divergente
    rsi_macro = rsi_vals.get("1d", 50)
    cvd_macro  = cvd_vals.get("1d", 0)
    if rsi_macro > 65 and cvd_macro < 0:   agot += 10  # divergencia bajista
    if rsi_macro < 35 and cvd_macro > 0:   agot += 10  # divergencia alcista

    nr.agotamiento_score = min(agot, 100)

    # Dirección del agotamiento
    if agot >= 50:
        if nr.precio_en_canal == "SUPERIOR" or rsi_macro > 65:
            nr.agotamiento_dir = "ALCISTA"  # agotamiento alcista = reversal bajista
        elif nr.precio_en_canal == "INFERIOR" or rsi_macro < 35:
            nr.agotamiento_dir = "BAJISTA"

    # ── 12. Dirección del núcleo ──────────────────────────
    # Macro (1D/1W)
    rsi_1d  = rsi_vals.get("1d", 50)
    adx_1d  = adx_vals.get("1d", {})
    cvd_1d  = cvd_vals.get("1d", 0)
    slope   = nr.regresion_slope

    bull_signals = 0
    bear_signals = 0

    if rsi_1d > 55:   bull_signals += 1
    elif rsi_1d < 45: bear_signals += 1

    if adx_1d.get("dip", 0) > adx_1d.get("dim", 0): bull_signals += 1
    else: bear_signals += 1

    if cvd_1d > 3:    bull_signals += 1
    elif cvd_1d < -3: bear_signals += 1

    if slope > 0:     bull_signals += 1
    elif slope < 0:   bear_signals += 1

    if nr.precio_vwap == "SOBRE": bull_signals += 1
    else: bear_signals += 1

    nr.direccion_macro = "ALCISTA" if bull_signals > bear_signals else \
                         "BAJISTA" if bear_signals > bull_signals else "NEUTRAL"

    # Micro (4H/1H)
    rsi_4h  = rsi_vals.get("4h", 50)
    cvd_4h  = cvd_vals.get("4h", 0)

    if rsi_4h > 55 and cvd_4h > 0:   nr.direccion_micro = "ALCISTA"
    elif rsi_4h < 45 and cvd_4h < 0: nr.direccion_micro = "BAJISTA"
    else:                              nr.direccion_micro = "NEUTRAL"

    # Confianza general
    total = bull_signals + bear_signals
    nr.confianza = round(max(bull_signals, bear_signals) / max(total, 1) * 100, 1)

    log.info(f"✅ Núcleo {symbol}: {nr.direccion_macro}/{nr.direccion_micro} "
             f"conf={nr.confianza}% fractal={nr.fractal_tipo}")

    return nr
