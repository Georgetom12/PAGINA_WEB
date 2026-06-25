"""
╔═══════════════════════════════════════════════════════════╗
║   PSYCHOMETRIKS · BRIDGE UTILS                            ║
║   Funciones compartidas — todos los bots importan esto    ║
╚═══════════════════════════════════════════════════════════╝
"""
import os, time
import requests

BRIDGE_URL = os.getenv("BRIDGE_URL", "")
BRIDGE_KEY = os.getenv("BRIDGE_API_KEY", "")

EXCHANGE_MAP = {
    "Hyperliquid":"hl","hyperliquid":"hl",
    "dYdX":"dydx","dydx":"dydx",
    "GMX":"gmx","gmx":"gmx",
    "Gains":"gains","gains":"gains",
    "Vertex":"vertex","vertex":"vertex",
    "Drift":"drift","drift":"drift",
    "Binance":"binance","binance":"binance",
    "Bybit":"bybit","bybit":"bybit",
    "OKX":"okx","okx":"okx",
    "Bitget":"bitget","bitget":"bitget",
    "BingX":"bingx","bingx":"bingx",
}

TIER_MAP = {
    "🦈 MEGALODÓN":"MEGA","🐋 GIGANTE":"MEGA","🐳 GRANDE":"LARGE",
    "🐬 MEDIANA":"MID","🐟 PEZ":"MID",
    "MEGALODON":"MEGA","GIGANTE":"MEGA","BALLENA":"LARGE",
    "DELFÍN":"MID","PEZ GRANDE":"MID",
}

CHAIN_KEY_MAP = {
    "solana":"sol","ethereum":"eth","eth":"eth",
    "bsc":"bsc","base":"base","arbitrum":"arb",
    "polygon":"pol","optimism":"eth","avalanche":"avax",
}

def _fmt(v):
    try: v=float(v)
    except: return "$?"
    if v>=1_000_000_000: return f"${v/1_000_000_000:.2f}B"
    if v>=1_000_000:     return f"${v/1_000_000:.1f}M"
    if v>=1_000:         return f"${v/1_000:.0f}K"
    return f"${v:,.2f}"

def _post(endpoint, payload):
    if not BRIDGE_URL or not BRIDGE_KEY: return None
    try:
        return requests.post(
            f"{BRIDGE_URL.rstrip('/')}{endpoint}",
            json=payload,
            headers={"X-API-Key": BRIDGE_KEY},
            timeout=5,
        )
    except Exception as e:
        print(f"[BRIDGE] ❌ {endpoint}: {e}")
        return None

# ══════════════════════════════════════════════════════════
# SEÑALES PERP (LONG/SHORT)
# ══════════════════════════════════════════════════════════

def send_signal(exchange, pair, direction, lev=None, tier="MID",
                entry=None, sl=None, tp=None, size_usd=0,
                score=50, wallet="", note="", signal_id=None):
    ex_key = EXCHANGE_MAP.get(exchange, exchange.lower()[:8])
    sid    = signal_id or f"{ex_key}-{pair.replace('/','')}-{direction}-{int(time.time())}"
    payload = {
        "id":       sid,
        "exchange": ex_key,
        "pair":     pair,
        "dir":      direction.upper(),
        "lev":      f"{lev:.0f}x" if lev else "?x",
        "tier":     tier,
        "entry":    f"{entry:,.4f}" if entry else "?",
        "size":     _fmt(size_usd),
        "sl":       f"{sl:,.4f}" if sl else "—",
        "tp":       f"{tp:,.4f}" if tp else "—",
        "score":    int(score),
        "wallet":   wallet,
        "note":     note,
    }
    r = _post("/api/signal", payload)
    if r and r.status_code in (200,201):
        print(f"[BRIDGE] ✅ SIGNAL {ex_key.upper()} {pair} {direction} score={score}")

def send_signal_from_whale_intel(wallet_data, rating, action, positions, reason):
    if action not in ("NUEVO_LONG","NUEVO_SHORT","NUEVA_BALLENA"): return
    all_pos = sorted(positions.get("longs",[])+positions.get("shorts",[]),key=lambda x:x["notional"],reverse=True)
    pos = all_pos[0] if all_pos else {}
    direction = "LONG" if action=="NUEVO_LONG" else "SHORT"
    if pos: direction = pos.get("side", direction)
    send_signal(
        exchange  = wallet_data.get("exchange","Hyperliquid"),
        pair      = f"{pos.get('coin','MULTI')}/USDT",
        direction = direction,
        lev       = pos.get("leverage",1) if pos else None,
        tier      = TIER_MAP.get(rating.get("whale_class",""),"MID"),
        entry     = pos.get("entry_px") if pos else None,
        sl        = pos.get("liquidation_px") if pos else None,
        size_usd  = pos.get("notional",0) if pos else positions.get("total_notional",0),
        score     = rating.get("score",50),
        wallet    = wallet_data.get("address","")[:10],
        note      = reason,
    )

def send_signal_from_scanner(exchange, pair, direction, size_usd,
                              price=None, leverage=None, whale_class="BALLENA",
                              wallet="", chain=""):
    if size_usd>=10_000_000: score=95
    elif size_usd>=5_000_000: score=85
    elif size_usd>=2_000_000: score=72
    elif size_usd>=1_000_000: score=60
    else: score=max(30,int(size_usd/10_000))
    send_signal(
        exchange=exchange, pair=pair, direction=direction,
        lev=leverage, tier=TIER_MAP.get(whale_class,"MID"),
        entry=price, size_usd=size_usd, score=score, wallet=wallet,
        note=f"{exchange} · {chain.upper() if chain else ''} · {_fmt(size_usd)}",
    )

# ══════════════════════════════════════════════════════════
# CEX SIGNALS (OI, Funding, Liquidaciones, L/S, F&G)
# ══════════════════════════════════════════════════════════

def send_cex_signal(signal_type, exchange, symbol, value, note="", extra=None):
    """
    signal_type: "liquidation"|"oi_spike"|"funding"|"long_short"|"fear_greed"
    """
    if not BRIDGE_URL or not BRIDGE_KEY: return
    sid = f"cex-{signal_type}-{exchange}-{symbol}-{int(time.time())}"
    payload = {
        "id":          sid,
        "signal_type": signal_type,
        "exchange":    EXCHANGE_MAP.get(exchange, exchange.lower()),
        "symbol":      symbol,
        "value":       value,
        "note":        note,
        "extra":       extra or {},
    }
    r = _post("/api/cex_signal", payload)
    if r and r.status_code in (200,201):
        print(f"[BRIDGE] 📊 CEX {signal_type.upper()} {exchange} {symbol}")

# ══════════════════════════════════════════════════════════
# GEMAS (DegenScout + spot_whales)
# ══════════════════════════════════════════════════════════

def _calc_gem_score(checks, liq_usd, vol_usd, holders, pump_graduated, pump_in_pool, cex_catalyst):
    score = 0
    if checks.get("mintRevoked"):    score += 12
    if checks.get("freezeRevoked"):  score += 10
    if not checks.get("honeypot"):   score += 5
    rug = checks.get("rugRisk", 100)
    if rug<=10: score+=8
    elif rug<=30: score+=4
    if liq_usd>=100_000: score+=10
    elif liq_usd>=50_000: score+=6
    elif liq_usd>=10_000: score+=3
    if vol_usd>=500_000: score+=10
    elif vol_usd>=100_000: score+=6
    elif vol_usd>=20_000: score+=3
    if holders>=500: score+=5
    elif holders>=100: score+=2
    if pump_in_pool:    score+=15
    elif pump_graduated: score+=8
    if cex_catalyst=="Coinbase": score+=10
    elif cex_catalyst=="CMC":    score+=6
    return min(100, score)

def send_gem(token, chain, source, liq_usd=0, vol_usd=0, holders=0,
             wallet="", accum_times=1, total_accum_usd=0,
             checks=None, pump_graduated=False, pump_in_pool=False,
             cex_catalyst=None, signal_text="", age_days=None,
             dex_score=None):
    if checks is None: checks={}
    score = dex_score if dex_score is not None else _calc_gem_score(
        checks, liq_usd, vol_usd, holders, pump_graduated, pump_in_pool, cex_catalyst)
    grade = "S" if score>=85 else "A" if score>=70 else "B" if score>=55 else "C"
    chain_key = CHAIN_KEY_MAP.get(chain, chain)
    gem_id = f"{source}-{token}-{chain_key}-{wallet[:8] if wallet else 'anon'}"
    payload = {
        "id": gem_id, "source": source, "token": token,
        "chain": chain_key, "liq": _fmt(liq_usd), "vol24": _fmt(vol_usd),
        "age": f"{age_days}d" if age_days else "?",
        "holders": holders, "score": score, "grade": grade,
        "wallet": wallet, "accum_times": accum_times,
        "total_accum": _fmt(total_accum_usd), "signal": signal_text,
        "checks": checks, "pump_graduated": pump_graduated,
        "pump_in_pool": pump_in_pool, "cex_catalyst": cex_catalyst,
    }
    r = _post("/api/gem", payload)
    if r and r.status_code in (200,201):
        status = r.json().get("status","ok")
        print(f"[BRIDGE] 💎 {status.upper()} {token} ({chain_key}) score={score} grade={grade}")

def send_gem_from_degen(pool, score, source="dex", verdict="🟢",
                        pump_graduated=False, pump_in_pool=False, cex_catalyst=None):
    """Wrapper para DegenScout gems.py / rugcheck_scanner.py / pump_fun.py"""
    chain = pool.get("chain","")
    chain_key = CHAIN_KEY_MAP.get(chain, chain)
    liq   = pool.get("liquidity_usd", 0)
    vol   = pool.get("volume_h24", 0)
    name  = pool.get("name","?")
    token = name.split("/")[0].strip() if "/" in name else name
    checks = {
        "mintRevoked":   "🟢" in verdict or "🟡" in verdict,
        "freezeRevoked": "🟢" in verdict,
        "honeypot":      "☠️" in verdict or "🔴" in verdict,
        "rugRisk":       0 if "🟢" in verdict else (30 if "🟡" in verdict else 80),
    }
    send_gem(
        token=token, chain=chain_key, source=source,
        liq_usd=liq, vol_usd=vol,
        holders=0, dex_score=score,
        checks=checks,
        pump_graduated=pump_graduated, pump_in_pool=pump_in_pool,
        cex_catalyst=cex_catalyst,
        signal_text=f"{source} · {chain_key.upper()} · LP={_fmt(liq)} Vol={_fmt(vol)}",
    )

def send_gem_from_spot_whales(wallet, chain, token_sym, token_addr,
                               amount_usd, accum_list, pool_name=""):
    chain_key    = CHAIN_KEY_MAP.get(chain, chain)
    accum_times  = len(accum_list)+1
    total_accum  = sum(a.get("amount_usd",0) for a in accum_list)+amount_usd
    signal_text  = (
        f"Wallet repitiendo compras ×{accum_times} · acumulación {'institucional' if total_accum>500_000 else 'early'}"
        if accum_times>=3 else f"Compra whale spot · {pool_name}"
    )
    send_gem(
        token=token_sym, chain=chain_key, source="dex",
        vol_usd=amount_usd*accum_times,
        wallet=wallet, accum_times=accum_times, total_accum_usd=total_accum,
        checks={"mintRevoked":False,"freezeRevoked":False,"honeypot":False,"rugRisk":50},
        signal_text=signal_text,
    )

def send_gem_from_rugcheck(mint, symbol, verdict, risk_score, liq_usd=0,
                           vol_usd=0, source="rug"):
    checks = {
        "mintRevoked":   "🟢" in verdict,
        "freezeRevoked": "🟢" in verdict,
        "honeypot":      False,
        "rugRisk":       risk_score,
    }
    send_gem(
        token=symbol, chain="sol", source=source,
        liq_usd=liq_usd, vol_usd=vol_usd,
        checks=checks,
        signal_text=f"RugCheck {verdict} · risk={risk_score}/100 · Solana",
    )

def send_gem_from_pump(mint, symbol, mcap, progress, pump_in_pool=False):
    send_gem(
        token=symbol, chain="sol", source="pump",
        liq_usd=mcap*0.1, vol_usd=mcap*0.5,
        pump_graduated=True, pump_in_pool=pump_in_pool,
        checks={"mintRevoked":True,"freezeRevoked":False,"honeypot":False,"rugRisk":15},
        signal_text=f"Pump.fun {progress:.1f}% · MCap={_fmt(mcap)} · {'en Raydium' if pump_in_pool else 'graduando'}",
    )

def send_gem_from_cmc(cmc_id, symbol, name, mcap, price, vol24h, pc24h):
    send_gem(
        token=symbol, chain="eth", source="cmc",
        liq_usd=vol24h*0.1, vol_usd=vol24h,
        cex_catalyst="CMC",
        checks={"mintRevoked":True,"freezeRevoked":True,"honeypot":False,"rugRisk":5},
        signal_text=f"Nuevo listing CMC · {name} · MCap={_fmt(mcap)} · Δ24h={pc24h:+.1f}%",
    )
