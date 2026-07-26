"""FRIDAY API Routes - Router Aggregation"""

from fastapi import APIRouter

from . import chat, memory, tasks, agents, voice, vision, files, system, plugins, auth

router = APIRouter()

# Include sub-routers
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(chat.router, prefix="/chat", tags=["Conversation"])
router.include_router(memory.router, prefix="/memory", tags=["Memory"])
router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
router.include_router(agents.router, prefix="/agents", tags=["Agents"])
router.include_router(voice.router, prefix="/voice", tags=["Voice"])
router.include_router(vision.router, prefix="/vision", tags=["Vision"])
router.include_router(files.router, prefix="/files", tags=["Files"])
router.include_router(system.router, prefix="/system", tags=["System"])
router.include_router(plugins.router, prefix="/plugins", tags=["Plugins"])
