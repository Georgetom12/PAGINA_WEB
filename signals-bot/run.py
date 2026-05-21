"""
Punto de entrada para Railway.
Corre el bot de Telegram Y el panel web simultáneamente.
"""
import asyncio
import logging
import threading

import uvicorn

from bot.main import main as run_bot
from config import WEB_PORT
from db.database import init_db

log = logging.getLogger(__name__)


def start_web():
    uvicorn.run(
        "web.main:app",
        host="0.0.0.0",
        port=WEB_PORT,
        log_level="warning",
    )


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    init_db()

    # Panel web en hilo separado
    web_thread = threading.Thread(target=start_web, daemon=True)
    web_thread.start()
    log.info(f"🌐 Panel web corriendo en puerto {WEB_PORT}")

    # Bot en el loop principal
    asyncio.run(run_bot())
