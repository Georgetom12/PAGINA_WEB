"""
╔═══════════════════════════════════════════════════════════╗
║   PSYCHOMETRIKS · SIGNAL BRIDGE v2.0                      ║
║   Whale Intel + WhalePerp + CEX Signals + DegenScout      ║
╚═══════════════════════════════════════════════════════════╝
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import os, time
from datetime import datetime, timezone
from collections import deque

app = Flask(__name__)
CORS(app)

API_KEY     = os.getenv("BRIDGE_API_KEY", "psychometriks-secret")
MAX_SIGNALS = int(os.getenv("MAX_SIGNALS", "200"))
MAX_GEMS    = int(os.getenv("MAX_GEMS",    "200"))
MAX_CEX     = int(os.getenv("MAX_CEX",     "100"))

state = {
    "signals":         deque(maxlen=MAX_SIGNALS),
    "gems":            deque(maxlen=MAX_GEMS),
    "cex_signals":     deque(maxlen=MAX_CEX),
    "seen_signal_ids": set(),
    "seen_gem_ids":    set(),
    "seen_cex_ids":    set(),
    "stats": {
        "total_signals":     0,
        "total_gems":        0,
        "total_cex_signals": 0,
        "started_at":        datetime.now(timezone.utc).isoformat(),
    }
}

def check_auth(req):
    key = req.headers.get("X-API-Key") or req.args.get("api_key")
    return key == API_KEY

def _mins(ts):
    return max(0, int((time.time() - ts) / 60))

# ── HEALTH ────────────────────────────────────────────────
@app.route("/health")
def health():
    return jsonify({
        "status":        "ok",
        "version":       "2.0",
        "signals":       len(state["signals"]),
        "gems":          len(state["gems"]),
        "cex_signals":   len(state["cex_signals"]),
        "total_signals": state["stats"]["total_signals"],
        "total_gems":    state["stats"]["total_gems"],
        "total_cex":     state["stats"]["total_cex_signals"],
        "started_at":    state["stats"]["started_at"],
    })

# ── GET SIGNALS ───────────────────────────────────────────
@app.route("/api/signals")
def api_signals():
    signals = list(state["signals"])
    ex = request.args.get("exchange")
    if ex: signals = [s for s in signals if s.get("exchange","").lower()==ex.lower()]
    d  = request.args.get("dir")
    if d:  signals = [s for s in signals if s.get("dir","").upper()==d.upper()]
    limit = int(request.args.get("limit",100))
    for s in signals: s["mins"] = _mins(s.get("ts",time.time()))
    return jsonify(signals[:limit])

# ── GET GEMS ──────────────────────────────────────────────
@app.route("/api/gems")
def api_gems():
    gems = list(state["gems"])
    src  = request.args.get("source")
    if src: gems = [g for g in gems if g.get("source","").lower()==src.lower()]
    ms   = int(request.args.get("min_score",0))
    if ms: gems = [g for g in gems if g.get("score",0)>=ms]
    ch   = request.args.get("chain")
    if ch: gems = [g for g in gems if g.get("chain","").lower()==ch.lower()]
    limit = int(request.args.get("limit",100))
    for g in gems: g["mins"] = _mins(g.get("ts",time.time()))
    return jsonify(gems[:limit])

# ── GET CEX SIGNALS ───────────────────────────────────────
@app.route("/api/cex_signals")
def api_cex_signals():
    signals = list(state["cex_signals"])
    st = request.args.get("type")
    if st: signals = [s for s in signals if s.get("signal_type","").lower()==st.lower()]
    ex = request.args.get("exchange")
    if ex: signals = [s for s in signals if s.get("exchange","").lower()==ex.lower()]
    limit = int(request.args.get("limit",50))
    for s in signals: s["mins"] = _mins(s.get("ts",time.time()))
    return jsonify(signals[:limit])

# ── GET SUMMARY ───────────────────────────────────────────
@app.route("/api/summary")
def api_summary():
    signals = list(state["signals"])
    gems    = list(state["gems"])
    cex     = list(state["cex_signals"])
    total_n = len(signals)
    longs   = [s for s in signals if s.get("dir")=="LONG"]
    shorts  = [s for s in signals if s.get("dir")=="SHORT"]
    long_pct = round(len(longs)/total_n*100,1) if total_n else 50
    exchanges = {}
    for s in signals:
        ex=s.get("exchange","unknown"); exchanges[ex]=exchanges.get(ex,0)+1
    gem_by_src = {}
    for g in gems:
        src=g.get("source","unknown"); gem_by_src[src]=gem_by_src.get(src,0)+1
    cex_types = {}
    for c in cex:
        t=c.get("signal_type","unknown"); cex_types[t]=cex_types.get(t,0)+1
    return jsonify({
        "total_signals":  total_n,
        "longs":          len(longs),
        "shorts":         len(shorts),
        "long_pct":       long_pct,
        "bias":           "BULLISH" if long_pct>55 else ("BEARISH" if long_pct<45 else "NEUTRAL"),
        "exchanges":      exchanges,
        "total_gems":     len(gems),
        "gems_by_source": gem_by_src,
        "gems_grade_S":   len([g for g in gems if g.get("score",0)>=85]),
        "gems_grade_A":   len([g for g in gems if 70<=g.get("score",0)<85]),
        "total_cex":      len(cex),
        "cex_by_type":    cex_types,
        "started_at":     state["stats"]["started_at"],
    })

# ── POST SIGNAL ───────────────────────────────────────────
@app.route("/api/signal", methods=["POST"])
def post_signal():
    if not check_auth(request): return jsonify({"error":"unauthorized"}),401
    data = request.get_json(silent=True)
    if not data: return jsonify({"error":"no data"}),400
    for f in ["exchange","pair","dir","score"]:
        if f not in data: return jsonify({"error":f"missing:{f}"}),400
    sid = data.get("id") or f"{data['exchange']}-{data['pair']}-{data['dir']}-{int(time.time())}"
    if sid in state["seen_signal_ids"]:
        return jsonify({"status":"duplicate","id":sid}),200
    signal = {
        "id":       sid,
        "exchange": data.get("exchange","unknown").lower(),
        "pair":     data.get("pair","???"),
        "dir":      data.get("dir","LONG").upper(),
        "lev":      data.get("lev","?x"),
        "tier":     data.get("tier","MID"),
        "entry":    str(data.get("entry","?")),
        "size":     str(data.get("size","?")),
        "sl":       str(data.get("sl","?")),
        "tp":       str(data.get("tp","?")),
        "score":    int(data.get("score",50)),
        "wallet":   data.get("wallet",""),
        "note":     data.get("note",""),
        "ts":       int(time.time()),
        "mins":     0,
    }
    state["signals"].appendleft(signal)
    state["seen_signal_ids"].add(sid)
    state["stats"]["total_signals"] += 1
    print(f"[SIGNAL] {signal['exchange'].upper()} · {signal['pair']} · {signal['dir']} · score={signal['score']}")
    return jsonify({"status":"ok","id":sid}),201

# ── POST GEM ──────────────────────────────────────────────
@app.route("/api/gem", methods=["POST"])
def post_gem():
    if not check_auth(request): return jsonify({"error":"unauthorized"}),401
    data = request.get_json(silent=True)
    if not data: return jsonify({"error":"no data"}),400
    gem_id = data.get("id") or f"{data.get('source','?')}-{data.get('token','?')}-{int(time.time())}"
    existing = next((g for g in state["gems"] if g["id"]==gem_id),None)
    if existing:
        existing["accum_times"] = data.get("accum_times", existing["accum_times"]+1)
        existing["total_accum"] = data.get("total_accum", existing["total_accum"])
        existing["ts"]          = int(time.time())
        print(f"[GEM UPDATE] {existing['token']} ×{existing['accum_times']}")
        return jsonify({"status":"updated","id":gem_id,"accum_times":existing["accum_times"]}),200
    gem = {
        "id":             gem_id,
        "source":         data.get("source","dex").lower(),
        "token":          data.get("token","???"),
        "chain":          data.get("chain","eth").lower(),
        "liq":            str(data.get("liq","?")),
        "vol24":          str(data.get("vol24","?")),
        "age":            str(data.get("age","?")),
        "holders":        int(data.get("holders",0)),
        "score":          int(data.get("score",50)),
        "grade":          data.get("grade","B"),
        "wallet":         data.get("wallet",""),
        "accum_times":    int(data.get("accum_times",1)),
        "total_accum":    str(data.get("total_accum","?")),
        "signal":         data.get("signal",""),
        "checks":         data.get("checks",{}),
        "pump_graduated": bool(data.get("pump_graduated",False)),
        "pump_in_pool":   bool(data.get("pump_in_pool",False)),
        "cex_catalyst":   data.get("cex_catalyst",None),
        "ts":             int(time.time()),
        "mins":           0,
    }
    state["gems"].appendleft(gem)
    state["seen_gem_ids"].add(gem_id)
    state["stats"]["total_gems"] += 1
    print(f"[GEM] {gem['source'].upper()} · {gem['token']} · {gem['chain'].upper()} · score={gem['score']}")
    return jsonify({"status":"ok","id":gem_id}),201

# ── POST CEX SIGNAL ───────────────────────────────────────
@app.route("/api/cex_signal", methods=["POST"])
def post_cex_signal():
    if not check_auth(request): return jsonify({"error":"unauthorized"}),401
    data = request.get_json(silent=True)
    if not data: return jsonify({"error":"no data"}),400
    sid = data.get("id") or f"cex-{data.get('signal_type','?')}-{int(time.time())}"
    if sid in state["seen_cex_ids"]:
        return jsonify({"status":"duplicate","id":sid}),200
    cex = {
        "id":          sid,
        "signal_type": data.get("signal_type","unknown"),
        "exchange":    data.get("exchange","unknown"),
        "symbol":      data.get("symbol","?"),
        "value":       data.get("value",0),
        "note":        data.get("note",""),
        "extra":       data.get("extra",{}),
        "ts":          int(time.time()),
        "mins":        0,
    }
    state["cex_signals"].appendleft(cex)
    state["seen_cex_ids"].add(sid)
    state["stats"]["total_cex_signals"] += 1
    print(f"[CEX] {cex['signal_type'].upper()} · {cex['exchange']} · {cex['symbol']}")
    return jsonify({"status":"ok","id":sid}),201

if __name__ == "__main__":
    port = int(os.getenv("PORT",8090))
    print(f"[BRIDGE] PSYCHOMETRIKS Signal Bridge v2.0 · puerto {port}")
    app.run(host="0.0.0.0", port=port)
