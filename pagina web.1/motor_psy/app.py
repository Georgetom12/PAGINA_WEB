"""
PSY MOTOR -- Servidor Web
P!gina con clave para ver el motor en accion
"""
import asyncio
import json
import logging
import os
import hashlib
from datetime import datetime, timezone
from aiohttp import web
from motor.libro_datos import init_db, actualizar_libro, fetch_top_symbols
from motor.macro_engine import get_macro_context, aplicar_macro_al_dictamen
from motor.memoria import (init_memoria, guardar_senal, get_contexto_memoria,
                            verificar_resultados, aprender, get_historial, get_leaderboard)
from motor.nucleo import analizar_nucleo
from motor.dictamen_motor import generar_dictamen, DictamenMotor
from motor.unified_motor import analizar_completo

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Jorem00n78945_&$")
SECRET_KEY     = os.environ.get("SECRET_KEY", "psy_motor_2026")
PORT           = int(os.environ.get("PORT", 8080))
# Secreto compartido con el api-server (Node) en Railway para llamadas
# servidor-a-servidor via header X-Internal-Secret (sin cookie de sesión).
IA_TRADING_INTERNAL_SECRET = os.environ.get("IA_TRADING_INTERNAL_SECRET", "")

# Cache de an!lisis
_cache: dict = {}
_cache_ts: dict = {}

def _check_auth(request) -> bool:
    # Camino 1: llamada servidor-a-servidor desde el api-server (Node) en Railway,
    # usando el header X-Internal-Secret (sin cookie, no pasa por /login).
    if IA_TRADING_INTERNAL_SECRET:
        internal = request.headers.get("X-Internal-Secret", "")
        if internal and internal == IA_TRADING_INTERNAL_SECRET:
            return True
    # Camino 2: sesión de navegador vía cookie (login con ADMIN_PASSWORD).
    token = request.cookies.get("psy_token")
    expected = hashlib.sha256(f"{ADMIN_PASSWORD}{SECRET_KEY}".encode()).hexdigest()
    return token == expected

def _make_token() -> str:
    return hashlib.sha256(f"{ADMIN_PASSWORD}{SECRET_KEY}".encode()).hexdigest()

# ════════════════════════════════════════════════════════
# HTML DE LA PAGINA
# ════════════════════════════════════════════════════════
LOGIN_HTML = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PSY MOTOR -- Login</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#0a0d12; color:#eceff1; font-family:'Courier New',monospace;
       display:flex; justify-content:center; align-items:center; min-height:100vh; }
.box { background:#0d1421; border:1px solid #00e5ff33; border-radius:12px;
       padding:40px; width:360px; text-align:center; }
.logo { color:#00e5ff; font-size:1.8em; font-weight:bold; letter-spacing:4px; margin-bottom:8px; }
.sub  { color:#546e7a; font-size:0.85em; margin-bottom:30px; letter-spacing:2px; }
input { width:100%; padding:12px 16px; background:#0a1628; border:1px solid #00e5ff44;
        border-radius:8px; color:#eceff1; font-family:inherit; font-size:1em;
        margin-bottom:16px; outline:none; }
input:focus { border-color:#00e5ff; }
button { width:100%; padding:12px; background:#00e5ff; color:#0a0d12;
         border:none; border-radius:8px; font-weight:bold; font-size:1em;
         cursor:pointer; letter-spacing:2px; }
button:hover { background:#00b8d4; }
.err { color:#ff1744; font-size:0.85em; margin-top:12px; }
</style>
</head>
<body>
<div class="box">
  <div class="logo">🦄 PSY MOTOR</div>
  <div class="sub">MOTOR DE ANALISIS CUANTITATIVO</div>
  <form method="POST" action="/login">
    <input type="password" name="password" placeholder="Clave de acceso" autofocus>
    <button type="submit">ACCEDER</button>
  </form>
  {error}
</div>
</body>
</html>"""

MOTOR_HTML = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PSY MOTOR 🦄</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
:root {
  --bg:     #0a0d12;
  --bg2:    #0d1421;
  --bg3:    #0f1929;
  --cyan:   #00e5ff;
  --green:  #00e676;
  --red:    #ff1744;
  --gold:   #ffd700;
  --gray:   #546e7a;
  --purple: #e040fb;
  --orange: #ff6d00;
}
body { background:var(--bg); color:#eceff1; font-family:'Courier New',monospace;
       min-height:100vh; }

/* NAV */
nav { background:var(--bg2); border-bottom:1px solid var(--cyan)22;
      padding:12px 24px; display:flex; align-items:center; gap:16px; }
.nav-logo { color:var(--cyan); font-weight:bold; font-size:1.1em; letter-spacing:3px; }
.nav-sub   { color:var(--gray); font-size:0.75em; }
.nav-right { margin-left:auto; display:flex; gap:12px; align-items:center; }
.nav-price { color:var(--gold); font-size:0.85em; }

/* MAIN */
.main { max-width:1400px; margin:0 auto; padding:24px 16px; }

/* SEARCH */
.search-bar { display:flex; gap:12px; margin-bottom:24px; }
.search-bar input { flex:1; padding:10px 16px; background:var(--bg2);
  border:1px solid var(--cyan)44; border-radius:8px; color:#eceff1;
  font-family:inherit; font-size:0.95em; outline:none; }
.search-bar input:focus { border-color:var(--cyan); }
.btn { padding:10px 20px; border:none; border-radius:8px;
       font-family:inherit; font-weight:bold; cursor:pointer;
       letter-spacing:1px; font-size:0.9em; }
.btn-cyan  { background:var(--cyan); color:var(--bg); }
.btn-gray  { background:var(--bg3); color:var(--gray); border:1px solid var(--gray)44; }
.btn-cyan:hover { background:#00b8d4; }

/* QUICK SYMBOLS */
.quick { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:24px; }
.chip { padding:6px 14px; background:var(--bg3); border:1px solid var(--cyan)22;
        border-radius:20px; font-size:0.8em; cursor:pointer; color:var(--gray);
        transition:all 0.2s; }
.chip:hover { border-color:var(--cyan); color:var(--cyan); }
.quick::-webkit-scrollbar { width:4px; }
.quick::-webkit-scrollbar-track { background:var(--bg3); }
.quick::-webkit-scrollbar-thumb { background:var(--cyan)44; border-radius:2px; }
.chip.active { background:var(--cyan)22; border-color:var(--cyan); color:var(--cyan); }

/* GRID */
.grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
@media(max-width:900px) { .grid { grid-template-columns:1fr; } }

/* CARD */
.card { background:var(--bg2); border:1px solid #ffffff11;
        border-radius:12px; padding:20px; }
.card-title { color:var(--cyan); font-size:0.75em; letter-spacing:2px;
              margin-bottom:16px; display:flex; align-items:center; gap:8px; }

/* DICTAMEN */
.dictamen-box { background:var(--bg3); border-radius:8px; padding:16px;
                margin-bottom:16px; border-left:3px solid var(--cyan); }
.dictamen-dir { font-size:1.1em; font-weight:bold; margin-bottom:8px; }
.dictamen-txt { color:#b0bec5; font-size:0.9em; line-height:1.5; }
.conf-bar { height:6px; background:#ffffff11; border-radius:3px; margin-top:12px; }
.conf-fill { height:100%; border-radius:3px; transition:width 0.5s; }

/* ZONAS */
.zonas-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.zona-item { background:var(--bg3); border-radius:8px; padding:12px; }
.zona-label { color:var(--gray); font-size:0.7em; letter-spacing:1px; margin-bottom:4px; }
.zona-value { font-size:1em; font-weight:bold; }
.zona-sub   { color:var(--gray); font-size:0.75em; margin-top:2px; }

/* TPS */
.tp-row { display:flex; justify-content:space-between; align-items:center;
          padding:8px 12px; background:var(--bg3); border-radius:6px;
          margin-bottom:6px; }
.tp-label { color:var(--gray); font-size:0.8em; }
.tp-val   { font-size:0.9em; font-weight:bold; }
.tp-green { color:var(--green); }
.tp-red   { color:var(--red); }

/* CONTEXTO */
.ctx-item { padding:6px 0; border-bottom:1px solid #ffffff08;
            font-size:0.85em; color:#b0bec5; line-height:1.4; }

/* NUCLEO INFO */
.info-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.info-item { display:flex; justify-content:space-between;
             padding:6px 10px; background:var(--bg3); border-radius:6px; }
.info-k { color:var(--gray); font-size:0.78em; }
.info-v { font-size:0.78em; font-weight:bold; }

/* STATUS */
.status-dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
.dot-green  { background:var(--green); box-shadow:0 0 6px var(--green); }
.dot-red    { background:var(--red); }
.dot-gray   { background:var(--gray); }

/* LOADING */
.loading { text-align:center; padding:60px; color:var(--gray); }
.spinner { display:inline-block; width:40px; height:40px;
           border:3px solid var(--cyan)22; border-top-color:var(--cyan);
           border-radius:50%; animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* FRACTAL BADGE */
.fractal-badge { display:inline-block; padding:3px 10px; border-radius:12px;
                 font-size:0.75em; font-weight:bold; letter-spacing:1px; }
.fractal-bear { background:var(--red)22; color:var(--red); border:1px solid var(--red)44; }
.fractal-bull { background:var(--green)22; color:var(--green); border:1px solid var(--green)44; }
.fractal-neu  { background:var(--gray)22; color:var(--gray); border:1px solid var(--gray)44; }

/* CONFLUENCIAS */
.conf-zona { display:flex; justify-content:space-between; align-items:center;
             padding:6px 10px; border-radius:6px; margin-bottom:4px;
             border-left:3px solid; }
.conf-high { background:var(--gold)11; border-color:var(--gold); }
.conf-med  { background:var(--cyan)11; border-color:var(--cyan); }
.conf-low  { background:var(--gray)11; border-color:var(--gray); }

.empty { color:var(--gray); font-size:0.85em; text-align:center; padding:20px; }
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <span class="nav-logo">🦄 PSY MOTOR</span>
  <span class="nav-sub">v1.0 -- Motor Cuantitativo</span>
  <div class="nav-right">
    <span class="status-dot dot-green"></span>
    <span style="color:var(--gray);font-size:0.8em">ONLINE</span>
    <a href="/logout" style="color:var(--gray);font-size:0.8em;text-decoration:none">Salir</a>
  </div>
</nav>

<!-- MAIN -->
<div class="main">

  <!-- SEARCH -->
  <div class="search-bar">
    <input type="text" id="symbolInput" placeholder="Ej: BTCUSDT, ETHUSDT, SOLUSDT..."
           onkeydown="if(event.key==='Enter') analizar()">
    <button class="btn btn-cyan" onclick="analizar()">🔍 ANALIZAR</button>
    <button class="btn btn-gray" onclick="limpiar()">✕</button>
  </div>

  <!-- QUICK SYMBOLS -->
  <div class="quick" id="quickChips">
    <div class="chip" onclick="setSymbol('BTCUSDT')">BTC</div>
    <div class="chip" onclick="setSymbol('ETHUSDT')">ETH</div>
    <div class="chip" onclick="setSymbol('SOLUSDT')">SOL</div>
    <div class="chip" onclick="setSymbol('BNBUSDT')">BNB</div>
    <div class="chip" onclick="setSymbol('XRPUSDT')">XRP</div>
    <div class="chip" onclick="setSymbol('LINKUSDT')">LINK</div>
    <div class="chip" onclick="setSymbol('AAVEUSDT')">AAVE</div>
    <div class="chip" onclick="setSymbol('INJUSDT')">INJ</div>
  </div>

  <!-- RESULTADO -->
  <div id="resultado"></div>

</div>

<script>
let currentSymbol = '';

function setSymbol(sym) {
  document.getElementById('symbolInput').value = sym;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
}

function limpiar() {
  document.getElementById('resultado').innerHTML = '';
  document.getElementById('symbolInput').value = '';
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  currentSymbol = '';
}


// Símbolos populares adicionales
const POPULAR_EXTRA = [
  // Meme coins
  "PEPEUSDT","SHIBUSDT","DOGEUSDT","FLOKIUSDT","BONKUSDT",
  "WIFUSDT","BOMEUSDT","MEMEUSDT","TURBOUSDT","POPCATUSDT",
  "NEIROUSDT","MOGUSDT","GOATUSDT","PNUTUSDT","ACTUSDT",
  // DeFi blue chips
  "UNIUSDT","AAVEUSDT","MKRUSDT","COMPUSDT","CRVUSDT",
  "SUSHIUSDT","LDOUSDT","RPLUSDT","FRAXUSDT","PENDLEUSDT",
  // Layer 1/2
  "BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT",
  "ADAUSDT","AVAXUSDT","DOTUSDT","MATICUSDT","NEARUSDT",
  "APTUSDT","SUIUSDT","SEIUSDT","INJUSDT","TIAUSDT",
  "ARBUSDT","OPUSDT","STRKUSDT","ZKUSDT","SCROLLUSDT",
  // Commodities crypto
  "XAUTUSDT","PAXGUSDT",        // Oro tokenizado
  "XAGUSDT",                    // Plata
  // Stocks tokenizados / correlacionados
  "NVDAUSDT","AAPLUSDT","MSTRUSDT",
  // AI tokens
  "FETUSDT","AGIXUSDT","OCEANUSDT","RENDERUSDT","WLDUSDT",
  "TAOUSDT","AIUSDT","NFPUSDT","GRTUSDT","ARKMUSDT",
  // Gaming/Metaverse
  "AXSUSDT","SANDUSDT","MANAUSDT","ENJUSDT","GALAUSDT",
  "IMXUSDT","RONUSDT","YGGUSDT","PIXELUSDT","BEAMXUSDT",
  // Exchange tokens
  "BNBUSDT","OKBUSDT","HTUUSDT","KCSUSDT","GATEUSDT",
  // Infrastructure
  "LINKUSDT","FILUSDT","ARUSDT","STORJUSDT","HIVEUSDT",
  // Popular altcoins
  "TRUMPUSDT","LTCUSDT","ETCUSDT","BCHUSDT","XLMUSDT",
  "ALGOUSDT","ICPUSDT","FLOWUSDT","HBARUSDT","QNTUSDT",
  "VETUSDT","XTZUSDT","EOSUSDT","TRXUSDT","ATOMUSDT",
  "JUPUSDT","RAYUSDT","WUSDT","JUPUSDT","PYUSDT",
  "EIGENUSDT","ENALUSDT","ENAUSDT","ETHFIUSDT","REZUSDT",
];

// Cargar top symbols al inicio
async function cargarTopSymbols() {
  try {
    const r = await fetch('/api/top-symbols');
    const data = await r.json();
    
    // Combinar API + lista popular
    let symbols = data.symbols || [];
    
    // Agregar populares que no estén ya
    POPULAR_EXTRA.forEach(s => {
      if (!symbols.includes(s)) symbols.push(s);
    });
    
    // Deduplicar y ordenar A-Z
    symbols = [...new Set(symbols)]
      .filter(s => s.endsWith('USDT') && s.length > 4)
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 500);
    
    const chips = document.getElementById('quickChips');
    chips.innerHTML = symbols.map(s =>
      `<div class="chip" onclick="setSymbol('${s}')">${s.replace('USDT','')}</div>`
    ).join('');
    
    // Hacer el contenedor scrollable
    chips.style.maxHeight = '120px';
    chips.style.overflowY = 'auto';
    chips.style.overflowX = 'hidden';
    
  } catch(e) {
    console.log('Top symbols error:', e);
  }
}

window.addEventListener('load', cargarTopSymbols);

async function analizar() {
  const symbol = document.getElementById('symbolInput').value.trim().toUpperCase();
  if (!symbol) return;

  currentSymbol = symbol;
  const res = document.getElementById('resultado');

  res.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p style="margin-top:16px;color:var(--cyan)">Analizando ${symbol}...</p>
      <p style="margin-top:8px;font-size:0.8em">Descargando datos multi-TF...</p>
    </div>`;

  try {
    const r = await fetch('/api/analizar', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({symbol})
    });
    const data = await r.json();

    if (data.error) {
      res.innerHTML = `<div class="card"><p style="color:var(--red)">${data.error}</p></div>`;
      return;
    }

    renderResultado(data);
  } catch(e) {
    res.innerHTML = `<div class="card"><p style="color:var(--red)">Error: ${e.message}</p></div>`;
  }
}

function renderResultado(d) {
  const dm = d.dictamen;
  const nr = d.nucleo;
  const res = document.getElementById('resultado');

  // Colores segun direccion
  const dirColor = dm.direccion === 'ALCISTA' ? 'var(--green)' :
                   dm.direccion === 'BAJISTA' ? 'var(--red)' : 'var(--gray)';
  const dirEmoji = dm.direccion === 'ALCISTA' ? '🟢' :
                   dm.direccion === 'BAJISTA' ? '🔴' : '⚪';
  const accionColor = dm.accion === 'ENTRAR' ? 'var(--green)' :
                      dm.accion === 'ESPERAR' ? 'var(--gold)' : 'var(--red)';

  // Fractal badge
  const fractalBull = ['HCH_INV','DOBLE_SUELO','CUNA_BAJISTA'].includes(nr.fractal_tipo);
  const fractalBear = ['HCH','DOBLE_TECHO','CUNA_ALCISTA'].includes(nr.fractal_tipo);
  const fractalClass = fractalBull ? 'fractal-bull' : fractalBear ? 'fractal-bear' : 'fractal-neu';

  res.innerHTML = `
  <div class="grid">

    <!-- COLUMNA 1 -->
    <div>

      <!-- RESOLUCION FINAL -->
      <div class="card" style="margin-bottom:20px;border:2px solid ${dirColor}66;">

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div>
            <div style="color:var(--cyan);font-size:0.65em;letter-spacing:3px;margin-bottom:4px;">🦄 RESOLUCION FINAL</div>
            <div style="color:${dirColor};font-size:1.2em;font-weight:bold;">
              ${dirEmoji} ${dm.direccion} — ${dm.accion === 'ENTRAR' ? '✅ ENTRAR' : dm.accion === 'ESPERAR' ? '⏳ ESPERAR' : '🚫 EVITAR'}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="color:${dirColor};font-size:2em;font-weight:bold;line-height:1;">${dm.confianza?.toFixed(0)}%</div>
            <div style="color:var(--gray);font-size:0.65em;letter-spacing:1px;">CONFIANZA</div>
          </div>
        </div>

        <div class="conf-bar" style="margin-bottom:12px;">
          <div class="conf-fill" style="width:${dm.confianza}%;background:${dirColor};"></div>
        </div>

        <div style="background:var(--bg3);border-left:3px solid ${dirColor};border-radius:6px;
                    padding:10px 14px;margin-bottom:12px;color:#b0bec5;font-size:0.88em;line-height:1.5;">
          ${dm.dictamen || 'Analizando...'}
        </div>

        <div style="display:flex;justify-content:space-between;padding:8px 12px;
                    background:var(--bg3);border-radius:6px;margin-bottom:8px;">
          <span style="color:var(--gray);font-size:0.8em;">📍 PRECIO ACTUAL</span>
          <span style="color:var(--cyan);font-weight:bold;">${fmt(nr.price)}</span>
        </div>

        <div style="display:flex;justify-content:space-between;padding:10px 14px;
                    background:${dirColor}22;border:1px solid ${dirColor}44;
                    border-radius:8px;margin-bottom:8px;">
          <div>
            <div style="color:${dirColor};font-weight:bold;font-size:0.9em;">📌 ENTRADA OPTIMA</div>
            <div style="color:var(--gray);font-size:0.75em;">${dm.zona_razon || '─'}</div>
          </div>
          <div style="color:${dirColor};font-weight:bold;font-size:1.1em;">${fmt(dm.zona_entrada)}</div>
        </div>

        <div style="display:flex;justify-content:space-between;padding:8px 14px;
                    background:var(--red)11;border-radius:6px;margin-bottom:12px;">
          <span style="color:var(--red);font-size:0.85em;">🛑 STOP LOSS</span>
          <span style="color:var(--red);font-weight:bold;">${fmt(dm.sl)}</span>
        </div>

        <div style="color:var(--gray);font-size:0.7em;letter-spacing:2px;margin-bottom:6px;">⚡ CORTO PLAZO (1H-4H)</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px;">
          ${[['TP1',dm.tp1_corto],['TP2',dm.tp2_corto],['TP3',dm.tp3_corto]].map(([tp,val]) => {
            const pct = dm.zona_entrada>0 ? ((val-dm.zona_entrada)/dm.zona_entrada*100) : 0;
            return `<div style="background:var(--green)11;border:1px solid var(--green)33;border-radius:6px;padding:8px;text-align:center;">
              <div style="color:var(--gray);font-size:0.7em;">${tp}</div>
              <div style="color:var(--green);font-weight:bold;font-size:0.82em;">${fmt(val)}</div>
              <div style="color:var(--green);font-size:0.7em;">${pct>=0?'+':''}${pct.toFixed(1)}%</div>
            </div>`;
          }).join('')}
        </div>

        <div style="color:var(--gray);font-size:0.7em;letter-spacing:2px;margin-bottom:6px;">🌙 LARGO PLAZO (1D-1W)</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px;">
          ${[['TP1',dm.tp1_macro],['TP2',dm.tp2_macro],['TP3',dm.tp3_macro]].map(([tp,val]) => {
            const pct = dm.zona_entrada>0 ? ((val-dm.zona_entrada)/dm.zona_entrada*100) : 0;
            return `<div style="background:var(--purple)11;border:1px solid var(--purple)33;border-radius:6px;padding:8px;text-align:center;">
              <div style="color:var(--gray);font-size:0.7em;">${tp}</div>
              <div style="color:var(--purple);font-weight:bold;font-size:0.82em;">${fmt(val)}</div>
              <div style="color:var(--purple);font-size:0.7em;">${pct>=0?'+':''}${pct.toFixed(1)}%</div>
            </div>`;
          }).join('')}
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:0.78em;">
          <div style="padding:4px 10px;background:var(--bg3);border-radius:12px;">
            Macro: <span style="color:${nr.direccion_macro==='ALCISTA'?'var(--green)':nr.direccion_macro==='BAJISTA'?'var(--red)':'var(--gray)'};font-weight:bold;">${nr.direccion_macro}</span>
          </div>
          <div style="padding:4px 10px;background:var(--bg3);border-radius:12px;">
            Micro: <span style="color:${nr.direccion_micro==='ALCISTA'?'var(--green)':nr.direccion_micro==='BAJISTA'?'var(--red)':'var(--gray)'};font-weight:bold;">${nr.direccion_micro}</span>
          </div>
          <div style="padding:4px 10px;background:var(--bg3);border-radius:12px;">
            <span class="fractal-badge ${fractalBull?'fractal-bull':fractalBear?'fractal-bear':'fractal-neu'}" style="font-size:0.85em;">${nr.fractal_pro_patron!=='NINGUNO'?nr.fractal_pro_patron:nr.fractal_tipo!=='NINGUNO'?nr.fractal_tipo:'Sin fractal'}</span>
          </div>
          ${dm.contradiccion?'<div style="padding:4px 10px;background:var(--orange)22;border-radius:12px;color:var(--orange);">⚠️ Contradiccion</div>':''}
        </div>
      </div>

      ${(() => {
        const ds = d.dictamen_scalping;
        if (!ds) return '';
        const scColor = ds.direccion === 'ALCISTA' ? 'var(--green)' : ds.direccion === 'BAJISTA' ? 'var(--red)' : 'var(--gray)';
        const scEmoji = ds.direccion === 'ALCISTA' ? '🚀' : ds.direccion === 'BAJISTA' ? '🔻' : '➖';
        const scAccion = ds.accion === 'ENTRAR' ? '✅ ENTRAR' : ds.accion === 'ESPERAR' ? '⏳ ESPERAR' : '🚫 EVITAR';
        return `
      <!-- SCALPING -->
      <div class="card" style="margin-bottom:20px;border:2px solid ${scColor}66;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div>
            <div style="color:var(--cyan);font-size:0.65em;letter-spacing:3px;margin-bottom:4px;">⚡ SCALPING (5M-15M-30M-1H)</div>
            <div style="color:${scColor};font-size:1.05em;font-weight:bold;">${scEmoji} ${ds.direccion} — ${scAccion}</div>
          </div>
          <div style="text-align:right;">
            <div style="color:${scColor};font-size:1.6em;font-weight:bold;line-height:1;">${ds.confianza?.toFixed(0)}%</div>
            <div style="color:var(--gray);font-size:0.6em;letter-spacing:1px;">CONFIANZA</div>
          </div>
        </div>
        <div class="conf-bar" style="margin-bottom:10px;">
          <div class="conf-fill" style="width:${ds.confianza}%;background:${scColor};"></div>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 12px;background:${scColor}22;border:1px solid ${scColor}44;border-radius:6px;margin-bottom:8px;">
          <span style="color:${scColor};font-weight:bold;font-size:0.85em;">📌 Entrada: ${fmt(ds.zona_entrada)}</span>
          <span style="color:var(--red);font-weight:bold;font-size:0.85em;">🛑 SL: ${fmt(ds.sl)}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
          ${[['TP1',ds.tp1_corto],['TP2',ds.tp2_corto],['TP3',ds.tp3_corto]].map(([tp,val]) => `
            <div style="background:var(--green)11;border:1px solid var(--green)33;border-radius:6px;padding:6px;text-align:center;">
              <div style="color:var(--gray);font-size:0.65em;">${tp}</div>
              <div style="color:var(--green);font-weight:bold;font-size:0.78em;">${fmt(val)}</div>
            </div>`).join('')}
        </div>
        ${ds.fractal_tipo && ds.fractal_tipo !== 'NINGUNO' ? `<div style="margin-top:8px;font-size:0.78em;color:var(--gray);">Fractal: <span style="color:${scColor};font-weight:bold;">${ds.fractal_tipo}</span> (${ds.fractal_confianza?.toFixed(0)}%)</div>` : ''}
      </div>`;
      })()}

      <!-- ZONAS -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-title">📍 ZONAS CALCULADAS</div>
        <div class="zonas-grid" style="margin-bottom:16px;">
          <div class="zona-item" style="border-left:3px solid ${dirColor};">
            <div class="zona-label">ENTRADA OPTIMA</div>
            <div class="zona-value" style="color:${dirColor}">${fmt(dm.zona_entrada)}</div>
            <div class="zona-sub">${dm.zona_razon || '─'}</div>
          </div>
          <div class="zona-item" style="border-left:3px solid var(--red);">
            <div class="zona-label">STOP LOSS</div>
            <div class="zona-value" style="color:var(--red)">${fmt(dm.sl)}</div>
            <div class="zona-sub">${dm.sl_razon || '─'}</div>
          </div>
        </div>

        <!-- TPs CORTO -->
        <div style="color:var(--gray);font-size:0.75em;letter-spacing:1px;margin-bottom:8px;">! CORTO PLAZO (1H-4H)</div>
        ${tpRow('TP1', dm.tp1_corto, dm.direccion)}
        ${tpRow('TP2', dm.tp2_corto, dm.direccion)}
        ${tpRow('TP3', dm.tp3_corto, dm.direccion)}

        <!-- TPs MACRO -->
        <div style="color:var(--gray);font-size:0.75em;letter-spacing:1px;margin:12px 0 8px;">🌙 LARGO PLAZO (1D-1W)</div>
        ${tpRow('TP1', dm.tp1_macro, dm.direccion)}
        ${tpRow('TP2', dm.tp2_macro, dm.direccion)}
        ${tpRow('TP3', dm.tp3_macro, dm.direccion)}
      </div>

      <!-- MEMORIA -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-title">🧠 MEMORIA + APRENDIZAJE</div>
        ${renderMemoria(d.memoria || {})}
      </div>

      <!-- CONTEXTO -->
      <div class="card">
        <div class="card-title">💬 ANALISIS</div>
        ${dm.contexto?.map(c => `<div class="ctx-item">${c}</div>`).join('') || '<div class="empty">Sin contexto</div>'}
      </div>

    </div>

    <!-- COLUMNA 2 -->
    <div>

      <!-- NUCLEO -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-title">🔬 NUCLEO MATEMATICO -- ${d.symbol}</div>
        <div class="info-grid" style="margin-bottom:12px;">
          <div class="info-item">
            <span class="info-k">FRACTAL</span>
            <span class="info-v" style="color:${fractalBull?'var(--green)':fractalBear?'var(--red)':'var(--gray)'}">${nr.fractal_tipo}</span>
          </div>
          <div class="info-item">
            <span class="info-k">CONFIANZA</span>
            <span class="info-v">${Math.min(100, nr.fractal_confianza).toFixed(0)}%</span>
          </div>
          <div class="info-item">
            <span class="info-k">NECKLINE</span>
            <span class="info-v">${fmt(nr.fractal_neckline)}</span>
          </div>
          <div class="info-item">
            <span class="info-k">OBJETIVO</span>
            <span class="info-v" style="color:var(--gold)">${fmt(nr.fractal_objetivo)}</span>
          </div>
          <div class="info-item">
            <span class="info-k">Fib 61.8%</span>
            <span class="info-v" style="color:${nr.en_zona_618?'var(--gold)':'inherit'}">${fmt(nr.fib_618)} ${nr.en_zona_618?'◆':''}</span>
          </div>
          <div class="info-item">
            <span class="info-k">Fib 38.2%</span>
            <span class="info-v">${fmt(nr.fib_382)}</span>
          </div>
          <div class="info-item">
            <span class="info-k">VWAP</span>
            <span class="info-v" style="color:${nr.precio_vwap==='SOBRE'?'var(--green)':'var(--red)'}">${fmt(nr.vwap)} (${nr.precio_vwap})</span>
          </div>
          <div class="info-item">
            <span class="info-k">CANAL REG.</span>
            <span class="info-v" style="color:${nr.precio_en_canal==='MEDIO'?'var(--green)':'var(--orange)'}">${nr.precio_en_canal}</span>
          </div>
          <div class="info-item">
            <span class="info-k">AGOTAM.</span>
            <span class="info-v" style="color:${nr.agotamiento_score>=60?'var(--orange)':'var(--green)'}">${nr.agotamiento_score?.toFixed(0)}/100 ${nr.agotamiento_dir}</span>
          </div>
          <div class="info-item">
            <span class="info-k">POCs ABAJO</span>
            <span class="info-v" style="color:${nr.pocs_abajo>=2?'var(--orange)':'var(--green)'}">${nr.pocs_abajo} 🧲</span>
          </div>
          <div class="info-item">
            <span class="info-k">BOLLINGER</span>
            <span class="info-v">${nr.precio_bb} ${nr.bb_squeeze?'💥SQUEEZE':''}</span>
          </div>
          <div class="info-item">
            <span class="info-k">SLOPE</span>
            <span class="info-v" style="color:${nr.regresion_slope>0?'var(--green)':'var(--red)'}">${nr.regresion_slope?.toFixed(4)}%</span>
          </div>
        </div>

        <!-- RSI Cascada -->
        <div style="color:var(--gray);font-size:0.75em;letter-spacing:1px;margin-bottom:8px;">! RSI CASCADA (vaso de agua)</div>
        ${Object.entries(nr.rsi_map||{}).map(([tf,rsi]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="color:var(--gray);font-size:0.8em">${tf}</span>
            <div style="flex:1;margin:0 12px;height:4px;background:#ffffff11;border-radius:2px;">
              <div style="width:${rsi}%;height:100%;background:${rsi>70?'var(--red)':rsi<30?'var(--green)':'var(--cyan)'};border-radius:2px;"></div>
            </div>
            <span style="font-size:0.8em;color:${rsi>70?'var(--red)':rsi<30?'var(--green)':'#eceff1'}">${rsi?.toFixed(1)}</span>
          </div>
        `).join('')}
        <div style="color:var(--gray);font-size:0.75em;margin-top:4px;">Energia disponible: ${nr.rsi_energy?.toFixed(0)}% ${nr.rsi_agotado?'⚠️ AGOTADO':''}</div>
      </div>

      <!-- PSY DEPTH -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-title">📐 PSY DEPTH CALCULATOR</div>
        ${renderPsyDepth(nr)}
      </div>

      <!-- FRACTAL PRO -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-title">🔺 FRACTAL PRO</div>
        ${renderFractalPro(nr)}
      </div>

      <!-- POC CASCADE -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-title">🧲 POC CASCADE</div>
        ${Object.entries(nr.poc_map||{}).map(([tf,poc]) => {
          const precio = nr.price;
          const abajo = poc < precio * 0.985;
          const arriba = poc > precio * 1.015;
          const pos = abajo ? '⬇️ ABAJO' : arriba ? '⬆️ ARRIBA' : '〰️ CERCA';
          const col = abajo ? 'var(--red)' : arriba ? 'var(--green)' : 'var(--gold)';
          return `
          <div class="tp-row" style="border-left:3px solid ${col};padding-left:10px;margin-bottom:6px;">
            <span style="color:var(--gray);font-size:0.8em">${tf}</span>
            <span style="font-size:0.85em;">${fmt(poc)}</span>
            <span style="color:${col};font-size:0.8em">${pos}</span>
          </div>`;
        }).join('') || '<div class="empty">Sin POC calculado</div>'}
      </div>

      <!-- MACRO -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-title">🌍 CONTEXTO MACRO GLOBAL</div>
        ${renderMacro(d.macro || {})}
      </div>

      <!-- CONFLUENCIAS -->
      <div class="card">
        <div class="card-title">⭐ ZONAS DE CONFLUENCIA</div>
        ${(nr.zonas_clave||[]).slice(0,6).map(([p,d,s]) => `
          <div class="conf-zona ${s>=8?'conf-high':s>=5?'conf-med':'conf-low'}">
            <div>
              <div style="font-size:0.85em;font-weight:bold;">${fmt(p)}</div>
              <div style="color:var(--gray);font-size:0.75em;">${d}</div>
            </div>
            <div style="color:${s>=8?'var(--gold)':s>=5?'var(--cyan)':'var(--gray)'};font-weight:bold;">
              ${'★'.repeat(Math.min(Math.round(s/3),3))} ${s.toFixed(0)}pts
            </div>
          </div>
        `).join('') || '<div class="empty">Sin confluencias detectadas</div>'}
      </div>

    </div>
  </div>`;
}

function renderMemoria(m) {
  if (!m || (!m.stats?.total && !m.recientes?.length)) {
    return '<div class="empty">Sin historial aun — se acumula con cada analisis</div>';
  }

  const s = m.stats || {};
  const accColor = (s.accuracy||0) >= 60 ? 'var(--green)' :
                   (s.accuracy||0) >= 40 ? 'var(--gold)' : 'var(--red)';

  return `
    ${s.total ? `
    <div class="info-grid" style="margin-bottom:12px;">
      <div class="info-item">
        <span class="info-k">Accuracy</span>
        <span class="info-v" style="color:${accColor}">${s.accuracy?.toFixed(0)}%</span>
      </div>
      <div class="info-item">
        <span class="info-k">Ganancia avg</span>
        <span class="info-v" style="color:${(s.ganancia_avg||0)>0?'var(--green)':'var(--red)'}">${s.ganancia_avg?.toFixed(2)}%</span>
      </div>
      <div class="info-item">
        <span class="info-k">Total señales</span>
        <span class="info-v">${s.total}</span>
      </div>
      <div class="info-item">
        <span class="info-k">Ajuste conf.</span>
        <span class="info-v" style="color:${(m.ajuste_confianza||0)>0?'var(--green)':'var(--red)'}">${(m.ajuste_confianza||0)>0?'+':''}${m.ajuste_confianza?.toFixed(1)}%</span>
      </div>
    </div>` : ''}

    ${(m.notas||[]).map(n => `<div class="ctx-item">${n}</div>`).join('')}

    ${m.recientes?.length ? `
    <div style="color:var(--gray);font-size:0.75em;letter-spacing:1px;margin:10px 0 6px;">SEÑALES RECIENTES</div>
    ${m.recientes.slice(0,5).map(r => {
      const col = r.resultado === 'TP3' ? 'var(--green)' :
                  r.resultado === 'TP2' ? 'var(--green)' :
                  r.resultado === 'TP1' ? 'var(--cyan)' :
                  r.resultado === 'SL'  ? 'var(--red)' : 'var(--gray)';
      return `<div class="tp-row">
        <span style="color:${r.dir==='ALCISTA'?'var(--green)':'var(--red)'};font-size:0.8em;">${r.dir==='ALCISTA'?'▲':'▼'}</span>
        <span style="color:${col};font-size:0.8em;font-weight:bold;">${r.resultado||'PEND'}</span>
        <span style="color:${(r.ganancia||0)>0?'var(--green)':'var(--red)'};font-size:0.8em;">${(r.ganancia||0)>0?'+':''}${(r.ganancia||0).toFixed(2)}%</span>
        <span style="color:var(--gray);font-size:0.75em;">hace ${r.hace_h}h</span>
      </div>`;
    }).join('')}` : ''}
  `;
}

function renderPsyDepth(nr) {
  const d = nr.psy_depth || {};
  if (!d.macro_high) return '<div class="empty">Sin datos PSY DEPTH</div>';

  const verdict = nr.verdict || 'NEUTRAL';
  const vcol = verdict === 'BULLISH' ? 'var(--green)' :
               verdict === 'BEARISH' ? 'var(--red)' : 'var(--gold)';

  const stars = n => n >= 9 ? '★★★★★' : n >= 7 ? '★★★★☆' :
                     n >= 5 ? '★★★☆☆' : n >= 3 ? '★★☆☆☆' : '★☆☆☆☆';

  const fib_row = (label, price, score, isOptimal=false) => {
    const col = score >= 7 ? 'var(--gold)' : score >= 4 ? 'var(--cyan)' : 'var(--gray)';
    const bg  = isOptimal ? 'background:var(--gold)11;border-left:3px solid var(--gold);' : '';
    return `<div class="tp-row" style="${bg}padding:6px 10px;margin-bottom:4px;border-radius:6px;">
      <span style="color:${col};font-size:0.8em;">${label}</span>
      <span style="font-size:0.85em;font-weight:bold;">${fmt(price)}</span>
      <span style="color:${col};font-size:0.75em;">${stars(score)} ${score}/10</span>
    </div>`;
  };

  return `
    <!-- Veredicto PSY -->
    <div style="display:flex;justify-content:space-between;align-items:center;
                background:var(--bg3);border-radius:8px;padding:10px 14px;
                margin-bottom:12px;border-left:3px solid ${vcol};">
      <div>
        <div style="color:${vcol};font-weight:bold;">${verdict}</div>
        <div style="color:var(--gray);font-size:0.75em;">Bear Score: ${nr.bear_score}/100</div>
      </div>
      <div style="text-align:right;">
        <div style="color:var(--gold);font-size:0.85em;">${nr.zone || '─'}</div>
        <div style="color:var(--gray);font-size:0.75em;">${nr.in_golden ? '◆ GOLDEN POCKET' : ''}</div>
      </div>
    </div>

    <!-- Zona Optima -->
    <div style="background:var(--gold)11;border:1px solid var(--gold)44;border-radius:8px;
                padding:10px 14px;margin-bottom:12px;">
      <div style="color:var(--gold);font-weight:bold;margin-bottom:4px;">◆ ZONA OPTIMA (Golden Pocket)</div>
      <div style="display:flex;justify-content:space-between;">
        <span style="color:var(--gray);font-size:0.8em;">Rango:</span>
        <span style="color:var(--gold);">${fmt(d.optimal_low)} — ${fmt(d.optimal_high)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:4px;">
        <span style="color:var(--gray);font-size:0.8em;">Entrada Mid:</span>
        <span style="color:var(--cyan);">${fmt(nr.entry_mid)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:4px;">
        <span style="color:var(--gray);font-size:0.8em;">Stop Loss:</span>
        <span style="color:var(--red);">${fmt(nr.sl_price)}</span>
      </div>
    </div>

    <!-- Confluence Scores -->
    <div style="color:var(--gray);font-size:0.75em;letter-spacing:1px;margin-bottom:8px;">
      CONFLUENCE SCORE (mismo algoritmo Pine Script)
    </div>
    ${fib_row('Fib 38.2%', d.p_382, nr.cs_382)}
    ${fib_row('Fib 50.0%', d.p_50,  (d.cs_50||0))}
    ${fib_row('Fib 61.8% ✦', d.p_618, nr.cs_618, true)}
    ${fib_row('Fib 78.6%', d.p_786, nr.cs_786)}
    ${fib_row('Fib 88.6%', d.p_886, (d.cs_886||0))}

    <!-- Mejor nivel -->
    <div style="margin-top:10px;padding:8px 12px;background:var(--cyan)11;
                border-radius:6px;border-left:3px solid var(--cyan);">
      <span style="color:var(--gray);font-size:0.8em;">Mejor confluencia:</span>
      <span style="color:var(--cyan);font-weight:bold;margin-left:8px;">
        Fib ${nr.best_level} — ${nr.best_score}/10 ★
      </span>
    </div>

    <!-- Wyckoff -->
    <div style="color:var(--gray);font-size:0.75em;letter-spacing:1px;margin:10px 0 6px;">WYCKOFF ZONES</div>
    <div class="info-grid">
      <div class="info-item"><span class="info-k">Resistance</span><span class="info-v" style="color:var(--red)">${fmt(nr.macro_high)}</span></div>
      <div class="info-item"><span class="info-k">Mid</span><span class="info-v" style="color:var(--gold)">${fmt(d.wyck_mid)}</span></div>
      <div class="info-item"><span class="info-k">Support</span><span class="info-v" style="color:var(--cyan)">${fmt(nr.wyck_support)}</span></div>
      <div class="info-item"><span class="info-k">Spring</span><span class="info-v" style="color:var(--green)">${fmt(nr.wyck_spring)}</span></div>
    </div>

    <!-- Micro Fib -->
    <div style="color:var(--gray);font-size:0.75em;letter-spacing:1px;margin:10px 0 6px;">MICRO FIBONACCI (Pivotes left=10 right=10)</div>
    <div class="info-grid">
      <div class="info-item"><span class="info-k">μ 38.2%</span><span class="info-v">${fmt(nr.__dict__?.mf_382 || d.mf_382)}</span></div>
      <div class="info-item"><span class="info-k">μ 61.8%</span><span class="info-v">${fmt(nr.__dict__?.mf_618 || d.mf_618)}</span></div>
    </div>
  `;
}

function renderDivergencia(nr) {
  if (!nr.div_tipo || nr.div_tipo === 'NINGUNA') return '';
  const esAlcista = nr.div_tipo.includes('ALCISTA');
  const col = esAlcista ? 'var(--green)' : 'var(--red)';
  const conf = nr.div_confianza || 0;
  const badges = [
    nr.div_vol_confirma  ? '📉 Volumen' : null,
    nr.div_ema_confirma  ? '📐 EMA9/21' : null,
    nr.div_vela_confirma ? '🕯️ Vela' : null,
  ].filter(Boolean).join(' + ');
  return `
    <div class="ctx-item" style="border-left:2px solid ${col};padding-left:8px;">
      📊 <span style="color:${col};font-weight:bold;">${nr.div_tipo}</span>
      <span style="color:var(--gray);font-size:0.85em;"> (${conf.toFixed(0)}% conf)</span>
      ${badges ? `<div style="font-size:0.8em;color:var(--gray);margin-top:2px;">Confirmado por: ${badges}</div>` : ''}
    </div>`;
}

function renderFractalPro(nr) {
  const patron = nr.fractal_pro_patron || 'NINGUNO';
  if (patron === 'NINGUNO') {
    return `
      <div class="empty">Sin patron detectado</div>
      <div style="margin-top:8px;">
        ${nr.vela_tipo && nr.vela_tipo !== 'NINGUNA' ? `<div class="ctx-item">🕯️ ${nr.vela_tipo} — ${nr.vela_senal || ''}</div>` : ''}
        ${renderDivergencia(nr)}
        ${nr.canal_tipo && nr.canal_tipo !== 'NINGUNO' ? `<div class="ctx-item">📐 Canal ${nr.canal_tipo} ${nr.en_techo?'(TECHO ⚠️)':nr.en_suelo?'(SUELO)':''}</div>` : ''}
      </div>`;
  }

  const tipo = nr.fractal_pro_tipo || 'NEUTRAL';
  const col  = tipo === 'BULLISH' ? 'var(--green)' : tipo === 'BEARISH' ? 'var(--red)' : 'var(--gold)';
  const emoji = tipo === 'BULLISH' ? '🔺' : tipo === 'BEARISH' ? '🔻' : '⚪';

  return `
    <div style="background:var(--bg3);border-radius:8px;padding:12px;
                border-left:3px solid ${col};margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="color:${col};font-weight:bold;">${emoji} ${patron}</div>
        <div style="color:${col};font-size:0.85em;">${nr.fractal_pro_conf?.toFixed(0)}% conf</div>
      </div>
      <div class="conf-bar" style="margin-top:6px;">
        <div class="conf-fill" style="width:${nr.fractal_pro_conf}%;background:${col};"></div>
      </div>
    </div>
    <div class="info-grid" style="margin-bottom:10px;">
      <div class="info-item">
        <span class="info-k">Objetivo</span>
        <span class="info-v" style="color:var(--gold)">${fmt(nr.fractal_pro_obj)}</span>
      </div>
      <div class="info-item">
        <span class="info-k">Stop</span>
        <span class="info-v" style="color:var(--red)">${fmt(nr.fractal_pro_stop)}</span>
      </div>
      <div class="info-item">
        <span class="info-k">Fib 61.8%</span>
        <span class="info-v">${fmt(nr.fractal_pro_fib618)}</span>
      </div>
      <div class="info-item">
        <span class="info-k">Score</span>
        <span class="info-v" style="color:var(--cyan)">${nr.fractal_pro_score?.toFixed(0)}/100</span>
      </div>
    </div>
    ${(nr.fractal_pro_narrativa||[]).map(n => `<div class="ctx-item">${n}</div>`).join('')}
    <div style="margin-top:8px;">
      ${nr.vela_tipo && nr.vela_tipo !== 'NINGUNA' ? `<div class="ctx-item">🕯️ ${nr.vela_tipo} (${nr.vela_senal || ''})</div>` : ''}
      ${renderDivergencia(nr)}
      ${nr.canal_tipo && nr.canal_tipo !== 'NINGUNO' ? `<div class="ctx-item">📐 Canal ${nr.canal_tipo} ${nr.en_techo?'— TECHO ⚠️':nr.en_suelo?'— SUELO':''}</div>` : ''}
    </div>
  `;
}

function renderMacro(m) {
  if (!m || !m.sesgo) return '<div class="empty">Cargando macro...</div>';
  const col = m.sesgo === 'RISK_ON' ? 'var(--green)' :
              m.sesgo === 'RISK_OFF' ? 'var(--red)' : 'var(--gold)';
  const emoji = m.sesgo === 'RISK_ON' ? '🟢' :
                m.sesgo === 'RISK_OFF' ? '🔴' : '⚪';
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;
                background:var(--bg3);border-radius:8px;padding:12px;margin-bottom:12px;
                border-left:3px solid ${col};">
      <div>
        <div style="color:${col};font-weight:bold;font-size:1em;">${emoji} ${m.sesgo}</div>
        <div style="color:var(--gray);font-size:0.75em;">Sesgo macro global</div>
      </div>
      <div style="text-align:right;">
        <div style="color:${col};font-weight:bold;">${m.sesgo_score?.toFixed(0)}/100</div>
        <div class="conf-bar" style="width:80px;margin-top:4px;">
          <div class="conf-fill" style="width:${m.sesgo_score}%;background:${col};"></div>
        </div>
      </div>
    </div>
    <div class="info-grid" style="margin-bottom:12px;">
      <div class="info-item">
        <span class="info-k">DXY</span>
        <span class="info-v" style="color:${m.dxy_change>0?'var(--red)':'var(--green)'}">${m.dxy_change?.toFixed(2)}%</span>
      </div>
      <div class="info-item">
        <span class="info-k">VIX</span>
        <span class="info-v" style="color:${m.vix_value>25?'var(--red)':m.vix_value<15?'var(--green)':'var(--gold)'}">${m.vix_value?.toFixed(0)}</span>
      </div>
      <div class="info-item">
        <span class="info-k">SPX</span>
        <span class="info-v" style="color:${m.spx_change>0?'var(--green)':'var(--red)'}">${m.spx_change?.toFixed(2)}%</span>
      </div>
      <div class="info-item">
        <span class="info-k">NVDA</span>
        <span class="info-v" style="color:${m.nvda_change>0?'var(--green)':'var(--red)'}">${m.nvda_change?.toFixed(2)}%</span>
      </div>
      <div class="info-item">
        <span class="info-k">Mag7</span>
        <span class="info-v" style="color:${m.mag7_avg>0?'var(--green)':'var(--red)'}">${m.mag7_avg?.toFixed(2)}%</span>
      </div>
      <div class="info-item">
        <span class="info-k">Bonos 10Y</span>
        <span class="info-v">${m.tnx_value?.toFixed(2) || '--'}%</span>
      </div>
      <div class="info-item">
        <span class="info-k">Gold</span>
        <span class="info-v" style="color:${m.gold_change>0?'var(--green)':'var(--red)'}">$${m.gold_value?.toFixed(0) || '--'} (${m.gold_change?.toFixed(2)}%)</span>
      </div>
      <div class="info-item">
        <span class="info-k">WTI (Oil)</span>
        <span class="info-v" style="color:${m.oil_change>0?'var(--green)':'var(--red)'}">$${m.oil_value?.toFixed(1) || '--'} (${m.oil_change?.toFixed(2)}%)</span>
      </div>
    </div>
    ${(m.narrativa||[]).slice(0,3).map(n => `<div class="ctx-item">${n}</div>`).join('')}
  `;
}

function tpRow(label, value, dir) {
  const col = dir === 'ALCISTA' ? 'var(--green)' : 'var(--red)';
  return `
  <div class="tp-row">
    <span class="tp-label">${label}</span>
    <span class="tp-val" style="color:${col}">${fmt(value)}</span>
  </div>`;
}

function fmt(v) {
  if (!v || v === 0) return '─';
  if (v >= 1000)    return v.toLocaleString('es', {minimumFractionDigits:2, maximumFractionDigits:2});
  if (v >= 1)       return v.toFixed(4);
  if (v >= 0.1)     return v.toFixed(5);
  if (v >= 0.01)    return v.toFixed(6);
  if (v >= 0.001)   return v.toFixed(7);
  if (v >= 0.0001)  return v.toFixed(8);
  if (v >= 0.00001) return v.toFixed(9);
  return v.toFixed(10);
}
</script>
</body>
</html>"""


# ════════════════════════════════════════════════════════
# RUTAS
# ════════════════════════════════════════════════════════
async def handle_root(request):
    if not _check_auth(request):
        raise web.HTTPFound("/login")
    return web.Response(text=MOTOR_HTML, content_type="text/html")


async def handle_login_get(request):
    return web.Response(
        text=LOGIN_HTML.replace("{error}", ""),
        content_type="text/html"
    )


async def handle_login_post(request):
    data = await request.post()
    pwd  = data.get("password", "")
    if pwd == ADMIN_PASSWORD:
        token = _make_token()
        resp  = web.HTTPFound("/")
        resp.set_cookie("psy_token", token, max_age=86400*7)
        return resp
    return web.Response(
        text=LOGIN_HTML.replace("{error}", '<p class="err">Clave incorrecta</p>'),
        content_type="text/html"
    )


async def handle_logout(request):
    resp = web.HTTPFound("/login")
    resp.del_cookie("psy_token")
    return resp


async def handle_analizar(request):
    if not _check_auth(request):
        return web.json_response({"error": "No autorizado"}, status=401)

    try:
        body   = await request.json()
        symbol = body.get("symbol", "").upper().strip()
        if not symbol:
            return web.json_response({"error": "Simbolo requerido"})

        # Cache de 5 minutos
        now = __import__("time").time()
        if symbol in _cache and now - _cache_ts.get(symbol, 0) < 300:
            return web.json_response(_cache[symbol])

        # An!lisis completo
        tfs = ["5m", "15m", "30m", "1h", "4h", "1d", "1w"]

        from motor.libro_datos import actualizar_libro
        from motor.nucleo import analizar_nucleo
        from motor.dictamen_motor import generar_dictamen

        libro   = await actualizar_libro(symbol, tfs)
        ohlcv   = libro.get("ohlcv", {})
        funding = libro.get("funding", {})
        oi      = libro.get("oi", {})

        if not ohlcv:
            return web.json_response({"error": f"Sin datos para {symbol}"})

        # Swing (4H-1D-1SEM) — es el análisis principal, mismo comportamiento de siempre
        nr = analizar_nucleo(symbol, ohlcv, modo="swing")
        dm = generar_dictamen(nr, funding=funding, oi=oi)

        # Scalping (5M-15M-30M-1H) — análisis paralelo para temporalidad baja
        nr_scalp = None
        dm_scalp = None
        try:
            if any(tf in ohlcv for tf in ("5m", "15m", "30m")):
                nr_scalp = analizar_nucleo(symbol, ohlcv, modo="scalping")
                dm_scalp = generar_dictamen(nr_scalp, funding=funding, oi=oi)
        except Exception as e:
            log.warning(f"Scalping error {symbol}: {e}")
            nr_scalp = None
            dm_scalp = None

        # Contexto de memoria
        try:
            mem_ctx = get_contexto_memoria(
                symbol=symbol,
                cs_618=nr.__dict__.get("cs_618", 0),
                patron=nr.fractal_tipo,
                macro_sesgo=macro_ctx.get("sesgo","NEUTRAL") if macro_ctx else "NEUTRAL",
                bear_score=nr.__dict__.get("bear_score", 50),
            )
            # Aplicar ajuste de memoria a la confianza
            if mem_ctx.get("ajuste_confianza"):
                dm.confianza = max(0, min(100,
                    dm.confianza + mem_ctx["ajuste_confianza"]))
            # Agregar notas de memoria al contexto
            for nota in mem_ctx.get("notas", []):
                dm.contexto.append(nota)
        except Exception as _me:
            log.debug(f"Memoria: {_me}")
            mem_ctx = {}

        # Aplicar contexto macro
        try:
            mc = await get_macro_context()
            aplicar_macro_al_dictamen(dm, mc)
            if dm_scalp is not None:
                aplicar_macro_al_dictamen(dm_scalp, mc)
            macro_ctx = {
                "sesgo":       mc.sesgo,
                "sesgo_score": mc.sesgo_score,
                "dxy_change":  mc.dxy_change,
                "vix_value":   mc.vix_value,
                "spx_change":  mc.spx_change,
                "mag7_avg":    mc.mag7_avg,
                "nvda_change": mc.nvda_change,
                "tnx_value":   mc.tnx_value,   # Bonos 10Y — antes NO se serializaba, por eso salía siempre "--%"
                "gold_value":  mc.gold_value,
                "gold_change": mc.gold_change,
                "oil_value":   mc.oil_value,
                "oil_change":  mc.oil_change,
                "narrativa":   mc.narrativa,
            }
        except Exception as _me:
            log.warning(f"Macro error: {_me}")
            macro_ctx = {}

        # Serializar resultado
        result = {
            "symbol": symbol,
            "precio": nr.price,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "dictamen": {
                "dictamen":    dm.dictamen,
                "direccion":   dm.direccion,
                "confianza":   dm.confianza,
                "accion":      dm.accion,
                "contexto":    dm.contexto,
                "contradiccion": dm.contradiccion,
                "resolucion":  dm.resolucion,
                "zona_entrada": dm.zona_entrada,
                "zona_razon":  dm.zona_razon,
                "sl":          dm.sl,
                "sl_razon":    dm.sl_razon,
                "tp1_corto":   dm.tp1_corto,
                "tp2_corto":   dm.tp2_corto,
                "tp3_corto":   dm.tp3_corto,
                "tp1_macro":   dm.tp1_macro,
                "tp2_macro":   dm.tp2_macro,
                "tp3_macro":   dm.tp3_macro,
                "score_total": dm.score_total,
            },
            "dictamen_scalping": ({
                "timeframe":   "5m-15m-30m-1h",
                "dictamen":    dm_scalp.dictamen,
                "direccion":   dm_scalp.direccion,
                "confianza":   dm_scalp.confianza,
                "accion":      dm_scalp.accion,
                "contexto":    dm_scalp.contexto,
                "contradiccion": dm_scalp.contradiccion,
                "resolucion":  dm_scalp.resolucion,
                "zona_entrada": dm_scalp.zona_entrada,
                "zona_razon":  dm_scalp.zona_razon,
                "sl":          dm_scalp.sl,
                "sl_razon":    dm_scalp.sl_razon,
                "tp1_corto":   dm_scalp.tp1_corto,
                "tp2_corto":   dm_scalp.tp2_corto,
                "tp3_corto":   dm_scalp.tp3_corto,
                "tp1_macro":   dm_scalp.tp1_macro,
                "tp2_macro":   dm_scalp.tp2_macro,
                "tp3_macro":   dm_scalp.tp3_macro,
                "score_total": dm_scalp.score_total,
                "precio":      nr_scalp.price,
                "fractal_tipo": nr_scalp.fractal_tipo,
                "fractal_confianza": nr_scalp.fractal_confianza,
                "div_tipo":    nr_scalp.div_tipo,
                "div_confianza": getattr(nr_scalp, "div_confianza", 0),
            } if (dm_scalp is not None and nr_scalp is not None) else None),
            "macro": macro_ctx,
            "nucleo": {
                "fractal_tipo":           nr.fractal_tipo,
                "fractal_confianza":      nr.fractal_confianza,
                "fractal_neckline":       nr.fractal_neckline,
                "fractal_objetivo":       nr.fractal_objetivo,
                "fractal_pro_patron":     nr.fractal_pro_patron,
                "fractal_pro_tipo":       nr.fractal_pro_tipo,
                "fractal_pro_conf":       nr.fractal_pro_conf,
                "fractal_pro_obj":        nr.fractal_pro_obj,
                "fractal_pro_stop":       nr.fractal_pro_stop,
                "fractal_pro_fib618":     nr.fractal_pro_fib618,
                "fractal_pro_score":      nr.fractal_pro_score,
                "fractal_pro_narrativa":  nr.fractal_pro_narrativa,
                "vela_tipo":              nr.vela_tipo,
                "vela_senal":             getattr(nr, "vela_señal", "NEUTRAL"),
                "div_tipo":               nr.div_tipo,
                "div_desc":               getattr(nr, "div_desc", ""),
                "div_confianza":          getattr(nr, "div_confianza", 0),
                "div_vol_confirma":       getattr(nr, "div_vol_confirma", False),
                "div_ema_confirma":       getattr(nr, "div_ema_confirma", False),
                "div_vela_confirma":      getattr(nr, "div_vela_confirma", False),
                "canal_tipo":             nr.canal_tipo,
                "en_techo":               nr.en_techo,
                "en_suelo":               nr.en_suelo,
                "fib_618":           nr.fib_618,
                "fib_382":           nr.fib_382,
                "fib_e127":          nr.fib_e127,
                "fib_e161":          nr.fib_e161,
                "en_zona_618":       nr.en_zona_618,
                "vwap":              nr.vwap,
                "precio_vwap":       nr.precio_vwap,
                "precio_en_canal":   nr.precio_en_canal,
                "regresion_slope":   nr.regresion_slope,
                "bb_squeeze":        nr.bb_squeeze,
                "precio_bb":         nr.precio_bb,
                "rsi_map":           nr.rsi_map,
                "rsi_energy":        nr.rsi_energy,
                "rsi_agotado":       nr.rsi_agotado,
                "adx_maduro":        nr.adx_maduro,
                "cvd_cascade_bull":  nr.cvd_cascade_bull,
                "cvd_cascade_bear":  nr.cvd_cascade_bear,
                "poc_map":           nr.poc_map,
                "pocs_abajo":        nr.pocs_abajo,
                "pocs_arriba":       nr.pocs_arriba,
                "zonas_clave":       nr.zonas_clave[:8],
                "agotamiento_score": nr.agotamiento_score,
                "agotamiento_dir":   nr.agotamiento_dir,
                "direccion_macro":   nr.direccion_macro,
                "direccion_micro":   nr.direccion_micro,
                "confianza":         nr.confianza,
                "price":             nr.price,
                "psy_depth":         nr.__dict__.get("psy_depth") or {},
                "cs_382":            nr.__dict__.get("cs_382", 0),
                "cs_618":            nr.__dict__.get("cs_618", 0),
                "cs_786":            nr.__dict__.get("cs_786", 0),
                "best_level":        nr.__dict__.get("best_level", "─"),
                "best_score":        nr.__dict__.get("best_score", 0),
                "bear_score":        nr.__dict__.get("bear_score", 50),
                "verdict":           nr.__dict__.get("verdict", "NEUTRAL"),
                "zone":              nr.__dict__.get("zone", "─"),
                "in_golden":         nr.__dict__.get("in_golden", False),
                "entry_mid":         nr.__dict__.get("entry_mid", 0),
                "sl_price":          nr.__dict__.get("sl_price", 0),
                "wyck_support":      nr.__dict__.get("wyck_support", 0),
                "wyck_spring":       nr.__dict__.get("wyck_spring", 0),
                "macro_high":        nr.__dict__.get("macro_high", 0),
                "macro_low":         nr.__dict__.get("macro_low", 0),
                "mf_618":            nr.__dict__.get("mf_618", 0),
                "mf_382":            nr.__dict__.get("mf_382", 0),
            }
        }

        # Guardar señal en memoria
        try:
            guardar_senal(symbol, dm, nr,
                macro_sesgo=macro_ctx.get("sesgo","NEUTRAL") if macro_ctx else "NEUTRAL")
        except Exception as _me:
            log.debug(f"guardar_senal: {_me}")

        result["memoria"] = mem_ctx
        _cache[symbol]    = result
        _cache_ts[symbol] = now

        return web.json_response(result)

    except Exception as e:
        log.error(f"Error analizando: {e}", exc_info=True)
        return web.json_response({"error": str(e)}, status=500)


async def handle_top_symbols(request):
    """Retorna el top 200 símbolos para la UI."""
    if not _check_auth(request):
        return web.json_response({"error": "No autorizado"}, status=401)
    try:
        symbols = await fetch_top_symbols(200)
        return web.json_response({"symbols": symbols[:200]})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def handle_historial(request):
    if not _check_auth(request):
        return web.json_response({"error": "No autorizado"}, status=401)
    symbol = request.rel_url.query.get("symbol")
    data   = get_historial(symbol, limit=20)
    return web.json_response({"historial": data})


async def handle_leaderboard(request):
    if not _check_auth(request):
        return web.json_response({"error": "No autorizado"}, status=401)
    return web.json_response({"leaderboard": get_leaderboard()})


async def handle_health(request):
    return web.Response(text="OK")


# ════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════
async def main():
    init_db()
    init_memoria()
    app = web.Application()
    app.router.add_get("/",          handle_root)
    app.router.add_get("/login",     handle_login_get)
    app.router.add_post("/login",    handle_login_post)
    app.router.add_get("/logout",    handle_logout)
    app.router.add_post("/api/analizar", handle_analizar)
    app.router.add_get("/health",    handle_health)
    app.router.add_get("/api/top-symbols",  handle_top_symbols)
    app.router.add_get("/api/historial",    handle_historial)
    app.router.add_get("/api/leaderboard",  handle_leaderboard)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", PORT)
    await site.start()
    log.info(f"🌐 PSY MOTOR corriendo en puerto {PORT}")
    await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())
