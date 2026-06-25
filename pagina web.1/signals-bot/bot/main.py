import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage

from bot.handlers import admin, start, subscribe
from config import BOT_TOKEN
from db.database import init_db
from signals.engine import altcoin_signal_loop

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger(__name__)


async def main():
    init_db()
    log.info("✅ Base de datos inicializada.")

    bot = Bot(token=BOT_TOKEN)
    dp  = Dispatcher(storage=MemoryStorage())

    dp.include_router(start.router)
    dp.include_router(subscribe.router)
    dp.include_router(admin.router)

    log.info("🤖 Bot iniciado.")

    # Motor de señales altcoins Tier 1-4
    asyncio.create_task(altcoin_signal_loop(bot))

    await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())


if __name__ == "__main__":
    asyncio.run(main())
