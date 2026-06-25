# PSYCHOMETRIKS — Signal Bridge v2.0

Servicio Flask que actúa como puente entre los bots de Telegram y la página web de Whale Signals.

## Pasos para deploy

### 1. Crear repo en GitHub
- Nombre: `psychometriks-signals`
- Sube toda esta carpeta `services/signals-bridge/` como raíz del repo

### 2. Railway → New Service
- Connect → GitHub repo `psychometriks-signals`
- Railway detecta `railway.toml` automáticamente

### 3. Variables de entorno en Railway
```
BRIDGE_API_KEY=psy-2026-tu-clave-secreta
MAX_SIGNALS=200
MAX_GEMS=200
MAX_CEX=100
```

### 4. Obtener la URL de Railway
- Ej: `https://psychometriks-signals.up.railway.app`

### 5. Actualizar la página HTML
En `psychometriks-whale-signals.html`, cambiar línea:
```javascript
const BRIDGE_URL = 'https://psychometriks-signals.up.railway.app';
```

### 6. Agregar BRIDGE_URL y BRIDGE_API_KEY a los bots existentes
En cada servicio de Railway (Whale Intel, WhalePerp, CEX Signals, DegenScout):
```
BRIDGE_URL=https://psychometriks-signals.up.railway.app
BRIDGE_API_KEY=psy-2026-tu-clave-secreta
```

## Endpoints del Bridge

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servicio |
| GET | `/api/signals` | Señales whale (LONG/SHORT) |
| GET | `/api/gems` | Gemas detectadas |
| GET | `/api/cex_signals` | Señales CEX (OI, Funding, Liq) |
| GET | `/api/summary` | Resumen stats |
| POST | `/api/signal` | Recibir señal (requiere API Key) |
| POST | `/api/gem` | Recibir gema (requiere API Key) |
| POST | `/api/cex_signal` | Recibir señal CEX (requiere API Key) |

## Estructura del repo GitHub
```
psychometriks-signals/
├── signal_bridge.py       ← API principal
├── bridge_utils.py        ← Utilidades compartidas
├── requirements.txt
├── Procfile
├── railway.toml
├── cex_signals_bot/
│   └── scanners/
│       ├── liquidations.py
│       ├── open_interest.py
│       ├── funding_rates.py
│       ├── fear_greed.py
│       └── long_short.py
└── degenscout_bot/
    └── scanners/
        ├── gems.py
        ├── pump_fun.py
        ├── rugcheck_scanner.py
        └── cmc_listings.py
```
