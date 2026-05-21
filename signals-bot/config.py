import os
from dotenv import load_dotenv

load_dotenv()

# ── Telegram ──────────────────────────────────────────────
BOT_TOKEN            = os.getenv("BOT_TOKEN", "")
CHANNEL_ID           = int(os.getenv("CHANNEL_ID", "0"))   # Canal de señales altcoins
ALTCOINS_CHANNEL_ID  = CHANNEL_ID                          # Alias (este bot solo usa un canal)
ADMIN_IDS            = [int(x) for x in os.getenv("ADMIN_IDS", "0").split(",") if x]

# ── Pagos ─────────────────────────────────────────────────
PAYPAL_EMAIL    = os.getenv("PAYPAL_EMAIL", "tu@paypal.com")
BINANCE_PAY_ID  = os.getenv("BINANCE_PAY_ID", "TU_ID_BINANCE")
BANK_INFO       = os.getenv("BANK_INFO", "Banco: XYZ | Cuenta: 0000-0000 | Titular: Tu Nombre")

# ── Membresía ─────────────────────────────────────────────
PRICE_MONTHLY   = 5.0   # USD
PLAN_DAYS       = 30

# ── Base de datos ─────────────────────────────────────────
DATABASE_URL    = os.getenv("DATABASE_URL", "sqlite:///signals_bot.db")

# ── Web admin ─────────────────────────────────────────────
WEB_PORT        = int(os.getenv("PORT", "8080"))
ADMIN_PASSWORD  = os.getenv("ADMIN_PASSWORD", "cambia_esta_clave")
SECRET_KEY      = os.getenv("SECRET_KEY", "jwt_secret_muy_seguro")

# ── Exchange / Señales ────────────────────────────────────
EXCHANGE        = os.getenv("EXCHANGE", "binance")
DEFAULT_SYMBOLS = os.getenv("SYMBOLS", "BTCUSDT,ETHUSDT,SOLUSDT").split(",")
SIGNAL_INTERVAL = int(os.getenv("SIGNAL_INTERVAL", "900"))   # segundos (15 min)

# ── Altcoins por Tier ─────────────────────────────────────
# Tier 1 — Large caps: 4h + 1d, cooldown 3h
TIER1_SYMBOLS = [
    "BNBUSDT", "XRPUSDT", "ADAUSDT", "AVAXUSDT",
    "DOTUSDT", "LINKUSDT", "MATICUSDT",
]

# Tier 2 — Altcoins sólidas: 1h + 4h, cooldown 2h
TIER2_SYMBOLS = [
    "ATOMUSDT", "UNIUSDT",  "AAVEUSDT", "LTCUSDT",  "NEARUSDT",
    "APTUSDT",  "ARBUSDT",  "OPUSDT",   "INJUSDT",  "SUIUSDT",
    "TIAUSDT",  "JUPUSDT",  "PYTHUSDT", "WLDUSDT",  "DYDXUSDT",
    "GMXUSDT",  "SNXUSDT",  "CRVUSDT",  "LDOUSDT",  "RUNEUSDT",
]

# Tier 3 — Meme coins: 1h + 15m, cooldown 1h
TIER3_SYMBOLS = [
    "BOMEUSDT", "GIGAUSDT", "WIFUSDT",  "PEPEUSDT", "DOGEUSDT",
    "SHIBUSDT", "FLOKIUSDT","BONKUSDT", "NEIROUSDT","MOGUSDT",
]

# Tier 4 — Trending 2026: 1h + 4h, cooldown 2h
TIER4_SYMBOLS = [
    "HYPEUSDT",   "TAOUSDT",   "SEIUSDT",   "EIGENUSDT", "ENAUSDT",
    "PENDLEUSDT", "STRKUSDT",  "ZKUSDT",    "POLUSDT",   "FETUSDT",
    "RENDERUSDT", "VIRTUALUSDT","GRASSUSDT","HBARUSDT",
]

# Mapa de metadatos por tier (nombre, timeframes, cooldown_horas)
TIER_CONFIG = {
    1: {"name": "TIER 1 — Large Cap",     "timeframes": ["4h", "1d"], "cooldown": 3},
    2: {"name": "TIER 2 — Altcoin Sólida","timeframes": ["1h", "4h"], "cooldown": 2},
    3: {"name": "TIER 3 — Meme Coin",     "timeframes": ["15m", "1h"],"cooldown": 1},
    4: {"name": "TIER 4 — Trending 2026", "timeframes": ["1h", "4h"], "cooldown": 2},
}

ALTCOIN_SIGNAL_INTERVAL = int(os.getenv("ALTCOIN_SIGNAL_INTERVAL", "1800"))  # 30 min

# ── TradingView Webhooks ──────────────────────────────────
TV_WEBHOOK_SECRET   = os.getenv("TV_WEBHOOK_SECRET", "")
TV_WEBHOOK_ENABLED  = bool(TV_WEBHOOK_SECRET)

# ── Halving BTC (fechas históricas + próxima estimada) ────
HALVING_DATES = [
    "2012-11-28",
    "2016-07-09",
    "2020-05-11",
    "2024-04-19",
    "2028-03-15",  # estimada
]
