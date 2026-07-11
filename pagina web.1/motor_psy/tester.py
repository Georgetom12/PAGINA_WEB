"""
PSY MOTOR — Tester
Corre el motor sobre BTC/ETH/SOL y muestra el dictamen.
"""
import asyncio
import logging
from motor.libro_datos import init_db
from motor.unified_motor import analizar_completo, formatear_mensaje

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

async def main():
    init_db()

    symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"]

    for symbol in symbols:
        print(f"\n{'='*50}")
        print(f"Analizando {symbol}...")
        print('='*50)

        dm = await analizar_completo(symbol)
        msg = formatear_mensaje(dm)

        # Versión texto plano para consola
        msg_clean = msg.replace("*","").replace("`","").replace("_","")
        print(msg_clean)
        print()

        await asyncio.sleep(3)

if __name__ == "__main__":
    asyncio.run(main())
