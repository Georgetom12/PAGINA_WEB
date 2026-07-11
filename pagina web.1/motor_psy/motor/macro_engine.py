"""
PSY MOTOR — CURSOR 4: MACRO ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Integra contexto macro global al análisis:
  - DXY (dólar): inversamente correlado con crypto/gold
  - VIX (miedo): riesgo OFF/ON
  - SPX/NDX: apetito de riesgo institucional
  - Bonos 10Y (TNX): tasa libre de riesgo
  - Las 7 Magnificas: liderazgo tech = liderazgo crypto
  - Gold: correlación con BTC en crisis
  - Oil: inflación proxy

Genera:
  - Sesgo macro global (RISK_ON/RISK_OFF/NEUTRAL)
  - Correlación del activo con macro
  - Ajuste de confianza del dictamen
  - Contexto narrativo ("Por qué sube/baja")
"""
from __future__ import annotations
import asyncio
import aiohttp
import logging
import time
from dataclasses import dataclass, field
from typing import Optional
import pandas as pd

log = logging.getLogger(__name__)

AV_KEY   = "TLV88R7X624ETACC"
FMP_KEY  = "InRRPPMTaJEPxoyTGrwE1qNynA5VTz8Q"
FRED_KEY = "ef85c60cecd60e3146b4390028b66b63"

# Cache
_macro_cache: dict = {}
_macro_ts:    dict = {}

def _cget(k, ttl=1800):
    if k in _macro_cache and time.time() - _macro_ts.get(k,0) < ttl:
        return _macro_cache[k]
    return None

def _cset(k, v):
    _macro_cache[k] = v
    _macro_ts[k]    = time.time()


# ══════════════════════════════════════════════════════════
# DATACLASS MACRO
# ══════════════════════════════════════════════════════════
@dataclass
class MacroContext:
    # ── Indicadores clave ─────────────────────────────────
    dxy_value:    float = 100.0
    dxy_change:   float = 0.0
    dxy_trend:    str   = "NEUTRAL"  # UP|DOWN|NEUTRAL

    vix_value:    float = 20.0
    vix_level:    str   = "NORMAL"   # LOW|NORMAL|HIGH|EXTREME

    spx_change:   float = 0.0
    spx_trend:    str   = "NEUTRAL"

    ndx_change:   float = 0.0
    ndx_trend:    str   = "NEUTRAL"

    tnx_value:    float = 4.5        # Bonos 10Y %
    tnx_trend:    str   = "NEUTRAL"

    gold_value:   float = 0.0
    gold_change:  float = 0.0
    gold_trend:   str   = "NEUTRAL"

    oil_value:    float = 0.0
    oil_change:   float = 0.0
    oil_trend:    str   = "NEUTRAL"  # WTI — proxy de inflación/energía

    # ── Las 7 Magnificas ──────────────────────────────────
    mag7_changes: dict  = field(default_factory=dict)
    mag7_avg:     float = 0.0
    mag7_trend:   str   = "NEUTRAL"
    nvda_change:  float = 0.0       # NVDA lidera crypto

    # ── Sesgo macro global ────────────────────────────────
    sesgo:        str   = "NEUTRAL"  # RISK_ON|RISK_OFF|NEUTRAL
    sesgo_score:  float = 50.0       # 0-100 (100=risk_on, 0=risk_off)
    sesgo_fuerza: str   = "DEBIL"    # FUERTE|MODERADO|DEBIL

    # ── Narrativa ─────────────────────────────────────────
    narrativa:    list  = field(default_factory=list)
    ajuste_conf:  float = 0.0        # ajuste al score de confianza

    # ── Correlaciones con crypto ──────────────────────────
    btc_dxy_corr:  str  = "INVERSA"  # DXY sube = BTC baja
    btc_spx_corr:  str  = "POSITIVA" # SPX sube = BTC sube


# ══════════════════════════════════════════════════════════
# FETCHERS
# ══════════════════════════════════════════════════════════
async def _fetch_av_quote(symbol: str) -> dict:
    """Quote en tiempo real via Alpha Vantage."""
    cached = _cget(f"av_{symbol}", 900)
    if cached: return cached

    url = "https://www.alphavantage.co/query"
    params = {
        "function": "GLOBAL_QUOTE",
        "symbol":   symbol,
        "apikey":   AV_KEY,
    }
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(url, params=params,
                             timeout=aiohttp.ClientTimeout(total=15)) as r:
                data = await r.json()

        q = data.get("Global Quote", {})
        if not q:
            return {}

        result = {
            "price":      float(q.get("05. price", 0)),
            "change":     float(q.get("09. change", 0)),
            "change_pct": float(q.get("10. change percent", "0%").replace("%","")),
            "prev_close": float(q.get("08. previous close", 0)),
            "volume":     float(q.get("06. volume", 0)),
        }
        _cset(f"av_{symbol}", result)
        return result
    except Exception as e:
        log.warning(f"AV quote {symbol}: {e}")
        return {}


async def _fetch_fmp_quote(symbols: list) -> dict:
    """Quotes via FMP (más rápido para múltiples símbolos).

    NOTA (8-jul-2026): /api/v3/quote daba 403 "Legacy Endpoint" — FMP
    dejó ese endpoint solo para cuentas de antes de agosto 2025 (confirmado
    en logs de Railway). El endpoint vigente y documentado hoy es
    /stable/batch-quote?symbols=... — ver
    https://site.financialmodelingprep.com/developer/docs/stable/batch-quote
    """
    cached = _cget("fmp_quotes", 900)
    if cached: return cached

    sym_str = ",".join(symbols)
    url = "https://financialmodelingprep.com/stable/batch-quote"
    params = {"symbols": sym_str, "apikey": FMP_KEY}
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(url, params=params,
                             timeout=aiohttp.ClientTimeout(total=15)) as r:
                status = r.status
                # OJO: antes se hacía `data = await r.json()` sin mirar el
                # status. Si FMP devuelve 401/402/403 (plan/API key), el
                # body suele ser un dict de error (ej. {"Error Message": ...})
                # y `isinstance(data, list)` fallaba en silencio -> result={}
                # -> todo el bloque macro (DXY/SPX/NVDA/Mag7) caía a 0.00%
                # sin que quedara ningún rastro en logs.
                if status != 200:
                    body = await r.text()
                    log.warning(f"FMP quotes HTTP {status}: {body[:300]}")
                    return {}
                data = await r.json()

        if not isinstance(data, list):
            log.warning(f"FMP quotes: respuesta inesperada (no es lista) -> {str(data)[:300]}")
            return {}

        result = {}
        for q in data:
            sym = q.get("symbol", "")
            # /stable puede devolver "changePercentage" (sin "s"); /api/v3
            # legacy usaba "changesPercentage" (con "s"). Se aceptan ambos
            # por si el nombre de campo cambia otra vez.
            chg = q.get("changePercentage", q.get("changesPercentage", 0)) or 0
            result[sym] = {
                "price":      float(q.get("price", 0) or 0),
                "change_pct": float(chg),
                "change":     float(q.get("change", 0) or 0),
            }

        faltantes = [s for s in symbols if s not in result]
        if faltantes:
            log.warning(f"FMP quotes: sin datos para {faltantes} "
                        f"(revisar si el plan FMP soporta esos símbolos)")

        if not result:
            # No cachear un resultado vacío: así el próximo request reintenta
            # en vez de quedarse pegado 30 min mostrando todo en 0.00%
            return {}

        _cset("fmp_quotes", result)
        return result
    except Exception as e:
        log.warning(f"FMP quotes: excepción de conexión -> {e}")
        return {}


async def _fetch_fred_latest(series_id: str) -> float:
    """Último valor de FRED."""
    cached = _cget(f"fred_{series_id}", 3600)
    if cached is not None: return cached

    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id":   series_id,
        "api_key":     FRED_KEY,
        "file_type":   "json",
        "sort_order":  "desc",
        "limit":       5,
    }
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(url, params=params,
                             timeout=aiohttp.ClientTimeout(total=10)) as r:
                data = await r.json()

        obs = [o for o in data.get("observations", [])
               if o.get("value") not in (".", "")]
        if obs:
            val = float(obs[0]["value"])
            _cset(f"fred_{series_id}", val)
            return val
    except Exception as e:
        log.warning(f"FRED {series_id}: {e}")
    return 0.0


async def _fetch_yahoo_quote(symbol: str) -> dict:
    """
    Quote gratis vía Yahoo Finance v8 (sin API key, sin límite de plan).

    NOTA (8-jul-2026): FMP dejó de servir /api/v3 (403 legacy) y /stable
    devuelve 402 "Restricted Endpoint" en el plan free — el plan Basic de
    FMP ya no incluye quotes en tiempo real. Se reemplaza por Yahoo Finance,
    el mismo patrón que ya usa `pagina web.1/.../market-data.ts` y que ahí
    sí funciona bien.
    """
    cached = _cget(f"yahoo_{symbol}", 900)
    if cached is not None: return cached

    url = f"https://query2.finance.yahoo.com/v8/finance/chart/{symbol}"
    params = {"interval": "1d", "range": "1d"}
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(url, params=params, headers=headers,
                             timeout=aiohttp.ClientTimeout(total=10)) as r:
                if r.status != 200:
                    body = await r.text()
                    log.warning(f"Yahoo quote {symbol} HTTP {r.status}: {body[:200]}")
                    return {}
                data = await r.json()

        meta = (data.get("chart", {}).get("result") or [{}])[0].get("meta", {})
        price = meta.get("regularMarketPrice")
        if price is None:
            log.warning(f"Yahoo quote {symbol}: sin regularMarketPrice en la respuesta")
            return {}

        prev = meta.get("chartPreviousClose") or meta.get("previousClose") or price
        change_pct = ((price - prev) / prev * 100) if prev else 0.0
        result = {"price": float(price), "change_pct": float(change_pct)}
        _cset(f"yahoo_{symbol}", result)
        return result
    except Exception as e:
        log.warning(f"Yahoo quote {symbol}: excepción -> {e}")
        return {}


# ══════════════════════════════════════════════════════════
# FUNCIÓN PRINCIPAL — GET MACRO CONTEXT
# ══════════════════════════════════════════════════════════
async def get_macro_context() -> MacroContext:
    """
    Obtiene el contexto macro completo.
    Cacheado 30 minutos — datos macro no cambian tan rápido.
    """
    cached = _cget("macro_full", 1800)
    if cached: return cached

    mc = MacroContext()

    # ── Fetch en paralelo vía Yahoo Finance (gratis, sin límite de plan) ──
    # Símbolos Yahoo: DXY=DX-Y.NYB, VIX=^VIX, SPX=^GSPC, NDX=^IXIC, Gold=GC=F
    yahoo_symbols = {
        "spx": "^GSPC", "ndx": "^IXIC", "vix": "^VIX", "gold": "GC=F",
        "oil": "CL=F",  # WTI Crude
        "dxy": "DX-Y.NYB",
        "NVDA": "NVDA", "AAPL": "AAPL", "MSFT": "MSFT", "GOOGL": "GOOGL",
        "AMZN": "AMZN", "META": "META", "TSLA": "TSLA",
    }

    keys = list(yahoo_symbols.keys())
    results, tnx = await asyncio.gather(
        asyncio.gather(*[_fetch_yahoo_quote(yahoo_symbols[k]) for k in keys],
                       return_exceptions=True),
        _fetch_fred_latest("DGS10"),
        return_exceptions=True
    )

    if isinstance(tnx, Exception): tnx = 4.5
    if isinstance(results, Exception): results = [{}] * len(keys)

    yq: dict = {}
    for k, r in zip(keys, results):
        yq[k] = {} if isinstance(r, Exception) else r

    mc.tnx_value = tnx
    mc.tnx_trend = "UP" if tnx > 4.5 else "DOWN" if tnx < 4.0 else "NEUTRAL"

    # ── DXY ──────────────────────────────────────────────
    dxy = yq.get("dxy", {})
    mc.dxy_value  = dxy.get("price", 100.0)
    mc.dxy_change = dxy.get("change_pct", 0.0)
    mc.dxy_trend  = "UP" if mc.dxy_change > 0.2 else \
                    "DOWN" if mc.dxy_change < -0.2 else "NEUTRAL"

    # ── VIX ───────────────────────────────────────────────
    vix = yq.get("vix", {})
    mc.vix_value = vix.get("price", 20.0)

    mc.vix_level = "EXTREME" if mc.vix_value > 35 else \
                   "HIGH"    if mc.vix_value > 25 else \
                   "LOW"     if mc.vix_value < 15 else "NORMAL"

    # ── SPX / NDX ─────────────────────────────────────────
    spy = yq.get("spx", {})
    qqq = yq.get("ndx", {})
    mc.spx_change = spy.get("change_pct", 0.0)
    mc.ndx_change = qqq.get("change_pct", 0.0)
    mc.spx_trend  = "UP" if mc.spx_change > 0.3 else \
                    "DOWN" if mc.spx_change < -0.3 else "NEUTRAL"
    mc.ndx_trend  = "UP" if mc.ndx_change > 0.3 else \
                    "DOWN" if mc.ndx_change < -0.3 else "NEUTRAL"

    # ── Gold ──────────────────────────────────────────────
    gld = yq.get("gold", {})
    mc.gold_value  = gld.get("price", 0.0)
    mc.gold_change = gld.get("change_pct", 0.0)
    mc.gold_trend  = "UP" if mc.gold_change > 0.3 else \
                     "DOWN" if mc.gold_change < -0.3 else "NEUTRAL"

    # ── Oil (WTI) — proxy de inflación/energía ────────────
    oil = yq.get("oil", {})
    mc.oil_value  = oil.get("price", 0.0)
    mc.oil_change = oil.get("change_pct", 0.0)
    mc.oil_trend  = "UP" if mc.oil_change > 1.0 else \
                    "DOWN" if mc.oil_change < -1.0 else "NEUTRAL"

    # ── Las 7 Magnificas ──────────────────────────────────
    mag7_syms = ["NVDA","AAPL","MSFT","GOOGL","AMZN","META","TSLA"]
    changes   = {}
    for sym in mag7_syms:
        q = yq.get(sym, {})
        changes[sym] = q.get("change_pct", 0.0)

    mc.mag7_changes = changes
    mc.nvda_change  = changes.get("NVDA", 0.0)
    mc.mag7_avg     = sum(changes.values()) / max(len(changes), 1)
    mc.mag7_trend   = "UP" if mc.mag7_avg > 0.5 else \
                      "DOWN" if mc.mag7_avg < -0.5 else "NEUTRAL"

    # ══════════════════════════════════════════════════════
    # SESGO MACRO — RISK ON vs RISK OFF
    # ══════════════════════════════════════════════════════
    score = 50.0  # neutral
    narrativa = []

    # DXY — inversamente correlado con crypto/gold
    if mc.dxy_trend == "DOWN":
        score += 15
        narrativa.append(f"💵 DXY bajando {mc.dxy_change:.2f}% → RISK ON (crypto sube)")
    elif mc.dxy_trend == "UP":
        score -= 15
        narrativa.append(f"💵 DXY subiendo +{mc.dxy_change:.2f}% → RISK OFF (crypto baja)")

    # VIX — miedo = risk off
    if mc.vix_level == "EXTREME":
        score -= 25
        narrativa.append(f"😱 VIX extremo ({mc.vix_value:.0f}) → PÁNICO — risk OFF severo")
    elif mc.vix_level == "HIGH":
        score -= 15
        narrativa.append(f"⚠️ VIX alto ({mc.vix_value:.0f}) → cautela, risk OFF")
    elif mc.vix_level == "LOW":
        score += 10
        narrativa.append(f"😎 VIX bajo ({mc.vix_value:.0f}) → mercados tranquilos, risk ON")

    # SPX — apetito de riesgo
    if mc.spx_trend == "UP":
        score += 12
        narrativa.append(f"📈 SPX +{mc.spx_change:.2f}% → institucionales comprando riesgo")
    elif mc.spx_trend == "DOWN":
        score -= 12
        narrativa.append(f"📉 SPX {mc.spx_change:.2f}% → institucionales vendiendo riesgo")

    # Bonos 10Y — tasas altas = dólar fuerte = crypto baja
    if mc.tnx_value > 4.8:
        score -= 10
        narrativa.append(f"🏦 Bonos 10Y al {mc.tnx_value:.2f}% → tasa alta, presión bajista")
    elif mc.tnx_value < 4.0:
        score += 8
        narrativa.append(f"🏦 Bonos 10Y al {mc.tnx_value:.2f}% → tasa baja, favorable crypto")

    # Mag7 — lideran el mercado tech → crypto sigue
    if mc.mag7_trend == "UP":
        score += 10
        narrativa.append(f"💻 Mag7 +{mc.mag7_avg:.2f}% → tech liderando, positivo crypto")
    elif mc.mag7_trend == "DOWN":
        score -= 10
        narrativa.append(f"💻 Mag7 {mc.mag7_avg:.2f}% → tech cayendo, negativo crypto")

    # NVDA lidera específicamente BTC/ETH
    if mc.nvda_change > 3:
        score += 8
        narrativa.append(f"🚀 NVDA +{mc.nvda_change:.2f}% → AI/tech eufórico, positivo BTC")
    elif mc.nvda_change < -3:
        score -= 8
        narrativa.append(f"📉 NVDA {mc.nvda_change:.2f}% → AI/tech vendiendo, negativo BTC")

    # Gold — safe haven
    if mc.gold_trend == "UP" and mc.vix_level in ("HIGH","EXTREME"):
        score -= 5
        narrativa.append(f"🥇 Gold subiendo en VIX alto → fuga a safe haven, negativo crypto")
    elif mc.gold_trend == "UP" and mc.dxy_trend == "DOWN":
        score += 5
        narrativa.append(f"🥇 Gold subiendo con DXY bajo → inflación, positivo BTC")

    # Oil (WTI) — subidas fuertes = presión inflacionaria / riesgo geopolítico
    if mc.oil_trend == "UP":
        score -= 6
        narrativa.append(f"🛢️ Petróleo +{mc.oil_change:.2f}% → presión inflacionaria/geopolítica, risk OFF")
    elif mc.oil_trend == "DOWN":
        score += 4
        narrativa.append(f"🛢️ Petróleo {mc.oil_change:.2f}% → menos presión inflacionaria, risk ON")

    # Clamp y clasificar
    score = max(0, min(100, score))
    mc.sesgo_score = round(score, 1)

    if score >= 70:
        mc.sesgo = "RISK_ON"
        mc.sesgo_fuerza = "FUERTE" if score >= 80 else "MODERADO"
    elif score <= 30:
        mc.sesgo = "RISK_OFF"
        mc.sesgo_fuerza = "FUERTE" if score <= 20 else "MODERADO"
    else:
        mc.sesgo = "NEUTRAL"
        mc.sesgo_fuerza = "DEBIL"

    # Ajuste de confianza para el dictamen
    # Si macro confirma → +10 confianza, si contradice → -15
    mc.ajuste_conf = 0.0
    # (se calcula en dictamen_motor según dirección del activo)

    mc.narrativa = narrativa[:5]

    _cset("macro_full", mc)
    log.info(f"✅ Macro: {mc.sesgo} ({mc.sesgo_score:.0f}/100) — "
             f"DXY:{mc.dxy_change:+.2f}% VIX:{mc.vix_value:.0f} "
             f"SPX:{mc.spx_change:+.2f}% Mag7:{mc.mag7_avg:+.2f}% "
             f"Gold:${mc.gold_value:.0f}({mc.gold_change:+.2f}%) "
             f"Oil:${mc.oil_value:.1f}({mc.oil_change:+.2f}%)")
    return mc


# ══════════════════════════════════════════════════════════
# INTEGRACIÓN CON DICTAMEN
# ══════════════════════════════════════════════════════════
def aplicar_macro_al_dictamen(dm, mc: MacroContext) -> None:
    """
    Ajusta el dictamen con el contexto macro.
    Modifica dm in-place.
    """
    if not mc:
        return

    sesgo = mc.sesgo
    dir_dm = dm.direccion

    # Macro confirma dirección
    if (sesgo == "RISK_ON" and dir_dm == "ALCISTA") or \
       (sesgo == "RISK_OFF" and dir_dm == "BAJISTA"):
        dm.confianza = min(100, dm.confianza + 12)
        dm.contexto.insert(0,
            f"🌍 Macro CONFIRMA — {sesgo} ({mc.sesgo_score:.0f}/100)")

    # Macro contradice dirección
    elif (sesgo == "RISK_OFF" and dir_dm == "ALCISTA") or \
         (sesgo == "RISK_ON" and dir_dm == "BAJISTA"):
        dm.confianza = max(0, dm.confianza - 15)
        dm.contexto.insert(0,
            f"⚠️ Macro CONTRADICE — mercado global en {sesgo}")
        dm.contradiccion = True

    # Agregar narrativa macro al contexto
    for n in mc.narrativa[:2]:
        dm.contexto.append(n)

    # Agregar datos clave
    dm.contexto.append(
        f"📊 DXY:{mc.dxy_value:.1f}({mc.dxy_change:+.2f}%) | "
        f"VIX:{mc.vix_value:.0f} | SPX:{mc.spx_change:+.2f}% | "
        f"NVDA:{mc.nvda_change:+.2f}%"
    )
    dm.contexto.append(
        f"🥇 Gold:${mc.gold_value:.0f}({mc.gold_change:+.2f}%) | "
        f"🛢️ WTI:${mc.oil_value:.1f}({mc.oil_change:+.2f}%)"
    )
