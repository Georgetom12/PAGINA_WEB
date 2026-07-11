"""
PSY MOTOR — CURSOR 1: LIBRO DE DATOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Extrae y almacena TODO el historial necesario:
  - OHLCV crypto (Binance/Bybit/OKX)
  - Funding rates reales
  - Open Interest
  - CVD acumulado
  - Macro: DXY, VIX, SPX, NDX, Bonos 10Y
  - Las 7 Magníficas
  - Forex: EUR/USD, USD/JPY
  - Commodities: Gold, Oil
  - Noticias macro relevantes
  - On-chain (Dune Analytics)
"""
from __future__ import annotations
import asyncio
import aiohttp
import logging
import time
import json
import sqlite3
import os
from datetime import datetime, timezone, timedelta
from typing import Optional
import pandas as pd

log = logging.getLogger(__name__)

# ══════════════════════════════════════════════════════════
# KEYS
# ══════════════════════════════════════════════════════════
FRED_KEY   = os.environ.get("FRED_API_KEY",      "ef85c60cecd60e3146b4390028b66b63")
AV_KEY     = os.environ.get("ALPHA_VANTAGE_KEY", "TLV88R7X624ETACC")
FMP_KEY    = os.environ.get("FMP_API_KEY",       "InRRPPMTaJEPxoyTGrwE1qNynA5VTz8Q")
CMC_KEY    = os.environ.get("CMC_API_KEY",       "f297b06658cd428cb82be277130c9af1")
NEWS_KEY   = os.environ.get("NEWS_API_KEY",      "08cd85e5e91147f4bb40d80e976a0b8b")
DUNE_KEY   = os.environ.get("DUNE_API_KEY",      "EwA7IIFw8YtZcLumxirsb16mzKjZzBnt")
OKX_KEY    = os.environ.get("OKX_API_KEY",       "c78ab878-6781-4938-9543-9000991e63c0")

# ══════════════════════════════════════════════════════════
# BASE DE DATOS — LIBRO DE DATOS
# ══════════════════════════════════════════════════════════
DB_PATH = os.environ.get("PSY_MOTOR_DB", "/tmp/psy_motor.db")

def init_db():
    """Inicializa el libro de datos SQLite."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Tabla OHLCV crypto
    c.execute('''CREATE TABLE IF NOT EXISTS ohlcv_crypto (
        symbol TEXT, timeframe TEXT, timestamp INTEGER,
        open REAL, high REAL, low REAL, close REAL, volume REAL,
        PRIMARY KEY (symbol, timeframe, timestamp)
    )''')

    # Tabla OHLCV macro (stocks, indices, forex)
    c.execute('''CREATE TABLE IF NOT EXISTS ohlcv_macro (
        symbol TEXT, timeframe TEXT, timestamp INTEGER,
        open REAL, high REAL, low REAL, close REAL, volume REAL,
        PRIMARY KEY (symbol, timeframe, timestamp)
    )''')

    # Tabla funding rates
    c.execute('''CREATE TABLE IF NOT EXISTS funding_rates (
        symbol TEXT, timestamp INTEGER,
        rate REAL, source TEXT,
        PRIMARY KEY (symbol, timestamp)
    )''')

    # Tabla open interest
    c.execute('''CREATE TABLE IF NOT EXISTS open_interest (
        symbol TEXT, timestamp INTEGER,
        oi REAL, oi_change_pct REAL, source TEXT,
        PRIMARY KEY (symbol, timestamp)
    )''')

    # Tabla macro indicators (FRED: DXY, VIX, Bonos)
    c.execute('''CREATE TABLE IF NOT EXISTS macro_indicators (
        symbol TEXT, timestamp INTEGER,
        value REAL, source TEXT,
        PRIMARY KEY (symbol, timestamp)
    )''')

    # Tabla correlaciones
    c.execute('''CREATE TABLE IF NOT EXISTS correlaciones (
        symbol TEXT, macro TEXT, timeframe TEXT,
        timestamp INTEGER, correlation REAL,
        PRIMARY KEY (symbol, macro, timeframe, timestamp)
    )''')

    # Tabla noticias
    c.execute('''CREATE TABLE IF NOT EXISTS noticias (
        id TEXT PRIMARY KEY, titulo TEXT, fuente TEXT,
        timestamp INTEGER, sentimiento REAL, relevancia REAL,
        simbolos TEXT, url TEXT
    )''')

    # Tabla señales del motor
    c.execute('''CREATE TABLE IF NOT EXISTS motor_signals (
        symbol TEXT, timestamp INTEGER,
        dictamen TEXT, confianza REAL,
        entrada REAL, sl REAL,
        tp1_corto REAL, tp2_corto REAL, tp3_corto REAL,
        tp1_macro REAL, tp2_macro REAL, tp3_macro REAL,
        zona_optima REAL, razon TEXT,
        PRIMARY KEY (symbol, timestamp)
    )''')

    conn.commit()
    conn.close()
    log.info("✅ Libro de datos inicializado")


def save_ohlcv(symbol: str, tf: str, df: pd.DataFrame, tabla: str = "ohlcv_crypto"):
    """Guarda OHLCV en el libro de datos."""
    if df is None or df.empty:
        return
    conn = sqlite3.connect(DB_PATH)
    rows = []
    for ts, row in df.iterrows():
        ts_int = int(ts.timestamp()) if hasattr(ts, 'timestamp') else int(ts)
        rows.append((
            symbol, tf, ts_int,
            float(row.get("open", 0)),
            float(row.get("high", 0)),
            float(row.get("low",  0)),
            float(row.get("close",0)),
            float(row.get("volume", 0)),
        ))
    conn.executemany(
        f"INSERT OR REPLACE INTO {tabla} VALUES (?,?,?,?,?,?,?,?)", rows
    )
    conn.commit()
    conn.close()


def load_ohlcv(symbol: str, tf: str, limit: int = 1000,
               tabla: str = "ohlcv_crypto") -> Optional[pd.DataFrame]:
    """Carga OHLCV del libro de datos."""
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql(
        f"SELECT * FROM {tabla} WHERE symbol=? AND timeframe=? "
        f"ORDER BY timestamp DESC LIMIT ?",
        conn, params=(symbol, tf, limit)
    )
    conn.close()
    if df.empty:
        return None
    df["datetime"] = pd.to_datetime(df["timestamp"], unit="s")
    df = df.set_index("datetime").sort_index()
    return df[["open","high","low","close","volume"]]


# ══════════════════════════════════════════════════════════
# EXTRACTOR CRYPTO — BINANCE → BYBIT → OKX
# ══════════════════════════════════════════════════════════
TF_MAP_BINANCE = {
    "1m":"1m","3m":"3m","5m":"5m","15m":"15m","30m":"30m",
    "1h":"1h","2h":"2h","4h":"4h","6h":"6h","8h":"8h","12h":"12h",
    "1d":"1d","3d":"3d","1w":"1w","1M":"1M"
}

async def fetch_ohlcv_binance(symbol: str, tf: str,
                               limit: int = 1000) -> Optional[pd.DataFrame]:
    """Descarga OHLCV de Binance."""
    url = f"https://api.binance.com/api/v3/klines"
    params = {"symbol": symbol, "interval": TF_MAP_BINANCE.get(tf, "4h"),
              "limit": limit}
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(url, params=params,
                             timeout=aiohttp.ClientTimeout(total=15)) as r:
                if r.status != 200:
                    return None
                data = await r.json()
        if not data:
            return None
        df = pd.DataFrame(data, columns=[
            "timestamp","open","high","low","close","volume",
            "close_time","quote_vol","trades","taker_buy_base",
            "taker_buy_quote","ignore"
        ])
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
        df = df.set_index("timestamp")
        df = df[["open","high","low","close","volume"]].astype(float)
        log.info(f"✅ Binance {symbol}/{tf}: {len(df)} velas")
        return df
    except Exception as e:
        log.warning(f"Binance {symbol}/{tf}: {e}")
        return None


async def fetch_ohlcv_bybit(symbol: str, tf: str,
                             limit: int = 1000) -> Optional[pd.DataFrame]:
    """Fallback OHLCV Bybit."""
    tf_map = {"1m":"1","5m":"5","15m":"15","30m":"30",
              "1h":"60","4h":"240","1d":"D","1w":"W"}
    interval = tf_map.get(tf, "240")
    url = "https://api.bybit.com/v5/market/kline"
    params = {"symbol": symbol, "interval": interval, "limit": min(limit, 200)}
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(url, params=params,
                             timeout=aiohttp.ClientTimeout(total=15)) as r:
                data = await r.json()
        lst = data.get("result", {}).get("list", [])
        if not lst:
            return None
        df = pd.DataFrame(lst, columns=["timestamp","open","high","low","close","volume","turnover"])
        df["timestamp"] = pd.to_datetime(df["timestamp"].astype(int), unit="ms")
        df = df.set_index("timestamp").sort_index()
        df = df[["open","high","low","close","volume"]].astype(float)
        log.info(f"✅ Bybit {symbol}/{tf}: {len(df)} velas")
        return df
    except Exception as e:
        log.warning(f"Bybit {symbol}/{tf}: {e}")
        return None


async def fetch_ohlcv_okx(symbol: str, tf: str,
                          limit: int = 300) -> Optional[pd.DataFrame]:
    """Fallback OHLCV OKX."""
    tf_map = {"1m":"1m","5m":"5m","15m":"15m","30m":"30m",
              "1h":"1H","4h":"4H","1d":"1Dutc","1w":"1Wutc"}
    bar = tf_map.get(tf, "4H")
    okx_sym = symbol.replace("USDT", "-USDT")
    url = "https://www.okx.com/api/v5/market/candles"
    params = {"instId": okx_sym, "bar": bar, "limit": min(limit, 300)}
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(url, params=params,
                             timeout=aiohttp.ClientTimeout(total=15)) as r:
                data = await r.json(content_type=None)
        lst = data.get("data", [])
        if not lst:
            return None
        # OKX: [ts, open, high, low, close, vol, volCcy, volCcyQuote, confirm]
        rows = []
        for c in lst:
            rows.append({
                "timestamp": pd.to_datetime(int(c[0]), unit="ms"),
                "open":   float(c[1]),
                "high":   float(c[2]),
                "low":    float(c[3]),
                "close":  float(c[4]),
                "volume": float(c[5]),
            })
        df = pd.DataFrame(rows).set_index("timestamp").sort_index()
        log.info(f"✅ OKX {symbol}/{tf}: {len(df)} velas")
        return df
    except Exception as e:
        log.warning(f"OKX {symbol}/{tf}: {e}")
        return None



async def fetch_ohlcv_gate(symbol: str, tf: str,
                            limit: int = 300) -> Optional[pd.DataFrame]:
    """Gate.io OHLCV — gratis sin key."""
    tf_map = {"1m":"1m","5m":"5m","15m":"15m","30m":"30m",
              "1h":"1h","4h":"4h","1d":"1d","1w":"1w"}
    interval = tf_map.get(tf, "4h")
    # Gate.io usa _ en vez de nada: BTC_USDT
    gate_sym = symbol.replace("USDT", "_USDT")
    url = "https://api.gateio.ws/api/v4/spot/candlesticks"
    params = {"currency_pair": gate_sym, "interval": interval, "limit": min(limit, 1000)}
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(url, params=params,
                             timeout=aiohttp.ClientTimeout(total=15)) as r:
                if r.status != 200:
                    return None
                data = await r.json(content_type=None)
        if not data:
            return None
        # Gate: [timestamp, volume, close, high, low, open, ...]
        rows = []
        for c in data:
            rows.append({
                "timestamp": pd.to_datetime(int(c[0]), unit="s"),
                "open":   float(c[5]),
                "high":   float(c[3]),
                "low":    float(c[4]),
                "close":  float(c[2]),
                "volume": float(c[1]),
            })
        df = pd.DataFrame(rows).set_index("timestamp").sort_index()
        log.info(f"✅ Gate.io {symbol}/{tf}: {len(df)} velas")
        return df
    except Exception as e:
        log.warning(f"Gate.io {symbol}/{tf}: {e}")
        return None


async def fetch_ohlcv_mexc(symbol: str, tf: str,
                            limit: int = 300) -> Optional[pd.DataFrame]:
    """MEXC OHLCV — gratis sin key."""
    tf_map = {"1m":"1m","5m":"5m","15m":"15m","30m":"30m",
              "1h":"60m","4h":"4h","1d":"1d","1w":"1W"}
    interval = tf_map.get(tf, "4h")
    url = "https://api.mexc.com/api/v3/klines"
    params = {"symbol": symbol, "interval": interval, "limit": min(limit, 1000)}
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(url, params=params,
                             timeout=aiohttp.ClientTimeout(total=15)) as r:
                if r.status != 200:
                    return None
                data = await r.json(content_type=None)
        if not data:
            return None
        # MEXC igual que Binance: [ts, open, high, low, close, vol, ...]
        rows = []
        for c in data:
            rows.append({
                "timestamp": pd.to_datetime(int(c[0]), unit="ms"),
                "open":   float(c[1]),
                "high":   float(c[2]),
                "low":    float(c[3]),
                "close":  float(c[4]),
                "volume": float(c[5]),
            })
        df = pd.DataFrame(rows).set_index("timestamp").sort_index()
        log.info(f"✅ MEXC {symbol}/{tf}: {len(df)} velas")
        return df
    except Exception as e:
        log.warning(f"MEXC {symbol}/{tf}: {e}")
        return None


async def fetch_ohlcv_kucoin(symbol: str, tf: str,
                              limit: int = 300) -> Optional[pd.DataFrame]:
    """KuCoin OHLCV — gratis sin key."""
    tf_map = {"1m":"1min","5m":"5min","15m":"15min","30m":"30min",
              "1h":"1hour","4h":"4hour","1d":"1day","1w":"1week"}
    interval = tf_map.get(tf, "4hour")
    # KuCoin usa - : BTC-USDT
    kc_sym = symbol[:-4] + "-USDT"
    url = "https://api.kucoin.com/api/v1/market/candles"
    params = {"symbol": kc_sym, "type": interval}
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(url, params=params,
                             timeout=aiohttp.ClientTimeout(total=15)) as r:
                if r.status != 200:
                    return None
                data = await r.json(content_type=None)
        lst = data.get("data", [])
        if not lst:
            return None
        # KuCoin: [timestamp, open, close, high, low, volume, turnover]
        rows = []
        for c in lst[:limit]:
            rows.append({
                "timestamp": pd.to_datetime(int(c[0]), unit="s"),
                "open":   float(c[1]),
                "high":   float(c[3]),
                "low":    float(c[4]),
                "close":  float(c[2]),
                "volume": float(c[5]),
            })
        df = pd.DataFrame(rows).set_index("timestamp").sort_index()
        log.info(f"✅ KuCoin {symbol}/{tf}: {len(df)} velas")
        return df
    except Exception as e:
        log.warning(f"KuCoin {symbol}/{tf}: {e}")
        return None

async def fetch_ohlcv_crypto(symbol: str, tf: str,
                              limit: int = 1000) -> Optional[pd.DataFrame]:
    """
    Fetch OHLCV crypto con fallback de 7 exchanges:
    Binance → OKX → Gate.io → MEXC → KuCoin → Bybit → DB
    """
    exchanges = [
        ("Binance",  fetch_ohlcv_binance),
        ("OKX",      fetch_ohlcv_okx),
        ("Gate.io",  fetch_ohlcv_gate),
        ("MEXC",     fetch_ohlcv_mexc),
        ("KuCoin",   fetch_ohlcv_kucoin),
        ("Bybit",    fetch_ohlcv_bybit),
    ]

    for name, fetcher in exchanges:
        try:
            df = await fetcher(symbol, tf, min(limit, 300))
            if df is not None and len(df) > 10:
                save_ohlcv(symbol, tf, df, "ohlcv_crypto")
                return df
        except Exception as e:
            log.debug(f"{name} {symbol}/{tf}: {e}")

    # Último recurso: DB local
    df = load_ohlcv(symbol, tf, limit, "ohlcv_crypto")
    if df is not None:
        log.info(f"📚 DB {symbol}/{tf}: {len(df)} velas")
    return df


# ══════════════════════════════════════════════════════════
# EXTRACTOR MACRO — ALPHA VANTAGE + FRED + FMP
# ══════════════════════════════════════════════════════════
async def fetch_macro_av(symbol: str, tf: str = "daily") -> Optional[pd.DataFrame]:
    """Descarga datos macro de Alpha Vantage (stocks, ETFs, forex)."""
    func_map = {
        "daily":  "TIME_SERIES_DAILY",
        "weekly": "TIME_SERIES_WEEKLY",
        "1h":     "TIME_SERIES_INTRADAY",
    }
    func = func_map.get(tf, "TIME_SERIES_DAILY")
    params = {
        "function":   func,
        "symbol":     symbol,
        "outputsize": "full",
        "apikey":     AV_KEY,
    }
    if tf == "1h":
        params["interval"] = "60min"

    try:
        async with aiohttp.ClientSession() as s:
            async with s.get("https://www.alphavantage.co/query",
                             params=params,
                             timeout=aiohttp.ClientTimeout(total=20)) as r:
                data = await r.json()

        # Buscar la clave de datos
        key = next((k for k in data if "Time Series" in k), None)
        if not key:
            log.warning(f"AV {symbol}: {list(data.keys())[:2]}")
            return None

        ts = data[key]
        rows = []
        for dt, vals in sorted(ts.items()):
            rows.append({
                "datetime": dt,
                "open":   float(vals.get("1. open",   vals.get("1. open",  0))),
                "high":   float(vals.get("2. high",   vals.get("2. high",  0))),
                "low":    float(vals.get("3. low",    vals.get("3. low",   0))),
                "close":  float(vals.get("4. close",  vals.get("4. close", 0))),
                "volume": float(vals.get("5. volume", 0)),
            })
        if not rows:
            return None
        df = pd.DataFrame(rows)
        df["datetime"] = pd.to_datetime(df["datetime"])
        df = df.set_index("datetime").sort_index()
        log.info(f"✅ AV {symbol}/{tf}: {len(df)} velas")
        save_ohlcv(symbol, tf, df, "ohlcv_macro")
        return df
    except Exception as e:
        log.warning(f"AV {symbol}: {e}")
        return None


async def fetch_fred(series_id: str) -> Optional[dict]:
    """Descarga datos macro de FRED (Fed Reserve)."""
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id":      series_id,
        "api_key":        FRED_KEY,
        "file_type":      "json",
        "observation_start": "2020-01-01",
        "sort_order":     "desc",
        "limit":          500,
    }
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(url, params=params,
                             timeout=aiohttp.ClientTimeout(total=15)) as r:
                data = await r.json()
        obs = data.get("observations", [])
        if not obs:
            return None
        result = {o["date"]: float(o["value"]) for o in obs
                  if o["value"] not in (".", "")}
        log.info(f"✅ FRED {series_id}: {len(result)} puntos")
        return result
    except Exception as e:
        log.warning(f"FRED {series_id}: {e}")
        return None


async def fetch_macro_fmp(symbol: str) -> Optional[dict]:
    """Datos fundamentales via Financial Modeling Prep."""
    url = f"https://financialmodelingprep.com/api/v3/quote/{symbol}"
    params = {"apikey": FMP_KEY}
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(url, params=params,
                             timeout=aiohttp.ClientTimeout(total=10)) as r:
                data = await r.json()
        if not data:
            return None
        d = data[0]
        return {
            "price":         d.get("price", 0),
            "change_pct":    d.get("changesPercentage", 0),
            "market_cap":    d.get("marketCap", 0),
            "volume":        d.get("volume", 0),
            "avg_volume":    d.get("avgVolume", 0),
            "pe":            d.get("pe", 0),
            "eps":           d.get("eps", 0),
            "name":          d.get("name", symbol),
        }
    except Exception as e:
        log.warning(f"FMP {symbol}: {e}")
        return None


# ══════════════════════════════════════════════════════════
# EXTRACTOR FUNDING + OI
# ══════════════════════════════════════════════════════════
async def fetch_funding(symbol: str) -> dict:
    """Funding rate real Binance → Bybit → OKX."""
    async with aiohttp.ClientSession() as s:
        # Binance
        try:
            url = "https://fapi.binance.com/fapi/v1/premiumIndex"
            async with s.get(url, params={"symbol": symbol},
                             timeout=aiohttp.ClientTimeout(total=6)) as r:
                if r.status == 200:
                    d = await r.json()
                    rate = float(d.get("lastFundingRate", 0))
                    return {"rate": rate, "rate_pct": round(rate*100, 4),
                            "source": "Binance", "longs_pay": rate > 0,
                            "shorts_pay": rate < 0, "squeeze_risk": rate < -0.05}
        except: pass

        # Bybit
        try:
            url = "https://api.bybit.com/v5/market/funding/history"
            async with s.get(url, params={"symbol": symbol, "limit": 1},
                             timeout=aiohttp.ClientTimeout(total=6)) as r:
                if r.status == 200:
                    d = await r.json()
                    lst = d.get("result", {}).get("list", [])
                    if lst:
                        rate = float(lst[0].get("fundingRate", 0))
                        return {"rate": rate, "rate_pct": round(rate*100, 4),
                                "source": "Bybit", "longs_pay": rate > 0,
                                "shorts_pay": rate < 0, "squeeze_risk": rate < -0.05}
        except: pass

        # OKX
        try:
            okx_sym = symbol.replace("USDT", "-USDT-SWAP")
            url = "https://www.okx.com/api/v5/public/funding-rate"
            async with s.get(url, params={"instId": okx_sym},
                             timeout=aiohttp.ClientTimeout(total=6)) as r:
                if r.status == 200:
                    d = await r.json()
                    lst = d.get("data", [])
                    if lst:
                        rate = float(lst[0].get("fundingRate", 0))
                        return {"rate": rate, "rate_pct": round(rate*100, 4),
                                "source": "OKX", "longs_pay": rate > 0,
                                "shorts_pay": rate < 0, "squeeze_risk": rate < -0.05}
        except: pass

    return {"rate": 0, "rate_pct": 0, "source": "N/A",
            "longs_pay": False, "shorts_pay": False, "squeeze_risk": False}


async def fetch_oi(symbol: str) -> dict:
    """Open Interest real Binance → Bybit."""
    async with aiohttp.ClientSession() as s:
        try:
            url = "https://fapi.binance.com/fapi/v1/openInterest"
            async with s.get(url, params={"symbol": symbol},
                             timeout=aiohttp.ClientTimeout(total=6)) as r:
                if r.status == 200:
                    d = await r.json()
                    oi = float(d.get("openInterest", 0))
                    price = float(d.get("time", 0))
                    return {"oi": oi, "oi_usd": 0, "source": "Binance",
                            "oi_change_pct": 0}
        except: pass

        try:
            url = "https://api.bybit.com/v5/market/open-interest"
            async with s.get(url, params={"symbol": symbol,
                                           "intervalTime": "1h", "limit": 2},
                             timeout=aiohttp.ClientTimeout(total=6)) as r:
                if r.status == 200:
                    d = await r.json()
                    lst = d.get("result", {}).get("list", [])
                    if lst:
                        oi = float(lst[0].get("openInterest", 0))
                        oi_prev = float(lst[1].get("openInterest", oi)) if len(lst)>1 else oi
                        change = (oi - oi_prev) / max(oi_prev, 1) * 100
                        return {"oi": oi, "oi_usd": 0, "source": "Bybit",
                                "oi_change_pct": round(change, 2)}
        except: pass

    return {"oi": 0, "oi_usd": 0, "source": "N/A", "oi_change_pct": 0}


# ══════════════════════════════════════════════════════════
# NOTICIAS MACRO
# ══════════════════════════════════════════════════════════
async def fetch_noticias_macro() -> list:
    """Noticias macro relevantes via NewsAPI."""
    url = "https://newsapi.org/v2/everything"
    params = {
        "q": "Federal Reserve OR Bitcoin OR crypto OR DXY OR inflation",
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 20,
        "apiKey": NEWS_KEY,
    }
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(url, params=params,
                             timeout=aiohttp.ClientTimeout(total=10)) as r:
                data = await r.json()
        articles = data.get("articles", [])
        noticias = []
        for a in articles:
            # Score de relevancia básico
            title = a.get("title", "").lower()
            relevancia = 1.0
            if any(w in title for w in ["fed", "rate", "inflation", "btc", "bitcoin"]):
                relevancia = 2.0
            if any(w in title for w in ["crash", "rally", "surge", "plunge"]):
                relevancia *= 1.5

            noticias.append({
                "titulo":     a.get("title", ""),
                "fuente":     a.get("source", {}).get("name", ""),
                "url":        a.get("url", ""),
                "timestamp":  a.get("publishedAt", ""),
                "relevancia": relevancia,
            })
        log.info(f"✅ Noticias: {len(noticias)} artículos")
        return noticias
    except Exception as e:
        log.warning(f"NewsAPI: {e}")
        return []



# ══════════════════════════════════════════════════════════
# TOP SÍMBOLOS — CoinGecko → CryptoPanic → CMC → Binance
# ══════════════════════════════════════════════════════════
_top_cache = []
_top_cache_ts = 0

async def fetch_top_symbols(limit: int = 200) -> list:
    """
    Top símbolos crypto por market cap + noticias.
    Fallback: CoinGecko → CryptoPanic → CMC → Binance volumen
    """
    global _top_cache, _top_cache_ts
    import time
    if _top_cache and time.time() - _top_cache_ts < 3600:
        return _top_cache

    symbols = []

    # ── 0. OKX primero — funciona desde Railway ──────────
    try:
        url = "https://www.okx.com/api/v5/market/tickers"
        params = {"instType": "SPOT"}
        async with aiohttp.ClientSession() as s:
            async with s.get(url, params=params,
                             timeout=aiohttp.ClientTimeout(total=15)) as r:
                if r.status == 200:
                    data = await r.json()
                    tickers = [d for d in data.get("data", [])
                              if d["instId"].endswith("-USDT")]
                    tickers.sort(key=lambda x: float(x.get("volCcy24h",0)), reverse=True)
                    symbols = [d["instId"].replace("-USDT","USDT") for d in tickers[:500]]
                    log.info(f"✅ OKX primero: {len(symbols)} simbolos")
    except Exception as e:
        log.warning(f"OKX primero: {e}")

    # ── 1. CoinGecko (sin key, gratis) ───────────────────
    try:
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {
            "vs_currency": "usd",
            "order": "market_cap_desc",
            "per_page": 200,
            "page": 1,
            "sparkline": False,
        }
        async with aiohttp.ClientSession() as s:
            async with s.get(url, params=params,
                             timeout=aiohttp.ClientTimeout(total=15)) as r:
                if r.status == 200:
                    data = await r.json()
                    for coin in data:
                        sym = coin.get("symbol", "").upper() + "USDT"
                        symbols.append(sym)
                    log.info(f"✅ CoinGecko: {len(symbols)} símbolos")
    except Exception as e:
        log.warning(f"CoinGecko: {e}")

    # ── 1b. Gate.io también funciona bien ────────────────
    if len(symbols) < 100:
        try:
            url = "https://api.gateio.ws/api/v4/spot/tickers"
            async with aiohttp.ClientSession() as s:
                async with s.get(url, timeout=aiohttp.ClientTimeout(total=15)) as r:
                    if r.status == 200:
                        data = await r.json(content_type=None)
                        tickers = [d for d in data if d.get("currency_pair","").endswith("_USDT")]
                        tickers.sort(key=lambda x: float(x.get("quote_volume",0)), reverse=True)
                        gate_syms = [d["currency_pair"].replace("_USDT","USDT") for d in tickers[:200]]
                        for s in gate_syms:
                            if s not in symbols:
                                symbols.append(s)
                        log.info(f"✅ Gate.io agregado: {len(symbols)} total")
        except Exception as e:
            log.warning(f"Gate.io merge: {e}")

    # ── 2. CryptoPanic (noticias hot, sin key) ────────────
    if not symbols:
        try:
            url = "https://cryptopanic.com/api/free/v1/posts/"
            params = {"filter": "hot", "kind": "news", "public": "true"}
            async with aiohttp.ClientSession() as s:
                async with s.get(url, params=params,
                                 timeout=aiohttp.ClientTimeout(total=10)) as r:
                    if r.status == 200:
                        data = await r.json()
                        for post in data.get("results", []):
                            for cur in post.get("currencies", []):
                                sym = cur.get("code", "").upper() + "USDT"
                                if sym not in symbols:
                                    symbols.append(sym)
                        log.info(f"✅ CryptoPanic: {len(symbols)} símbolos")
        except Exception as e:
            log.warning(f"CryptoPanic: {e}")

    # ── 3. CMC (ya tenemos key) ───────────────────────────
    if not symbols:
        try:
            url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest"
            headers = {"X-CMC_PRO_API_KEY": CMC_KEY}
            params  = {"limit": 200, "convert": "USD"}
            async with aiohttp.ClientSession() as s:
                async with s.get(url, headers=headers, params=params,
                                 timeout=aiohttp.ClientTimeout(total=15)) as r:
                    if r.status == 200:
                        data = await r.json()
                        for coin in data.get("data", []):
                            sym = coin.get("symbol", "").upper() + "USDT"
                            symbols.append(sym)
                        log.info(f"✅ CMC: {len(symbols)} símbolos")
        except Exception as e:
            log.warning(f"CMC: {e}")

    # ── 4. Binance por volumen (último recurso) ───────────
    if not symbols:
        try:
            url = "https://api.binance.com/api/v3/ticker/24hr"
            async with aiohttp.ClientSession() as s:
                async with s.get(url, timeout=aiohttp.ClientTimeout(total=15)) as r:
                    if r.status == 200:
                        data = await r.json()
                        usdt = [d for d in data if d["symbol"].endswith("USDT")]
                        usdt.sort(key=lambda x: float(x.get("quoteVolume",0)), reverse=True)
                        symbols = [d["symbol"] for d in usdt[:200]]
                        log.info(f"✅ Binance volumen: {len(symbols)} símbolos")
        except Exception as e:
            log.warning(f"Binance volumen: {e}")

    # ── 5. OKX por volumen ────────────────────────────────
    if not symbols:
        try:
            url = "https://www.okx.com/api/v5/market/tickers"
            params = {"instType": "SPOT"}
            async with aiohttp.ClientSession() as s:
                async with s.get(url, params=params,
                                 timeout=aiohttp.ClientTimeout(total=15)) as r:
                    if r.status == 200:
                        data = await r.json()
                        tickers = [d for d in data.get("data", [])
                                  if d["instId"].endswith("-USDT")]
                        tickers.sort(key=lambda x: float(x.get("volCcy24h",0)), reverse=True)
                        symbols = [d["instId"].replace("-USDT","USDT") for d in tickers[:200]]
                        log.info(f"✅ OKX volumen: {len(symbols)} símbolos")
        except Exception as e:
            log.warning(f"OKX volumen: {e}")

    # ── 6. Gate.io por volumen ────────────────────────────
    if not symbols:
        try:
            url = "https://api.gateio.ws/api/v4/spot/tickers"
            async with aiohttp.ClientSession() as s:
                async with s.get(url, timeout=aiohttp.ClientTimeout(total=15)) as r:
                    if r.status == 200:
                        data = await r.json(content_type=None)
                        tickers = [d for d in data if d.get("currency_pair","").endswith("_USDT")]
                        tickers.sort(key=lambda x: float(x.get("quote_volume",0)), reverse=True)
                        symbols = [d["currency_pair"].replace("_USDT","USDT") for d in tickers[:200]]
                        log.info(f"✅ Gate.io volumen: {len(symbols)} símbolos")
        except Exception as e:
            log.warning(f"Gate.io top: {e}")

    # ── 7. MEXC por volumen ───────────────────────────────
    if not symbols:
        try:
            url = "https://api.mexc.com/api/v3/ticker/24hr"
            async with aiohttp.ClientSession() as s:
                async with s.get(url, timeout=aiohttp.ClientTimeout(total=15)) as r:
                    if r.status == 200:
                        data = await r.json(content_type=None)
                        tickers = [d for d in data if d.get("symbol","").endswith("USDT")]
                        tickers.sort(key=lambda x: float(x.get("quoteVolume",0)), reverse=True)
                        symbols = [d["symbol"] for d in tickers[:200]]
                        log.info(f"✅ MEXC volumen: {len(symbols)} símbolos")
        except Exception as e:
            log.warning(f"MEXC top: {e}")

    # Filtrar stablecoins y tokens sin sentido
    stables = {"USDTUSDT","USDCUSDT","BUSDUSDT","DAIUSDT","TUSDUSDT",
               "FRAXUSDT","USDPUSDT","GUSDUSDT","USDDUSDT","AEUSDUSDT"}
    symbols = [s for s in symbols if s not in stables and len(s) > 4]

    # Deduplicar manteniendo orden
    seen = set()
    unique = []
    for s in symbols:
        if s not in seen:
            seen.add(s)
            unique.append(s)

    _top_cache    = unique[:500]
    _top_cache_ts = time.time()
    log.info(f"✅ Top símbolos final: {len(_top_cache)}")
    return _top_cache

# ══════════════════════════════════════════════════════════
# FUNCIÓN PRINCIPAL — Actualizar libro completo
# ══════════════════════════════════════════════════════════
async def actualizar_libro(symbol: str, tfs: list = None) -> dict:
    """
    Actualiza el libro de datos completo para un símbolo.
    Descarga OHLCV en todos los TFs + macro + funding + OI.
    """
    if tfs is None:
        tfs = ["5m", "15m", "30m", "1h", "4h", "1d", "1w"]

    log.info(f"📚 Actualizando libro para {symbol}...")

    # OHLCV crypto en todos los TFs
    ohlcv_map = {}
    for tf in tfs:
        df = await fetch_ohlcv_crypto(symbol, tf, limit=1000)
        if df is not None:
            ohlcv_map[tf] = df

    # Funding + OI
    funding, oi = await asyncio.gather(
        fetch_funding(symbol),
        fetch_oi(symbol),
        return_exceptions=True
    )
    if isinstance(funding, Exception): funding = {}
    if isinstance(oi, Exception):      oi = {}

    log.info(f"✅ Libro actualizado {symbol}: {list(ohlcv_map.keys())}")

    return {
        "symbol":   symbol,
        "ohlcv":    ohlcv_map,
        "funding":  funding,
        "oi":       oi,
        "updated":  datetime.now(timezone.utc).isoformat(),
    }


async def actualizar_macro() -> dict:
    """Actualiza el libro con datos macro globales."""
    log.info("🌍 Actualizando macro...")

    # FRED: Bonos 10Y, DXY, inflación
    fred_series = {
        "TNX":  "DGS10",    # Bonos 10Y
        "CPI":  "CPIAUCSL", # Inflación
        "M2":   "M2SL",     # Masa monetaria
        "FEDFUNDS": "FEDFUNDS", # Tasa Fed
    }

    macro_data = {}

    # FRED en paralelo
    fred_tasks = {k: fetch_fred(v) for k, v in fred_series.items()}
    fred_results = await asyncio.gather(*fred_tasks.values(), return_exceptions=True)
    for key, result in zip(fred_tasks.keys(), fred_results):
        if not isinstance(result, Exception) and result:
            macro_data[key] = result

    # Alpha Vantage: Mag7 + Índices
    av_symbols = ["SPY", "QQQ", "GLD", "NVDA", "AAPL", "MSFT", "META", "TSLA"]
    for sym in av_symbols:
        df = await fetch_macro_av(sym, "daily")
        if df is not None:
            macro_data[sym] = df
        await asyncio.sleep(12)  # AV tiene rate limit de 5 calls/min

    log.info(f"✅ Macro actualizado: {list(macro_data.keys())}")
    return macro_data


# ══════════════════════════════════════════════════════════
# LOOP DE ACTUALIZACIÓN AUTOMÁTICA
# ══════════════════════════════════════════════════════════
async def loop_actualizacion(symbols: list, interval_min: int = 15):
    """Loop que mantiene el libro actualizado."""
    init_db()
    log.info(f"📚 Loop libro activo — actualizando cada {interval_min}min")

    cycle = 0
    while True:
        cycle += 1
        log.info(f"📚 Ciclo {cycle} — actualizando {len(symbols)} símbolos")

        for symbol in symbols:
            try:
                await actualizar_libro(symbol)
                await asyncio.sleep(2)
            except Exception as e:
                log.error(f"[{symbol}] libro error: {e}")

        # Macro cada 4 ciclos (1 hora)
        if cycle % 4 == 0:
            try:
                await actualizar_macro()
            except Exception as e:
                log.error(f"Macro update error: {e}")

        await asyncio.sleep(interval_min * 60)
