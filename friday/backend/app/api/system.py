"""FRIDAY System API Routes

Provides system monitoring, health checks,
resource usage, and configuration management.
"""

from __future__ import annotations

import platform
import psutil
import time
from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.config.settings import settings
from backend.database.models import User
from backend.app.security.auth import get_current_user, get_admin_user

router = APIRouter()


class SystemInfo(BaseModel):
    app_name: str
    app_version: str
    environment: str
    python_version: str
    platform: str
    platform_version: str
    cpu_count: int
    memory_total_gb: float
    uptime_seconds: float


class ResourceUsage(BaseModel):
    cpu_percent: float
    memory_percent: float
    memory_used_gb: float
    disk_percent: float
    disk_used_gb: float
    network_bytes_sent: int
    network_bytes_recv: int
    process_count: int
    active_threads: int
    timestamp: str


class ProviderStatus(BaseModel):
    name: str
    available: bool
    model: str = ""


@router.get("/info", response_model=SystemInfo)
async def get_system_info():
    """Get system information."""
    return SystemInfo(
        app_name=settings.APP_NAME,
        app_version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        python_version=platform.python_version(),
        platform=platform.system(),
        platform_version=platform.release(),
        cpu_count=psutil.cpu_count(logical=True) or 0,
        memory_total_gb=round(psutil.virtual_memory().total / (1024 ** 3), 2),
        uptime_seconds=time.time() - psutil.boot_time(),
    )


@router.get("/resources", response_model=ResourceUsage)
async def get_resource_usage():
    """Get current resource usage metrics."""
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    net = psutil.net_io_counters()

    return ResourceUsage(
        cpu_percent=cpu_percent,
        memory_percent=memory.percent,
        memory_used_gb=round(memory.used / (1024 ** 3), 2),
        disk_percent=disk.percent,
        disk_used_gb=round(disk.used / (1024 ** 3), 2),
        network_bytes_sent=net.bytes_sent,
        network_bytes_recv=net.bytes_recv,
        process_count=len(psutil.pids()),
        active_threads=psutil.Process().num_threads(),
        timestamp=datetime.utcnow().isoformat(),
    )


@router.get("/providers", response_model=list[ProviderStatus])
async def get_providers_status():
    """Get the status of all configured AI providers."""
    providers = []

    for name, available in settings.available_providers.items():
        model = ""
        if name == "openai":
            model = settings.OPENAI_MODEL
        elif name == "anthropic":
            model = settings.ANTHROPIC_MODEL
        elif name == "gemini":
            model = settings.GEMINI_MODEL
        elif name == "ollama":
            model = settings.OLLAMA_MODEL

        providers.append(ProviderStatus(
            name=name,
            available=available,
            model=model,
        ))

    return providers


@router.get("/logs")
async def get_logs(
    lines: int = 100,
    level: str = "INFO",
    current_user: User = Depends(get_admin_user),
):
    """Get recent log entries (admin only)."""
    from pathlib import Path

    log_file = Path(settings.LOGS_DIR) / "friday.log"
    if not log_file.exists():
        return {"logs": [], "total": 0}

    try:
        with open(log_file, "r", encoding="utf-8") as f:
            all_lines = f.readlines()

        # Filter by level
        filtered = [l for l in all_lines if level.upper() in l.upper()]

        return {
            "logs": filtered[-lines:],
            "total": len(filtered),
            "file": str(log_file),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read logs: {str(e)}",
        )


@router.get("/config")
async def get_config(
    current_user: User = Depends(get_admin_user),
):
    """Get non-sensitive configuration (admin only)."""
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG,
        "host": settings.HOST,
        "port": settings.PORT,
        "database_url": settings.DATABASE_URL.replace(settings.SECRET_KEY, "***"),
        "stt_engine": settings.STT_ENGINE,
        "tts_engine": settings.TTS_ENGINE,
        "memory_backend": settings.MEMORY_BACKEND,
        "plugins_enabled": settings.PLUGINS_ENABLED,
        "vision_enabled": settings.VISION_ENABLED,
        "preferred_provider": settings.PREFERRED_PROVIDER,
        "available_providers": settings.available_providers,
    }
