"""
PSY MOTOR — CURSOR 6: MEMORIA + APRENDIZAJE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
El motor aprende de sus señales anteriores:
  - Guarda cada señal con entrada, SL, TPs
  - Verifica si los TPs se alcanzaron
  - Calcula accuracy por símbolo y tipo de señal
  - Ajusta pesos automáticamente
  - Detecta patrones que funcionan mejor
  - Evita repetir señales fallidas recientes
"""
from __future__ import annotations
import os
import sqlite3
import json
import time
import logging
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from typing import Optional

log = logging.getLogger(__name__)

# DB_PATH: antes hardcodeado a /tmp/psy_motor.db — /tmp NO persiste entre
# deploys de Railway, así que cada redeploy borraba TODO el historial de
# aprendizaje. Ahora usa la variable de entorno MEMORIA_DB_PATH, que debe
# apuntar a un Volumen persistente de Railway (ej. "/data/psy_motor.db").
# Si esa variable no está configurada, cae a /tmp como antes (para que
# siga funcionando en desarrollo local sin necesitar un volumen).
DB_PATH = os.environ.get("MEMORIA_DB_PATH", "/tmp/psy_motor.db")
_db_dir = os.path.dirname(DB_PATH)
if _db_dir:
    os.makedirs(_db_dir, exist_ok=True)


# ══════════════════════════════════════════════════════════
# TABLAS DE MEMORIA
# ══════════════════════════════════════════════════════════
def init_memoria():
    """Inicializa las tablas de memoria."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Señales históricas
    c.execute('''CREATE TABLE IF NOT EXISTS senales (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol      TEXT,
        timestamp   INTEGER,
        direccion   TEXT,
        confianza   REAL,
        entrada     REAL,
        sl          REAL,
        tp1         REAL,
        tp2         REAL,
        tp3         REAL,
        patron      TEXT,
        zona        TEXT,
        cs_618      INTEGER,
        bear_score  INTEGER,
        sesgo_macro TEXT,
        resultado   TEXT DEFAULT "PENDIENTE",
        tp_alcanzado INTEGER DEFAULT 0,
        precio_cierre REAL DEFAULT 0,
        ganancia_pct  REAL DEFAULT 0,
        tiempo_horas  REAL DEFAULT 0,
        notas       TEXT DEFAULT ""
    )''')

    # ── Migración: checkpoints independientes por TP ──────
    # Antes, en cuanto tocaba TP1 la señal se cerraba para siempre y
    # nunca se volvía a revisar si después llegaba a TP2/TP3 — eso
    # hacía que el accuracy de TP2/TP3 saliera artificialmente bajo.
    # Cada checkpoint ahora se marca de forma independiente y la señal
    # solo cierra en TP3, SL, o expiración.
    migraciones = [
        ("tp1_hit",    "INTEGER DEFAULT 0"),
        ("tp1_hit_at", "INTEGER DEFAULT 0"),
        ("tp2_hit",    "INTEGER DEFAULT 0"),
        ("tp2_hit_at", "INTEGER DEFAULT 0"),
        ("tp3_hit",    "INTEGER DEFAULT 0"),
        ("tp3_hit_at", "INTEGER DEFAULT 0"),
        ("sl_hit",     "INTEGER DEFAULT 0"),
        ("sl_hit_at",  "INTEGER DEFAULT 0"),
        ("volumen_alto", "INTEGER DEFAULT 0"),
        ("volumen_rel",  "REAL DEFAULT 1.0"),
        # modo: "swing" (4H-1D-1SEM) o "scalping" (5M-15M-30M-1H) — antes
        # solo se guardaba swing, scalping nunca aprendía de sí mismo.
        ("modo",          "TEXT DEFAULT 'swing'"),
        # origen: "live" (señal real generada en producción) o "backtest"
        # (sembrada retroactivamente para no arrancar en cero)
        ("origen",        "TEXT DEFAULT 'live'"),
        # a qué nivel Fibonacci quedó más cerca la entrada — para poder
        # responder "qué zona fibo se repite más, y en qué fractal"
        ("fib_nivel_entrada", "TEXT DEFAULT ''"),
    ]
    for col, tipo in migraciones:
        try:
            c.execute(f"ALTER TABLE senales ADD COLUMN {col} {tipo}")
        except sqlite3.OperationalError:
            pass  # ya existe (DB de un deploy anterior)

    # Estadística de qué zona Fibonacci se repite más, por fractal y modo —
    # responde "en qué nivel retrocede más seguido este patrón, y con qué
    # frecuencia" en vez de asumir un nivel fijo (61.8%) a ciegas
    c.execute('''CREATE TABLE IF NOT EXISTS stats_fib_fractal (
        patron          TEXT,
        modo            TEXT,
        fib_nivel       TEXT,
        total           INTEGER DEFAULT 0,
        ganadoras       INTEGER DEFAULT 0,
        winrate         REAL DEFAULT 0,
        ganancia_avg    REAL DEFAULT 0,
        updated_at      INTEGER DEFAULT 0,
        PRIMARY KEY (patron, modo, fib_nivel)
    )''')

    # Stats por símbolo
    c.execute('''CREATE TABLE IF NOT EXISTS stats_simbolo (
        symbol      TEXT PRIMARY KEY,
        total       INTEGER DEFAULT 0,
        ganadoras   INTEGER DEFAULT 0,
        perdedoras  INTEGER DEFAULT 0,
        accuracy    REAL DEFAULT 0,
        ganancia_avg REAL DEFAULT 0,
        mejor_patron TEXT DEFAULT "",
        mejor_cs    INTEGER DEFAULT 0,
        tp1_rate    REAL DEFAULT 0,
        tp2_rate    REAL DEFAULT 0,
        tp3_rate    REAL DEFAULT 0,
        sl_rate     REAL DEFAULT 0,
        updated_at  INTEGER DEFAULT 0
    )''')
    for col, tipo in [("tp1_rate","REAL DEFAULT 0"), ("tp2_rate","REAL DEFAULT 0"),
                      ("tp3_rate","REAL DEFAULT 0"), ("sl_rate","REAL DEFAULT 0")]:
        try:
            c.execute(f"ALTER TABLE stats_simbolo ADD COLUMN {col} {tipo}")
        except sqlite3.OperationalError:
            pass

    # Pesos aprendidos
    c.execute('''CREATE TABLE IF NOT EXISTS pesos_aprendidos (
        clave   TEXT PRIMARY KEY,
        peso    REAL DEFAULT 1.0,
        muestras INTEGER DEFAULT 0,
        updated_at INTEGER DEFAULT 0
    )''')

    conn.commit()
    conn.close()
    log.info("✅ Memoria inicializada")


# ══════════════════════════════════════════════════════════
# GUARDAR SEÑAL
# ══════════════════════════════════════════════════════════
def _clasificar_fib_nivel(entrada: float, nucleo) -> str:
    """
    ¿A qué nivel Fibonacci real quedó más cerca la zona de entrada?
    Esto es lo que permite responder "este fractal, en este símbolo,
    ¿retrocede más seguido a 61.8% o a 78.6%? ¿cuántas veces?" en vez
    de asumir un nivel fijo a ciegas.
    """
    if not entrada:
        return ""
    niveles = {
        "38.2%":  getattr(nucleo, "fib_382", 0),
        "50.0%":  getattr(nucleo, "fib_50", 0),
        "61.8%":  getattr(nucleo, "fib_618", 0),
        "78.6%":  getattr(nucleo, "fib_786", 0),
        "88.6%":  getattr(nucleo, "fib_886", 0),
        "Ext 127.2%": getattr(nucleo, "fib_e127", 0),
        "Ext 161.8%": getattr(nucleo, "fib_e161", 0),
    }
    niveles = {k: v for k, v in niveles.items() if v}
    if not niveles:
        return ""
    mas_cercano = min(niveles.items(), key=lambda kv: abs(kv[1] - entrada))
    # Si ni el más cercano está razonablemente cerca (dentro de 5% del
    # precio), no lo etiquetes — mejor "sin clasificar" que un dato falso
    if abs(mas_cercano[1] - entrada) / max(entrada, 1e-10) > 0.05:
        return ""
    return mas_cercano[0]


# ══════════════════════════════════════════════════════════
# GUARDAR SEÑAL
# ══════════════════════════════════════════════════════════
def guardar_senal(symbol: str, dictamen, nucleo,
                  macro_sesgo: str = "NEUTRAL",
                  modo: str = "swing",
                  origen: str = "live") -> int:
    """
    Guarda una señal nueva en la memoria.
    modo:   "swing" o "scalping" — antes solo se guardaba swing.
    origen: "live" (señal real de producción) o "backtest" (sembrada
            retroactivamente para no arrancar el aprendizaje en cero).
    """
    try:
        vol_rel    = getattr(nucleo, "volumen_rel", 1.0)
        vol_alto   = 1 if vol_rel > 1.5 else 0
        fib_nivel  = _clasificar_fib_nivel(dictamen.zona_entrada, nucleo)

        conn = sqlite3.connect(DB_PATH)
        conn.execute('''INSERT INTO senales
            (symbol, timestamp, direccion, confianza,
             entrada, sl, tp1, tp2, tp3,
             patron, zona, cs_618, bear_score, sesgo_macro,
             volumen_alto, volumen_rel, modo, origen, fib_nivel_entrada)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''', (
            symbol,
            int(time.time()),
            dictamen.direccion,
            dictamen.confianza,
            dictamen.zona_entrada,
            dictamen.sl,
            dictamen.tp1_corto,
            dictamen.tp2_corto,
            dictamen.tp3_corto,
            getattr(nucleo, "fractal_tipo", "NINGUNO"),
            getattr(nucleo, "fractal_pro_patron", "NINGUNO"),
            getattr(nucleo, "__dict__", {}).get("cs_618", 0),
            getattr(nucleo, "__dict__", {}).get("bear_score", 50),
            macro_sesgo,
            vol_alto,
            round(vol_rel, 3),
            modo,
            origen,
            fib_nivel,
        ))
        senal_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.commit()
        conn.close()
        log.info(f"✅ Señal guardada #{senal_id} {symbol} [{modo}/{origen}] {dictamen.direccion}")
        return senal_id
    except Exception as e:
        log.warning(f"guardar_senal {symbol}: {e}")
        return 0


# ══════════════════════════════════════════════════════════
# VERIFICAR RESULTADOS
# ══════════════════════════════════════════════════════════
def get_pending_symbols() -> list:
    """Símbolos con señales PENDIENTE — para saber a quién pedirle precio."""
    try:
        conn = sqlite3.connect(DB_PATH)
        rows = conn.execute(
            "SELECT DISTINCT symbol FROM senales WHERE resultado = 'PENDIENTE'"
        ).fetchall()
        conn.close()
        return [r[0] for r in rows]
    except Exception as e:
        log.warning(f"get_pending_symbols: {e}")
        return []


def verificar_resultados(precio_actual: dict):
    """
    Verifica señales pendientes contra precios actuales.
    precio_actual = {"BTCUSDT": 65000, "ETHUSDT": 3200, ...}

    Cada TP (1/2/3) se marca como checkpoint INDEPENDIENTE la primera vez
    que se toca — antes, tocar TP1 cerraba la señal para siempre y nunca
    se revisaba si después llegaba a TP2/TP3, lo que subestimaba esas tasas.
    La señal solo se cierra (deja de estar PENDIENTE) al tocar TP3, SL,
    o expirar a las 72h.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        pendientes = conn.execute(
            "SELECT id, symbol, direccion, entrada, sl, tp1, tp2, tp3, timestamp, "
            "tp1_hit, tp2_hit, tp3_hit, sl_hit "
            "FROM senales WHERE resultado = 'PENDIENTE' "
            "ORDER BY timestamp DESC LIMIT 100"
        ).fetchall()

        ahora = int(time.time())

        for row in pendientes:
            (sid, sym, dir_, entrada, sl, tp1, tp2, tp3, ts,
             tp1_hit, tp2_hit, tp3_hit, sl_hit) = row

            precio = precio_actual.get(sym, 0)
            if precio <= 0:
                continue

            horas = (ahora - ts) / 3600

            def _tocado(nivel):
                if not nivel:
                    return False
                if dir_ == "ALCISTA":
                    return precio >= nivel
                else:
                    return precio <= nivel

            def _tocado_sl():
                if not sl:
                    return False
                if dir_ == "ALCISTA":
                    return precio <= sl
                else:
                    return precio >= sl

            # ── Marcar checkpoints nuevos (solo la primera vez) ──
            nuevo_tp1 = (not tp1_hit) and _tocado(tp1)
            nuevo_tp2 = (not tp2_hit) and _tocado(tp2)
            nuevo_tp3 = (not tp3_hit) and _tocado(tp3)
            nuevo_sl  = (not sl_hit)  and _tocado_sl()

            if nuevo_tp1 or nuevo_tp2 or nuevo_tp3 or nuevo_sl:
                sets, vals = [], []
                if nuevo_tp1: sets += ["tp1_hit=1", "tp1_hit_at=?"]; vals.append(ahora)
                if nuevo_tp2: sets += ["tp2_hit=1", "tp2_hit_at=?"]; vals.append(ahora)
                if nuevo_tp3: sets += ["tp3_hit=1", "tp3_hit_at=?"]; vals.append(ahora)
                if nuevo_sl:  sets += ["sl_hit=1",  "sl_hit_at=?"];  vals.append(ahora)
                vals.append(sid)
                conn.execute(f"UPDATE senales SET {','.join(sets)} WHERE id=?", vals)
                for tp_num, hit in ((1,nuevo_tp1),(2,nuevo_tp2),(3,nuevo_tp3)):
                    if hit:
                        log.info(f"🎯 Señal #{sid} {sym}: checkpoint TP{tp_num} tocado")
                if nuevo_sl:
                    log.info(f"🛑 Señal #{sid} {sym}: checkpoint SL tocado")

            tp1_hit = tp1_hit or nuevo_tp1
            tp2_hit = tp2_hit or nuevo_tp2
            tp3_hit = tp3_hit or nuevo_tp3
            sl_hit  = sl_hit  or nuevo_sl

            # ── ¿Se cierra la señal? Solo en TP3, SL, o expiración ──
            resultado = None
            tp_alc = max(n for n, hit in ((0,True),(1,tp1_hit),(2,tp2_hit),(3,tp3_hit)) if hit)
            ganancia = 0.0

            if tp3_hit:
                resultado = "TP3"
                ganancia = (tp3 - entrada) / entrada * 100 if dir_ == "ALCISTA" \
                           else (entrada - tp3) / entrada * 100
            elif sl_hit:
                # Si ya había tocado algún TP antes del SL, es una ganancia
                # parcial (se cerró en el TP alcanzado), no una pérdida limpia
                if tp_alc > 0:
                    nivel = {1: tp1, 2: tp2}[tp_alc]
                    resultado = f"TP{tp_alc}_SL"
                    ganancia = (nivel - entrada) / entrada * 100 if dir_ == "ALCISTA" \
                               else (entrada - nivel) / entrada * 100
                else:
                    resultado = "SL"
                    ganancia = (sl - entrada) / entrada * 100 if dir_ == "ALCISTA" \
                               else (entrada - sl) / entrada * 100
            elif horas > 72:
                resultado = "EXPIRADA"
                ganancia = (precio - entrada) / entrada * 100 if dir_ == "ALCISTA" \
                           else (entrada - precio) / entrada * 100

            if resultado:
                conn.execute(
                    "UPDATE senales SET resultado=?, tp_alcanzado=?, "
                    "precio_cierre=?, ganancia_pct=?, tiempo_horas=? "
                    "WHERE id=?",
                    (resultado, tp_alc, precio,
                     round(ganancia, 2), round(horas, 1), sid)
                )
                log.info(f"📊 Señal #{sid} {sym}: CERRADA {resultado} "
                         f"({ganancia:+.2f}% en {horas:.0f}h)")

        conn.commit()

        # Actualizar stats
        _actualizar_stats(conn)
        conn.close()

    except Exception as e:
        log.warning(f"verificar_resultados: {e}")


def _actualizar_stats(conn):
    """
    Actualiza stats por símbolo+modo (BTCUSDT:swing y BTCUSDT:scalping se
    miden por separado, porque no se comportan igual) y por zona Fibonacci
    + fractal (para saber a qué nivel retrocede más seguido cada patrón).
    """
    combos = conn.execute(
        "SELECT DISTINCT symbol, modo FROM senales WHERE resultado != 'PENDIENTE'"
    ).fetchall()

    for sym, modo in combos:
        modo = modo or "swing"
        rows = conn.execute(
            "SELECT resultado, ganancia_pct, patron, cs_618, "
            "tp1_hit, tp2_hit, tp3_hit, sl_hit "
            "FROM senales WHERE symbol=? AND modo=? AND resultado != 'PENDIENTE'",
            (sym, modo)
        ).fetchall()

        total     = len(rows)
        # "Ganadora" = tocó al menos TP1 en algún momento (aunque después
        # haya cerrado en SL con ganancia parcial tipo TP1_SL)
        ganadoras = sum(1 for r in rows if r[0] not in ("SL", "EXPIRADA"))
        perdedoras= sum(1 for r in rows if r[0] == "SL")
        accuracy  = ganadoras / max(total, 1) * 100
        ganancias = [r[1] for r in rows if r[1] != 0]
        gan_avg   = sum(ganancias) / max(len(ganancias), 1)

        # Tasa de acierto POR CHECKPOINT — esto es lo nuevo: cada TP se
        # mide de forma independiente sobre el total de señales cerradas,
        # sin importar si después cerró en TP3 o le pegó el SL.
        tp1_rate = sum(1 for r in rows if r[4]) / max(total, 1) * 100
        tp2_rate = sum(1 for r in rows if r[5]) / max(total, 1) * 100
        tp3_rate = sum(1 for r in rows if r[6]) / max(total, 1) * 100
        sl_rate  = sum(1 for r in rows if r[7]) / max(total, 1) * 100

        # Mejor patrón por accuracy
        patrones = {}
        for r in rows:
            p = r[2] or "NINGUNO"
            if p not in patrones:
                patrones[p] = {"total": 0, "gan": 0}
            patrones[p]["total"] += 1
            if r[0] not in ("SL", "EXPIRADA"):
                patrones[p]["gan"] += 1

        mejor_patron = max(patrones.items(),
                          key=lambda x: x[1]["gan"]/max(x[1]["total"],1),
                          default=("NINGUNO", {}))[0]

        mejor_cs = max((r[3] for r in rows if r[0] not in ("SL","EXPIRADA")),
                       default=0)

        # Clave compuesta symbol:modo — así BTCUSDT swing y BTCUSDT scalping
        # no se mezclan (se comportan distinto, son temporalidades distintas)
        clave_symbol = f"{sym}:{modo}"
        conn.execute('''INSERT OR REPLACE INTO stats_simbolo
            (symbol, total, ganadoras, perdedoras, accuracy,
             ganancia_avg, mejor_patron, mejor_cs,
             tp1_rate, tp2_rate, tp3_rate, sl_rate, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)''',
            (clave_symbol, total, ganadoras, perdedoras,
             round(accuracy,1), round(gan_avg,2),
             mejor_patron, mejor_cs,
             round(tp1_rate,1), round(tp2_rate,1),
             round(tp3_rate,1), round(sl_rate,1),
             int(time.time()))
        )

    # ── Qué zona Fibonacci se repite más, por fractal y modo ──
    # Responde directamente "este fractal, ¿a qué nivel retrocede más
    # seguido, y con qué frecuencia/winrate?" en vez de asumir 61.8% fijo.
    combos_fib = conn.execute(
        "SELECT DISTINCT patron, modo, fib_nivel_entrada FROM senales "
        "WHERE resultado != 'PENDIENTE' AND fib_nivel_entrada != ''"
    ).fetchall()
    for patron, modo, fib_nivel in combos_fib:
        patron = patron or "NINGUNO"
        modo = modo or "swing"
        rows = conn.execute(
            "SELECT resultado, ganancia_pct FROM senales "
            "WHERE patron=? AND modo=? AND fib_nivel_entrada=? "
            "AND resultado != 'PENDIENTE'",
            (patron, modo, fib_nivel)
        ).fetchall()
        total = len(rows)
        if total < 3:
            continue
        ganadoras = sum(1 for r in rows if r[0] not in ("SL", "EXPIRADA"))
        winrate = ganadoras / total * 100
        ganancias = [r[1] for r in rows if r[1] != 0]
        gan_avg = sum(ganancias) / max(len(ganancias), 1)
        conn.execute('''INSERT OR REPLACE INTO stats_fib_fractal
            (patron, modo, fib_nivel, total, ganadoras, winrate, ganancia_avg, updated_at)
            VALUES (?,?,?,?,?,?,?,?)''',
            (patron, modo, fib_nivel, total, ganadoras,
             round(winrate,1), round(gan_avg,2), int(time.time()))
        )


# ══════════════════════════════════════════════════════════
# APRENDIZAJE — AJUSTAR PESOS
# ══════════════════════════════════════════════════════════
HALFLIFE_DIAS = 30  # una señal de hace 30 días pesa la mitad que una de hoy


def _procesar_filas(rows):
    """
    Cuenta aciertos/fallos y qué tan lejos llegó el precio, por condición.
    rows = [(patron, cs618, bear, macro, resultado, ganancia, tp_alc, vol_alto, timestamp), ...]

    Cada señal se pondera por RECENCIA (media vida de 30 días) — así una
    racha de señales de hace 2 meses pesa menos que las de la semana
    pasada, y el sistema se "pone al día" más rápido cuando el mercado
    cambia de régimen, en vez de necesitar decenas de señales nuevas para
    superar meses de historial viejo que ya no aplica.

    "total"/"gan" quedan PONDERADOS (para calcular accuracy real);
    "muestras" queda como conteo CRUDO (para el umbral mínimo de datos —
    no queremos que 3 señales muy recientes finjan tener "suficiente dato").
    """
    ahora = time.time()

    def _peso(ts):
        if not ts:
            return 1.0
        dias = max(0.0, (ahora - ts) / 86400)
        return 0.5 ** (dias / HALFLIFE_DIAS)

    condiciones = {
        "cs_618_alto":    {"total": 0.0, "gan": 0.0, "muestras": 0},
        "cs_618_bajo":    {"total": 0.0, "gan": 0.0, "muestras": 0},
        "macro_risk_on":  {"total": 0.0, "gan": 0.0, "muestras": 0},
        "macro_risk_off": {"total": 0.0, "gan": 0.0, "muestras": 0},
        "hch_inv":        {"total": 0.0, "gan": 0.0, "muestras": 0},
        "hch":            {"total": 0.0, "gan": 0.0, "muestras": 0},
        "doble_suelo":    {"total": 0.0, "gan": 0.0, "muestras": 0},
        "bear_alto":      {"total": 0.0, "gan": 0.0, "muestras": 0},
        "bear_bajo":      {"total": 0.0, "gan": 0.0, "muestras": 0},
    }
    tp_reach = {}  # clave -> [(tp_alc, peso), ...]

    for patron, cs618, bear, macro, resultado, ganancia, tp_alc, vol_alto, ts in rows:
        ganadora = resultado not in ("SL", "EXPIRADA")
        tp_alc = tp_alc or 0
        w = _peso(ts)

        def _sumar(clave):
            d = condiciones.setdefault(clave, {"total": 0.0, "gan": 0.0, "muestras": 0})
            d["total"] += w
            d["muestras"] += 1
            if ganadora:
                d["gan"] += w

        if cs618 and cs618 >= 7:
            _sumar("cs_618_alto")
        elif cs618 and cs618 < 4:
            _sumar("cs_618_bajo")

        if macro == "RISK_ON":
            _sumar("macro_risk_on")
        elif macro == "RISK_OFF":
            _sumar("macro_risk_off")

        if patron:
            clave = patron.lower()
            if clave in condiciones:
                _sumar(clave)

        if bear and bear >= 65:
            _sumar("bear_alto")
        elif bear and bear < 40:
            _sumar("bear_bajo")

        _sumar("volumen_alto" if vol_alto else "volumen_bajo")

        clave_patron = (patron or "ninguno").lower()
        for k in (clave_patron, "volumen_alto" if vol_alto else "volumen_bajo"):
            tp_reach.setdefault(k, []).append((tp_alc, w))

    return condiciones, tp_reach


def _guardar_pesos(conn, condiciones, tp_reach, prefijo="", min_accuracy=5, min_tp=8):
    """
    Guarda los pesos calculados. Si `prefijo` viene con un símbolo
    (ej. "BTCUSDT:"), guarda claves tipo "BTCUSDT:hch_inv" — así cada
    activo tiene su propio peso en vez de compartir uno global.

    El umbral mínimo (min_accuracy/min_tp) se aplica sobre la MUESTRA
    CRUDA (cantidad real de señales), no sobre el total ponderado por
    recencia — así unas pocas señales muy recientes no pueden fingir
    "suficiente historial" solo por pesar más.
    """
    guardadas = 0
    for clave, data in condiciones.items():
        if data["muestras"] < min_accuracy or data["total"] <= 0:
            continue
        accuracy = data["gan"] / data["total"]  # ratio ponderado por recencia
        peso = 0.5 + accuracy
        clave_final = f"{prefijo}{clave}"
        conn.execute('''INSERT OR REPLACE INTO pesos_aprendidos
            (clave, peso, muestras, updated_at) VALUES (?,?,?,?)''',
            (clave_final, round(peso, 3), data["muestras"], int(time.time()))
        )
        guardadas += 1

    for clave, reaches in tp_reach.items():
        # reaches = [(tp_alcanzado, peso_recencia), ...]
        if len(reaches) < min_tp:
            continue
        peso_total = sum(w for _, w in reaches)
        if peso_total <= 0:
            continue
        avg_reach = sum(tp * w for tp, w in reaches) / peso_total  # ponderado
        mult = 1.0 + (avg_reach - 1.5) * 0.15
        mult = round(max(0.75, min(1.30, mult)), 3)
        clave_final = f"{prefijo}tp_mult_{clave}"
        conn.execute('''INSERT OR REPLACE INTO pesos_aprendidos
            (clave, peso, muestras, updated_at) VALUES (?,?,?,?)''',
            (clave_final, mult, len(reaches), int(time.time()))
        )
        guardadas += 1
    return guardadas


def aprender():
    """
    Analiza señales pasadas y ajusta pesos automáticamente.

    IMPORTANTE: aprende POR ACTIVO primero — un HCH_INV en BTC no se
    comporta igual que en una altcoin de bajo volumen, así que cada
    símbolo con suficientes señales propias (>=8) tiene sus propios
    pesos (clave "BTCUSDT:hch_inv", "BTCUSDT:tp_mult_volumen_alto", etc).
    Los pesos GLOBALES (sin prefijo, mezclando todos los símbolos) se
    calculan aparte y sirven solo de respaldo para símbolos nuevos que
    todavía no acumulan historial propio — get_contexto_memoria() usa
    primero el peso del símbolo si existe, y si no, cae al global.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        rows_con_symbol = conn.execute(
            "SELECT symbol, modo, patron, cs_618, bear_score, sesgo_macro, "
            "resultado, ganancia_pct, tp_alcanzado, volumen_alto, timestamp "
            "FROM senales WHERE resultado != 'PENDIENTE' "
            "ORDER BY timestamp DESC LIMIT 3000"
        ).fetchall()

        if len(rows_con_symbol) < 10:
            conn.close()
            return

        # ── 1. Pesos GLOBALES (respaldo para símbolos sin historial propio) ──
        rows_sin_symbol = [r[2:] for r in rows_con_symbol]
        cond_global, tp_global = _procesar_filas(rows_sin_symbol)
        n_global = _guardar_pesos(conn, cond_global, tp_global, prefijo="")

        # ── 2. Pesos POR SÍMBOLO + MODO (lo que de verdad importa) ──
        # Se separa también por modo (swing/scalping) porque un mismo
        # símbolo se comporta distinto en 4H que en 15M.
        por_grupo = {}
        for row in rows_con_symbol:
            symbol, modo = row[0], (row[1] or "swing")
            por_grupo.setdefault((symbol, modo), []).append(row[2:])

        n_simbolo = 0
        grupos_con_peso_propio = 0
        for (symbol, modo), filas in por_grupo.items():
            if len(filas) < 8:
                continue  # muy pocas señales propias -> se queda con el global
            cond_sym, tp_sym = _procesar_filas(filas)
            n_simbolo += _guardar_pesos(conn, cond_sym, tp_sym,
                                        prefijo=f"{symbol}:{modo}:",
                                        min_accuracy=5, min_tp=6)
            grupos_con_peso_propio += 1

        log.info(f"📈 Aprendizaje: {n_global} pesos globales (respaldo), "
                 f"{n_simbolo} pesos propios en {grupos_con_peso_propio} grupos "
                 f"símbolo+modo con historial suficiente (de {len(por_grupo)} grupos totales)")

        conn.commit()
        conn.close()

    except Exception as e:
        log.warning(f"aprender: {e}")


# ══════════════════════════════════════════════════════════
# OBTENER CONTEXTO DE MEMORIA
# ══════════════════════════════════════════════════════════
def get_contexto_memoria(symbol: str,
                          cs_618: int = 0,
                          patron: str = "NINGUNO",
                          macro_sesgo: str = "NEUTRAL",
                          bear_score: int = 50,
                          volumen_alto: bool = False,
                          modo: str = "swing") -> dict:
    """
    Retorna contexto de memoria para ajustar el dictamen:
    - Accuracy histórica del símbolo (separada por modo: swing/scalping)
    - Pesos aprendidos aplicables
    - Señales recientes
    - Ajuste de confianza sugerido
    - Multiplicador de TP sugerido (tp_mult) — >1 = ampliar TPs porque
      históricamente el precio suele correr más lejos en esta condición;
      <1 = achicarlos porque suele quedarse corto / revertir antes.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        clave_stats = f"{symbol}:{modo}"

        # Stats del símbolo+modo
        stats = conn.execute(
            "SELECT accuracy, ganancia_avg, mejor_patron, total, "
            "tp1_rate, tp2_rate, tp3_rate, sl_rate "
            "FROM stats_simbolo WHERE symbol=?",
            (clave_stats,)
        ).fetchone()

        # Señales recientes (últimas 5) de este símbolo+modo
        recientes = conn.execute(
            "SELECT direccion, resultado, ganancia_pct, timestamp, "
            "tp1_hit, tp2_hit, tp3_hit, sl_hit "
            "FROM senales WHERE symbol=? AND modo=? "
            "ORDER BY timestamp DESC LIMIT 5",
            (symbol, modo)
        ).fetchall()

        # Qué zona Fibonacci se repite más para este patrón+modo
        fib_dist = conn.execute(
            "SELECT fib_nivel, total, winrate FROM stats_fib_fractal "
            "WHERE patron=? AND modo=? ORDER BY total DESC",
            (patron, modo)
        ).fetchall()

        # Pesos aprendidos relevantes (todos: globales + por símbolo+modo)
        pesos_rows = conn.execute(
            "SELECT clave, peso FROM pesos_aprendidos"
        ).fetchall()
        pesos = {r[0]: r[1] for r in pesos_rows}

        conn.close()

        # Prioriza el peso PROPIO del símbolo+modo ("BTCUSDT:swing:hch_inv")
        # sobre el global ("hch_inv") — el global es solo respaldo mientras
        # ese símbolo+modo no acumula suficientes señales propias.
        def _peso_de(clave_base):
            propio = pesos.get(f"{symbol}:{modo}:{clave_base}")
            if propio is not None:
                return propio, True  # (valor, es_propio_del_simbolo+modo)
            return pesos.get(clave_base), False

        # Calcular ajuste de confianza
        ajuste = 0.0
        notas  = []

        # Accuracy histórica
        if stats:
            acc, gan_avg, mejor_p, total = stats[0], stats[1], stats[2], stats[3]
            if total >= 5:
                if acc >= 70:
                    ajuste += 10
                    notas.append(f"✅ {symbol} accuracy histórica: {acc:.0f}%")
                elif acc <= 40:
                    ajuste -= 10
                    notas.append(f"⚠️ {symbol} accuracy baja: {acc:.0f}%")

        # Pesos aprendidos
        p, es_propio = _peso_de("cs_618_alto")
        if cs_618 >= 7 and p is not None:
            ajuste += (p - 1.0) * 15
            if p > 1.1:
                notas.append(f"📐 CS 618 alto históricamente efectivo ({p:.2f}x"
                             f"{' — propio de ' + symbol if es_propio else ' — global'})")

        p, _ = _peso_de("macro_risk_on")
        if macro_sesgo == "RISK_ON" and p is not None:
            ajuste += (p - 1.0) * 10
            if p > 1.1:
                notas.append(f"💵 RISK_ON históricamente favorable para señales ({p:.2f}x)")

        p, _ = _peso_de("macro_risk_off")
        if macro_sesgo == "RISK_OFF" and p is not None:
            ajuste += (p - 1.0) * 10
            if p > 1.1:
                notas.append(f"💵 RISK_OFF históricamente favorable para señales de este tipo ({p:.2f}x)")
            elif p < 0.9:
                notas.append(f"⚠️ RISK_OFF ha salido flojo históricamente ({p:.2f}x) — cautela extra")

        p, es_propio = _peso_de(patron.lower()) if patron else (None, False)
        if patron.upper() in ("HCH_INV","DOBLE_SUELO") and p is not None:
            ajuste += (p - 1.0) * 12
            notas.append(f"🔺 Patrón {patron} tiene {p:.2f}x efectividad histórica"
                         f"{' (propio de ' + symbol + ')' if es_propio else ' (global, aún sin suficiente historial propio)'}")

        # Señales recientes del símbolo
        if recientes:
            ultimas_sl = sum(1 for r in recientes if r[1] == "SL")
            if ultimas_sl >= 2:
                ajuste -= 15
                notas.append(f"⚠️ {ultimas_sl} SLs recientes en {symbol} — precaución")

        # ── Multiplicador de TP (patrón + volumen) — propio del símbolo
        # primero, global como respaldo ──────────────────────
        mults = []
        p, es_propio = _peso_de(f"tp_mult_{(patron or 'ninguno').lower()}")
        if p is not None:
            mults.append(p)
            notas.append(f"🎯 {patron}: TPs {'ampliados' if p>1.03 else 'reducidos' if p<0.97 else 'sin cambio'} "
                         f"por historial ({p:.2f}x{' propio' if es_propio else ' global'})")

        clave_vol = "tp_mult_volumen_alto" if volumen_alto else "tp_mult_volumen_bajo"
        p, es_propio = _peso_de(clave_vol)
        if p is not None:
            mults.append(p)
            if volumen_alto:
                notas.append(f"📊 Volumen alto en la entrada — históricamente "
                             f"{'corre más lejos' if p>1.03 else 'sin diferencia clara'} "
                             f"({p:.2f}x{' propio' if es_propio else ' global'})")

        tp_mult = round(sum(mults) / len(mults), 3) if mults else 1.0
        tp_mult = max(0.7, min(1.35, tp_mult))  # límite de seguridad final

        # ── Qué zona Fibonacci se repite más para este patrón+modo ──
        if fib_dist:
            top = fib_dist[0]  # (fib_nivel, total, winrate)
            total_muestras = sum(r[1] for r in fib_dist)
            frecuencia_pct = top[1] / total_muestras * 100
            notas.append(
                f"📐 {patron} en {modo}: retrocede más seguido a {top[0]} "
                f"({top[1]}/{total_muestras} = {frecuencia_pct:.0f}% de las veces, "
                f"{top[2]:.0f}% winrate en ese nivel)"
            )

        return {
            "ajuste_confianza": round(ajuste, 1),
            "tp_mult":          tp_mult,
            "notas":            notas,
            "fib_distribucion": [
                {"nivel": r[0], "veces": r[1], "winrate": r[2]} for r in fib_dist
            ],
            "stats":            {
                "accuracy":     stats[0] if stats else 0,
                "ganancia_avg": stats[1] if stats else 0,
                "total":        stats[3] if stats else 0,
                "tp1_rate":     stats[4] if stats else 0,
                "tp2_rate":     stats[5] if stats else 0,
                "tp3_rate":     stats[6] if stats else 0,
                "sl_rate":      stats[7] if stats else 0,
            } if stats else {},
            "recientes": [
                {"dir": r[0], "resultado": r[1],
                 "ganancia": r[2], "hace_h": round((time.time()-r[3])/3600, 0),
                 "modo": modo,
                 "tp1_hit": bool(r[4]), "tp2_hit": bool(r[5]),
                 "tp3_hit": bool(r[6]), "sl_hit": bool(r[7])}
                for r in recientes
            ],
        }

    except Exception as e:
        log.warning(f"get_contexto_memoria {symbol}: {e}")
        return {"ajuste_confianza": 0, "tp_mult": 1.0, "notas": [], "fib_distribucion": [], "stats": {}, "recientes": []}


# ══════════════════════════════════════════════════════════
# HISTORIAL PARA UI
# ══════════════════════════════════════════════════════════
def get_historial(symbol: str = None, limit: int = 20) -> list:
    """Retorna historial de señales para mostrar en UI."""
    try:
        conn = sqlite3.connect(DB_PATH)
        if symbol:
            rows = conn.execute(
                "SELECT symbol, timestamp, direccion, confianza, "
                "entrada, resultado, ganancia_pct, tp_alcanzado "
                "FROM senales WHERE symbol=? "
                "ORDER BY timestamp DESC LIMIT ?",
                (symbol, limit)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT symbol, timestamp, direccion, confianza, "
                "entrada, resultado, ganancia_pct, tp_alcanzado "
                "FROM senales ORDER BY timestamp DESC LIMIT ?",
                (limit,)
            ).fetchall()
        conn.close()

        return [{
            "symbol":     r[0],
            "timestamp":  r[1],
            "direccion":  r[2],
            "confianza":  r[3],
            "entrada":    r[4],
            "resultado":  r[5],
            "ganancia":   r[6],
            "tp":         r[7],
        } for r in rows]

    except Exception as e:
        log.warning(f"get_historial: {e}")
        return []


def get_leaderboard() -> list:
    """Top símbolos por accuracy."""
    try:
        conn = sqlite3.connect(DB_PATH)
        rows = conn.execute(
            "SELECT symbol, accuracy, ganancia_avg, total, mejor_patron, "
            "tp1_rate, tp2_rate, tp3_rate, sl_rate "
            "FROM stats_simbolo WHERE total >= 3 "
            "ORDER BY accuracy DESC LIMIT 10"
        ).fetchall()
        conn.close()
        return [{
            "symbol":   r[0],
            "accuracy": r[1],
            "ganancia": r[2],
            "total":    r[3],
            "patron":   r[4],
            "tp1_rate": r[5],
            "tp2_rate": r[6],
            "tp3_rate": r[7],
            "sl_rate":  r[8],
        } for r in rows]
    except:
        return []
