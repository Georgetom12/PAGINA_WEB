"""Configuración y keys del motor PSY"""
import os

# ── APIs Macro ─────────────────────────────────────────────
FRED_API_KEY        = os.environ.get("FRED_API_KEY",        "ef85c60cecd60e3146b4390028b66b63")
ALPHA_VANTAGE_KEY   = os.environ.get("ALPHA_VANTAGE_KEY",   "TLV88R7X624ETACC")
FMP_API_KEY         = os.environ.get("FMP_API_KEY",         "InRRPPMTaJEPxoyTGrwE1qNynA5VTz8Q")
NEWS_API_KEY        = os.environ.get("NEWS_API_KEY",        "08cd85e5e91147f4bb40d80e976a0b8b")
DUNE_API_KEY        = os.environ.get("DUNE_API_KEY",        "EwA7IIFw8YtZcLumxirsb16mzKjZzBnt")
CMC_API_KEY         = os.environ.get("CMC_API_KEY",         "f297b06658cd428cb82be277130c9af1")
OKX_API_KEY         = os.environ.get("OKX_API_KEY",         "c78ab878-6781-4938-9543-9000991e63c0")

# ── Exchanges Crypto ───────────────────────────────────────
BINANCE_BASE        = "https://api.binance.com"
BINANCE_FUTURES     = "https://fapi.binance.com"
BYBIT_BASE          = "https://api.bybit.com"
OKX_BASE            = "https://www.okx.com"

# ── Macro símbolos ─────────────────────────────────────────
MACRO_SYMBOLS = {
    # Índices de miedo/riesgo
    "DXY":   {"name": "Dólar Index",    "source": "alpha_vantage", "symbol": "DX-Y.NYB"},
    "VIX":   {"name": "VIX Fear Index", "source": "alpha_vantage", "symbol": "^VIX"},
    "SPX":   {"name": "S&P 500",        "source": "alpha_vantage", "symbol": "SPY"},
    "NDX":   {"name": "Nasdaq 100",     "source": "alpha_vantage", "symbol": "QQQ"},
    "TNX":   {"name": "Bonos 10Y",      "source": "fred",          "symbol": "DGS10"},
    "GOLD":  {"name": "Gold XAU/USD",   "source": "alpha_vantage", "symbol": "GLD"},
    "OIL":   {"name": "WTI Crude",      "source": "alpha_vantage", "symbol": "USO"},
    # Las 7 Magníficas
    "NVDA":  {"name": "NVIDIA",         "source": "alpha_vantage", "symbol": "NVDA"},
    "AAPL":  {"name": "Apple",          "source": "alpha_vantage", "symbol": "AAPL"},
    "MSFT":  {"name": "Microsoft",      "source": "alpha_vantage", "symbol": "MSFT"},
    "GOOGL": {"name": "Alphabet",       "source": "alpha_vantage", "symbol": "GOOGL"},
    "AMZN":  {"name": "Amazon",         "source": "alpha_vantage", "symbol": "AMZN"},
    "META":  {"name": "Meta",           "source": "alpha_vantage", "symbol": "META"},
    "TSLA":  {"name": "Tesla",          "source": "alpha_vantage", "symbol": "TSLA"},
    # Forex
    "EURUSD": {"name": "EUR/USD",       "source": "alpha_vantage", "symbol": "EURUSD"},
    "USDJPY": {"name": "USD/JPY",       "source": "alpha_vantage", "symbol": "USDJPY"},
}

CRYPTO_BASE = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"]

TIMEFRAMES = ["15m", "1h", "4h", "1d", "1w"]

DB_PATH = os.environ.get("DATABASE_URL", "sqlite:///psy_motor.db")
