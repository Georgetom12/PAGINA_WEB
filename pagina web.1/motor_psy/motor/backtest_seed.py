"""
motor/backtest_seed.py
──────────────────────
Backtest ligero para "sembrar" el sistema de memoria/aprendizaje con
señales históricas simuladas, en vez de arrancar en cero cada vez que
el motor se reinicia.

CÓMO FUNCIONA
  Para cada símbolo+modo, recorre las velas del timeframe base (4H para
  swing, 15M para scalping) con un paso fijo (no vela por vela, para que
  sea rápido). En cada punto, corta el DataFrame ahí ("como si el motor
  estuviera viendo solo hasta ese momento"), corre el análisis normal
  (analizar_nucleo + generar_dictamen), y si da una señal con confianza
  razonable, mira hacia ADELANTE en esas mismas velas para ver qué tocó
  primero: TP1, TP2, TP3 o el SL. Eso se guarda como señal ya resuelta
  (no PENDIENTE) con origen="backtest".

LIMITACIONES HONESTAS (para no vender esto como más de lo que es):
  - Solo el timeframe BASE respeta el corte punto-en-el-tiempo real. Los
    demás timeframes (macro, cascadas RSI/CVD/POC de otros TFs) se usan
    completos tal cual llegaron — hay un leve sesgo de "mirar hacia
    adelante" en esos indicadores secundarios.
  - Sin comisiones ni slippage — los resultados son algo optimistas.
  - Limitado a las ~300 velas que el motor ya trae por timeframo, así que
    la muestra por símbolo no es enorme (especialmente en TFs altos).
  - Es un punto de partida razonable para no arrancar en cero, NO un
    reemplazo de datos reales en vivo — con el tiempo, las señales "live"
    van pesando cada vez más frente a estas semillas.
  - Es idempotente: correrlo de nuevo en cada restart borra las semillas
    viejas de ese símbolo+modo antes de sembrar las nuevas, para que no
    se dupliquen indefinidamente en cada deploy.
"""
import logging
import sqlite3
import time

from motor.nucleo import analizar_nucleo
from motor.dictamen_motor import generar_dictamen
from motor.memoria import guardar_senal, DB_PATH

log = logging.getLogger(__name__)

PASO_VELAS    = 15   # probar una señal cada N velas (no todas, por eficiencia)
LOOKAHEAD     = 60   # máximo de velas hacia adelante para ver si tocó TP/SL
MIN_VELAS     = 60   # mínimo de velas necesarias antes de poder empezar a analizar
CONFIANZA_MIN = 60   # solo sembrar señales con confianza razonable
MAX_SEMILLAS_POR_GRUPO = 25  # tope por símbolo+modo, para no inflar la BD


def _resolver_resultado(df_base, idx_inicio, direccion, tp1, tp2, tp3, sl):
    """Recorre hacia adelante en el mismo DataFrame para ver qué tocó primero.
    Devuelve también el índice donde se resolvió (o el final de la ventana
    si quedó inconcluso), para poder saltar ahí y no muestrear el mismo
    tramo de mercado dos veces."""
    fin = min(len(df_base), idx_inicio + LOOKAHEAD)
    tp1_hit = tp2_hit = tp3_hit = sl_hit = False
    idx_resolucion = fin
    for i in range(idx_inicio, fin):
        high = float(df_base["high"].iloc[i])
        low  = float(df_base["low"].iloc[i])
        if direccion == "ALCISTA":
            if tp1 and high >= tp1: tp1_hit = True
            if tp2 and high >= tp2: tp2_hit = True
            if tp3 and high >= tp3: tp3_hit = True
            if sl  and low  <= sl:  sl_hit  = True
        else:
            if tp1 and low  <= tp1: tp1_hit = True
            if tp2 and low  <= tp2: tp2_hit = True
            if tp3 and low  <= tp3: tp3_hit = True
            if sl  and high >= sl:  sl_hit  = True
        if tp3_hit or sl_hit:
            idx_resolucion = i
            break
    return tp1_hit, tp2_hit, tp3_hit, sl_hit, idx_resolucion


def backtest_symbol(symbol: str, ohlcv_map: dict, modo: str = "swing") -> int:
    """
    Corre el backtest de un símbolo+modo. Devuelve cuántas señales sembró.
    Es SÍNCRONO (no hace fetch de red, solo trabaja sobre velas ya en
    memoria) para poder llamarlo en un loop simple sin complicar el async.
    """
    tf_base = "4h" if modo == "swing" else "15m"
    df_full = ohlcv_map.get(tf_base)
    if df_full is None or len(df_full) < MIN_VELAS + 20:
        return 0

    # Idempotente: borra semillas viejas de este símbolo+modo antes de
    # sembrar de nuevo, para que restarts sucesivos no dupliquen infinito
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM senales WHERE symbol=? AND modo=? AND origen='backtest'",
                 (symbol, modo))
    conn.commit()
    conn.close()

    sembradas = 0
    idx = MIN_VELAS
    limite = len(df_full) - LOOKAHEAD
    while idx < limite:
        if sembradas >= MAX_SEMILLAS_POR_GRUPO:
            break

        # Solo el TF base respeta el corte punto-en-el-tiempo real
        df_hist = df_full.iloc[:idx + 1].reset_index(drop=True)
        ohlcv_recorte = dict(ohlcv_map)
        ohlcv_recorte[tf_base] = df_hist

        try:
            nr = analizar_nucleo(symbol, ohlcv_recorte, modo=modo)
            dm = generar_dictamen(nr)
        except Exception:
            idx += PASO_VELAS
            continue

        if dm.direccion not in ("ALCISTA", "BAJISTA") or dm.confianza < CONFIANZA_MIN:
            idx += PASO_VELAS
            continue
        if not dm.zona_entrada or not dm.sl:
            idx += PASO_VELAS
            continue

        tp1_hit, tp2_hit, tp3_hit, sl_hit, idx_resolucion = _resolver_resultado(
            df_full, idx + 1, dm.direccion,
            dm.tp1_corto, dm.tp2_corto, dm.tp3_corto, dm.sl
        )
        if not (tp1_hit or tp2_hit or tp3_hit or sl_hit):
            idx += PASO_VELAS
            continue  # inconcluso dentro de la ventana -> no sirve de muestra

        try:
            sid = guardar_senal(symbol, dm, nr, "NEUTRAL", modo=modo, origen="backtest")

            tp_alc = 3 if tp3_hit else 2 if tp2_hit else 1 if tp1_hit else 0
            if tp3_hit:
                resultado = "TP3"
            elif sl_hit:
                resultado = f"TP{tp_alc}_SL" if tp_alc > 0 else "SL"
            else:
                resultado = f"TP{tp_alc}"

            # OJO: antes se usaba el CIERRE de la vela de resolución para
            # calcular la ganancia — eso podía dar un % positivo en una
            # señal marcada "SL" si esa vela tuvo una mecha larga que tocó
            # el stop pero cerró de vuelta a favor. Ahora se usa el nivel
            # REALMENTE tocado, con la MISMA prioridad que usa
            # verificar_resultados en vivo:
            #   - TP3 -> ganancia al nivel de TP3
            #   - TPx_SL (llegó a un TP y luego revirtió) -> ganancia al
            #     nivel de ESE TP (se asume que ahí se habría cerrado la
            #     posición, no que se dejó correr hasta perder todo)
            #   - SL puro (nunca tocó ningún TP) -> ganancia al nivel del SL
            entrada = dm.zona_entrada
            if tp3_hit:
                precio_cierre = dm.tp3_corto
            elif sl_hit:
                if tp_alc > 0:
                    precio_cierre = {1: dm.tp1_corto, 2: dm.tp2_corto}[tp_alc]
                else:
                    precio_cierre = dm.sl
            elif tp2_hit:
                precio_cierre = dm.tp2_corto
            elif tp1_hit:
                precio_cierre = dm.tp1_corto
            else:
                precio_cierre = entrada

            ganancia = ((precio_cierre - entrada) / entrada * 100) if dm.direccion == "ALCISTA" \
                       else ((entrada - precio_cierre) / entrada * 100)

            conn = sqlite3.connect(DB_PATH)
            conn.execute(
                "UPDATE senales SET resultado=?, tp_alcanzado=?, "
                "tp1_hit=?, tp2_hit=?, tp3_hit=?, sl_hit=?, "
                "ganancia_pct=?, precio_cierre=? WHERE id=?",
                (resultado, tp_alc, int(tp1_hit), int(tp2_hit), int(tp3_hit), int(sl_hit),
                 round(ganancia, 2), precio_cierre, sid)
            )
            conn.commit()
            conn.close()
            sembradas += 1
        except Exception as e:
            log.debug(f"backtest_symbol {symbol}/{modo} idx={idx}: {e}")

        # Saltar más allá de donde se resolvió esta señal (no un paso fijo)
        # -> evita que 2+ "señales" midan en realidad el mismo movimiento
        # de precio y se cuenten como si fueran aciertos independientes
        idx = max(idx + PASO_VELAS, idx_resolucion + 1)

    if sembradas:
        log.info(f"🌱 Backtest {symbol} [{modo}]: {sembradas} señales sembradas")
    return sembradas


async def backtest_startup(symbols: list, ohlcv_por_symbol: dict, max_symbols: int = 25):
    """
    Corre el backtest para una lista LIMITADA de símbolos (no los ~300
    disponibles — sería demasiado al arrancar). Se pensó para llamarse una
    vez al inicio del motor, usando velas que ya se trajeron de todas
    formas para el top-symbols.

    ohlcv_por_symbol = {"BTCUSDT": {"5m": df, "15m": df, ...}, ...}
    """
    inicio = time.time()
    total_sembradas = 0
    procesados = 0

    for symbol in symbols[:max_symbols]:
        ohlcv_map = ohlcv_por_symbol.get(symbol)
        if not ohlcv_map:
            continue
        try:
            total_sembradas += backtest_symbol(symbol, ohlcv_map, modo="swing")
            total_sembradas += backtest_symbol(symbol, ohlcv_map, modo="scalping")
            procesados += 1
        except Exception as e:
            log.warning(f"backtest_startup {symbol}: {e}")

    dur = time.time() - inicio
    log.info(f"🌱 Backtest de arranque completo: {total_sembradas} señales sembradas "
             f"en {procesados} símbolos ({dur:.1f}s)")
    return total_sembradas
