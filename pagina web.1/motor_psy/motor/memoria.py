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
import sqlite3
import json
import time
import logging
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from typing import Optional

log = logging.getLogger(__name__)

DB_PATH = "/tmp/psy_motor.db"


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
        updated_at  INTEGER DEFAULT 0
    )''')

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
def guardar_senal(symbol: str, dictamen, nucleo,
                  macro_sesgo: str = "NEUTRAL") -> int:
    """Guarda una señal nueva en la memoria."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.execute('''INSERT INTO senales
            (symbol, timestamp, direccion, confianza,
             entrada, sl, tp1, tp2, tp3,
             patron, zona, cs_618, bear_score, sesgo_macro)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)''', (
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
        ))
        senal_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.commit()
        conn.close()
        log.info(f"✅ Señal guardada #{senal_id} {symbol} {dictamen.direccion}")
        return senal_id
    except Exception as e:
        log.warning(f"guardar_senal {symbol}: {e}")
        return 0


# ══════════════════════════════════════════════════════════
# VERIFICAR RESULTADOS
# ══════════════════════════════════════════════════════════
def verificar_resultados(precio_actual: dict):
    """
    Verifica señales pendientes contra precios actuales.
    precio_actual = {"BTCUSDT": 65000, "ETHUSDT": 3200, ...}
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        pendientes = conn.execute(
            "SELECT id, symbol, direccion, entrada, sl, tp1, tp2, tp3, timestamp "
            "FROM senales WHERE resultado = 'PENDIENTE' "
            "ORDER BY timestamp DESC LIMIT 100"
        ).fetchall()

        ahora = int(time.time())

        for row in pendientes:
            sid, sym, dir_, entrada, sl, tp1, tp2, tp3, ts = row
            precio = precio_actual.get(sym, 0)
            if precio <= 0:
                continue

            horas = (ahora - ts) / 3600
            resultado = None
            tp_alc = 0
            ganancia = 0.0

            if dir_ == "ALCISTA":
                if precio >= tp3 > 0:
                    resultado = "TP3"; tp_alc = 3
                    ganancia = (tp3 - entrada) / entrada * 100
                elif precio >= tp2 > 0:
                    resultado = "TP2"; tp_alc = 2
                    ganancia = (tp2 - entrada) / entrada * 100
                elif precio >= tp1 > 0:
                    resultado = "TP1"; tp_alc = 1
                    ganancia = (tp1 - entrada) / entrada * 100
                elif precio <= sl > 0:
                    resultado = "SL"; tp_alc = 0
                    ganancia = (sl - entrada) / entrada * 100
                elif horas > 72:
                    resultado = "EXPIRADA"; tp_alc = 0
                    ganancia = (precio - entrada) / entrada * 100

            elif dir_ == "BAJISTA":
                if precio <= tp3 > 0:
                    resultado = "TP3"; tp_alc = 3
                    ganancia = (entrada - tp3) / entrada * 100
                elif precio <= tp2 > 0:
                    resultado = "TP2"; tp_alc = 2
                    ganancia = (entrada - tp2) / entrada * 100
                elif precio <= tp1 > 0:
                    resultado = "TP1"; tp_alc = 1
                    ganancia = (entrada - tp1) / entrada * 100
                elif precio >= sl > 0:
                    resultado = "SL"; tp_alc = 0
                    ganancia = (entrada - sl) / entrada * 100
                elif horas > 72:
                    resultado = "EXPIRADA"; tp_alc = 0
                    ganancia = (entrada - precio) / entrada * 100

            if resultado:
                conn.execute(
                    "UPDATE senales SET resultado=?, tp_alcanzado=?, "
                    "precio_cierre=?, ganancia_pct=?, tiempo_horas=? "
                    "WHERE id=?",
                    (resultado, tp_alc, precio,
                     round(ganancia, 2), round(horas, 1), sid)
                )
                log.info(f"📊 Señal #{sid} {sym}: {resultado} "
                         f"({ganancia:+.2f}% en {horas:.0f}h)")

        conn.commit()

        # Actualizar stats
        _actualizar_stats(conn)
        conn.close()

    except Exception as e:
        log.warning(f"verificar_resultados: {e}")


def _actualizar_stats(conn):
    """Actualiza stats por símbolo."""
    simbolos = conn.execute(
        "SELECT DISTINCT symbol FROM senales WHERE resultado != 'PENDIENTE'"
    ).fetchall()

    for (sym,) in simbolos:
        rows = conn.execute(
            "SELECT resultado, ganancia_pct, patron, cs_618 "
            "FROM senales WHERE symbol=? AND resultado != 'PENDIENTE'",
            (sym,)
        ).fetchall()

        total     = len(rows)
        ganadoras = sum(1 for r in rows if r[0] in ("TP1","TP2","TP3"))
        perdedoras= sum(1 for r in rows if r[0] == "SL")
        accuracy  = ganadoras / max(total, 1) * 100
        ganancias = [r[1] for r in rows if r[1] != 0]
        gan_avg   = sum(ganancias) / max(len(ganancias), 1)

        # Mejor patrón por accuracy
        patrones = {}
        for r in rows:
            p = r[2] or "NINGUNO"
            if p not in patrones:
                patrones[p] = {"total": 0, "gan": 0}
            patrones[p]["total"] += 1
            if r[0] in ("TP1","TP2","TP3"):
                patrones[p]["gan"] += 1

        mejor_patron = max(patrones.items(),
                          key=lambda x: x[1]["gan"]/max(x[1]["total"],1),
                          default=("NINGUNO", {}))[0]

        mejor_cs = max((r[3] for r in rows if r[0] in ("TP1","TP2","TP3")),
                       default=0)

        conn.execute('''INSERT OR REPLACE INTO stats_simbolo
            (symbol, total, ganadoras, perdedoras, accuracy,
             ganancia_avg, mejor_patron, mejor_cs, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?)''',
            (sym, total, ganadoras, perdedoras,
             round(accuracy,1), round(gan_avg,2),
             mejor_patron, mejor_cs, int(time.time()))
        )


# ══════════════════════════════════════════════════════════
# APRENDIZAJE — AJUSTAR PESOS
# ══════════════════════════════════════════════════════════
def aprender():
    """
    Analiza señales pasadas y ajusta pesos automáticamente.
    Claves de peso: "cs_618_alto", "hch_inv", "macro_risk_on", etc.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        rows = conn.execute(
            "SELECT patron, cs_618, bear_score, sesgo_macro, "
            "resultado, ganancia_pct "
            "FROM senales WHERE resultado != 'PENDIENTE' "
            "ORDER BY timestamp DESC LIMIT 500"
        ).fetchall()

        if len(rows) < 10:
            conn.close()
            return

        # Calcular accuracy por condición
        condiciones = {
            "cs_618_alto":    {"total": 0, "gan": 0},  # cs_618 >= 7
            "cs_618_bajo":    {"total": 0, "gan": 0},  # cs_618 < 4
            "macro_risk_on":  {"total": 0, "gan": 0},
            "macro_risk_off": {"total": 0, "gan": 0},
            "hch_inv":        {"total": 0, "gan": 0},
            "hch":            {"total": 0, "gan": 0},
            "doble_suelo":    {"total": 0, "gan": 0},
            "bear_alto":      {"total": 0, "gan": 0},  # bear > 65
            "bear_bajo":      {"total": 0, "gan": 0},  # bear < 40
        }

        for patron, cs618, bear, macro, resultado, ganancia in rows:
            ganadora = resultado in ("TP1","TP2","TP3")

            if cs618 and cs618 >= 7:
                condiciones["cs_618_alto"]["total"] += 1
                if ganadora: condiciones["cs_618_alto"]["gan"] += 1
            elif cs618 and cs618 < 4:
                condiciones["cs_618_bajo"]["total"] += 1
                if ganadora: condiciones["cs_618_bajo"]["gan"] += 1

            if macro == "RISK_ON":
                condiciones["macro_risk_on"]["total"] += 1
                if ganadora: condiciones["macro_risk_on"]["gan"] += 1
            elif macro == "RISK_OFF":
                condiciones["macro_risk_off"]["total"] += 1
                if ganadora: condiciones["macro_risk_off"]["gan"] += 1

            if patron:
                clave = patron.lower()
                if clave in condiciones:
                    condiciones[clave]["total"] += 1
                    if ganadora: condiciones[clave]["gan"] += 1

            if bear and bear >= 65:
                condiciones["bear_alto"]["total"] += 1
                if ganadora: condiciones["bear_alto"]["gan"] += 1
            elif bear and bear < 40:
                condiciones["bear_bajo"]["total"] += 1
                if ganadora: condiciones["bear_bajo"]["gan"] += 1

        # Guardar pesos
        for clave, data in condiciones.items():
            if data["total"] < 5:
                continue
            accuracy = data["gan"] / data["total"]
            # Peso = accuracy normalizada (0.5 = neutral, 1.5 = muy bueno)
            peso = 0.5 + accuracy
            conn.execute('''INSERT OR REPLACE INTO pesos_aprendidos
                (clave, peso, muestras, updated_at) VALUES (?,?,?,?)''',
                (clave, round(peso, 3), data["total"], int(time.time()))
            )
            log.info(f"📈 Peso aprendido: {clave} = {peso:.3f} "
                     f"({data['gan']}/{data['total']} = {accuracy:.0%})")

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
                          bear_score: int = 50) -> dict:
    """
    Retorna contexto de memoria para ajustar el dictamen:
    - Accuracy histórica del símbolo
    - Pesos aprendidos aplicables
    - Señales recientes
    - Ajuste de confianza sugerido
    """
    try:
        conn = sqlite3.connect(DB_PATH)

        # Stats del símbolo
        stats = conn.execute(
            "SELECT accuracy, ganancia_avg, mejor_patron, total "
            "FROM stats_simbolo WHERE symbol=?",
            (symbol,)
        ).fetchone()

        # Señales recientes (últimas 5)
        recientes = conn.execute(
            "SELECT direccion, resultado, ganancia_pct, timestamp "
            "FROM senales WHERE symbol=? "
            "ORDER BY timestamp DESC LIMIT 5",
            (symbol,)
        ).fetchall()

        # Pesos aprendidos relevantes
        pesos_rows = conn.execute(
            "SELECT clave, peso FROM pesos_aprendidos"
        ).fetchall()
        pesos = {r[0]: r[1] for r in pesos_rows}

        conn.close()

        # Calcular ajuste de confianza
        ajuste = 0.0
        notas  = []

        # Accuracy histórica
        if stats:
            acc, gan_avg, mejor_p, total = stats
            if total >= 5:
                if acc >= 70:
                    ajuste += 10
                    notas.append(f"✅ {symbol} accuracy histórica: {acc:.0f}%")
                elif acc <= 40:
                    ajuste -= 10
                    notas.append(f"⚠️ {symbol} accuracy baja: {acc:.0f}%")

        # Pesos aprendidos
        if cs_618 >= 7 and "cs_618_alto" in pesos:
            p = pesos["cs_618_alto"]
            ajuste += (p - 1.0) * 15
            if p > 1.1:
                notas.append(f"📐 CS 618 alto históricamente efectivo ({p:.2f}x)")

        if macro_sesgo == "RISK_ON" and "macro_risk_on" in pesos:
            p = pesos["macro_risk_on"]
            ajuste += (p - 1.0) * 10

        if patron.upper() in ("HCH_INV","DOBLE_SUELO") and \
           patron.lower() in pesos:
            p = pesos[patron.lower()]
            ajuste += (p - 1.0) * 12
            notas.append(f"🔺 Patrón {patron} tiene {p:.2f}x efectividad histórica")

        # Señales recientes del símbolo
        if recientes:
            ultimas_sl = sum(1 for r in recientes if r[1] == "SL")
            if ultimas_sl >= 2:
                ajuste -= 15
                notas.append(f"⚠️ {ultimas_sl} SLs recientes en {symbol} — precaución")

        return {
            "ajuste_confianza": round(ajuste, 1),
            "notas":            notas,
            "stats":            {
                "accuracy":    stats[0] if stats else 0,
                "ganancia_avg": stats[1] if stats else 0,
                "total":       stats[3] if stats else 0,
            } if stats else {},
            "recientes": [
                {"dir": r[0], "resultado": r[1],
                 "ganancia": r[2], "hace_h": round((time.time()-r[3])/3600, 0)}
                for r in recientes
            ],
        }

    except Exception as e:
        log.warning(f"get_contexto_memoria {symbol}: {e}")
        return {"ajuste_confianza": 0, "notas": [], "stats": {}, "recientes": []}


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
            "SELECT symbol, accuracy, ganancia_avg, total, mejor_patron "
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
        } for r in rows]
    except:
        return []
