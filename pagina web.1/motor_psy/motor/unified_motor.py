"""
PSY MOTOR — UNIFIED: Todo junto en una llamada
"""
from __future__ import annotations
import asyncio
import logging
from motor.libro_datos import actualizar_libro, actualizar_macro
from motor.nucleo import analizar_nucleo
from motor.dictamen_motor import generar_dictamen, formatear_mensaje, DictamenMotor

log = logging.getLogger(__name__)


async def analizar_completo(symbol: str,
                             tfs: list = None) -> DictamenMotor:
    """
    Análisis completo de un símbolo:
    1. Actualiza el libro de datos
    2. Corre el núcleo matemático
    3. Genera el dictamen unificado
    """
    if tfs is None:
        tfs = ["15m", "1h", "4h", "1d", "1w"]

    log.info(f"🦄 Motor PSY iniciando análisis de {symbol}...")

    # PASO 1: Libro de datos
    libro = await actualizar_libro(symbol, tfs)
    ohlcv_map = libro.get("ohlcv", {})
    funding   = libro.get("funding", {})
    oi        = libro.get("oi", {})

    if not ohlcv_map:
        log.error(f"[{symbol}] Sin datos en el libro")
        return DictamenMotor(symbol=symbol)

    # PASO 2: Núcleo matemático
    nr = analizar_nucleo(symbol, ohlcv_map)

    # PASO 3: Dictamen unificado
    dm = generar_dictamen(nr, funding=funding, oi=oi)

    return dm


async def analizar_lista(symbols: list) -> dict:
    """Analiza múltiples símbolos en paralelo."""
    tasks = [analizar_completo(s) for s in symbols]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    output = {}
    for symbol, result in zip(symbols, results):
        if isinstance(result, Exception):
            log.error(f"[{symbol}] Motor error: {result}")
        else:
            output[symbol] = result

    return output
