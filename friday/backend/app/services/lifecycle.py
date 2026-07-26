"""FRIDAY Lifecycle Service

Manages application startup and shutdown procedures,
background tasks, and service initialization.
"""

from __future__ import annotations

from loguru import logger

from backend.config.settings import settings


async def start_services() -> None:
    """Initialize all background services on application startup."""
    logger.info("Starting FRIDAY services...")

    # Initialize AI providers
    from backend.app.services.chat_engine import ChatEngine
    engine = ChatEngine()
    await engine._get_provider()
    logger.info("✅ AI chat engine initialized")

    # Start cleanup scheduler for expired memories
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from backend.app.services.memory_service import MemoryService

        scheduler = AsyncIOScheduler()
        memory_service = MemoryService()
        scheduler.add_job(
            memory_service.cleanup_expired,
            trigger="interval",
            hours=24,
            id="memory_cleanup",
            name="Clean up expired memories",
        )
        scheduler.start()
        logger.info("✅ Scheduler started")
    except Exception as e:
        logger.warning(f"Scheduler init warning (non-critical): {e}")

    logger.info("🚀 All FRIDAY services started successfully")


async def stop_services() -> None:
    """Gracefully shut down all services on application shutdown."""
    logger.info("Shutting down FRIDAY services...")

    # Shutdown scheduler
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        scheduler = AsyncIOScheduler()
        scheduler.shutdown(wait=False)
    except Exception:
        pass

    logger.info("✅ All FRIDAY services stopped")
