"""FRIDAY Plugins API Routes

Manages plugin installation, configuration,
activation, and hot-loading.
"""

from __future__ import annotations

from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel, Field

from backend.database.base import async_session_factory
from backend.database.models import User, Plugin, PluginStatus
from backend.app.security.auth import get_current_user, get_admin_user

router = APIRouter()


class PluginResponse(BaseModel):
    id: str
    name: str
    version: str
    description: Optional[str]
    author: Optional[str]
    plugin_type: str
    status: str
    config: Optional[dict]
    permissions: list
    is_sandboxed: bool
    created_at: str

    @classmethod
    def from_orm(cls, plugin: Plugin) -> "PluginResponse":
        return cls(
            id=plugin.id,
            name=plugin.name,
            version=plugin.version,
            description=plugin.description,
            author=plugin.author,
            plugin_type=plugin.plugin_type,
            status=plugin.status.value if hasattr(plugin.status, 'value') else plugin.status,
            config=plugin.config,
            permissions=plugin.permissions or [],
            is_sandboxed=plugin.is_sandboxed,
            created_at=plugin.created_at.isoformat(),
        )


class PluginConfigUpdate(BaseModel):
    config: dict
    permissions: Optional[list] = None


@router.get("", response_model=List[PluginResponse])
async def list_plugins(
    status_filter: Optional[PluginStatus] = None,
    plugin_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """List all installed plugins."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        query = select(Plugin)
        if status_filter:
            query = query.where(Plugin.status == status_filter)
        if plugin_type:
            query = query.where(Plugin.plugin_type == plugin_type)
        query = query.order_by(Plugin.name)

        result = await session.execute(query)
        plugins = result.scalars().all()
        return [PluginResponse.from_orm(p) for p in plugins]


@router.get("/{plugin_id}", response_model=PluginResponse)
async def get_plugin(plugin_id: str, current_user: User = Depends(get_current_user)):
    """Get plugin details."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        result = await session.execute(select(Plugin).where(Plugin.id == plugin_id))
        plugin = result.scalar_one_or_none()
        if not plugin:
            raise HTTPException(status_code=404, detail="Plugin not found")
        return PluginResponse.from_orm(plugin)


@router.patch("/{plugin_id}/config", response_model=PluginResponse)
async def update_plugin_config(
    plugin_id: str,
    request: PluginConfigUpdate,
    current_user: User = Depends(get_admin_user),
):
    """Update plugin configuration (admin only)."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        result = await session.execute(select(Plugin).where(Plugin.id == plugin_id))
        plugin = result.scalar_one_or_none()
        if not plugin:
            raise HTTPException(status_code=404, detail="Plugin not found")

        plugin.config = request.config
        if request.permissions is not None:
            plugin.permissions = request.permissions
        plugin.updated_at = datetime.utcnow()
        await session.commit()
        return PluginResponse.from_orm(plugin)


@router.post("/{plugin_id}/enable", response_model=PluginResponse)
async def enable_plugin(
    plugin_id: str,
    current_user: User = Depends(get_admin_user),
):
    """Enable a plugin (admin only)."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        result = await session.execute(select(Plugin).where(Plugin.id == plugin_id))
        plugin = result.scalar_one_or_none()
        if not plugin:
            raise HTTPException(status_code=404, detail="Plugin not found")

        plugin.status = PluginStatus.ENABLED
        plugin.updated_at = datetime.utcnow()
        await session.commit()
        return PluginResponse.from_orm(plugin)


@router.post("/{plugin_id}/disable", response_model=PluginResponse)
async def disable_plugin(
    plugin_id: str,
    current_user: User = Depends(get_admin_user),
):
    """Disable a plugin (admin only)."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        result = await session.execute(select(Plugin).where(Plugin.id == plugin_id))
        plugin = result.scalar_one_or_none()
        if not plugin:
            raise HTTPException(status_code=404, detail="Plugin not found")

        plugin.status = PluginStatus.DISABLED
        plugin.updated_at = datetime.utcnow()
        await session.commit()
        return PluginResponse.from_orm(plugin)


@router.delete("/{plugin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def uninstall_plugin(
    plugin_id: str,
    current_user: User = Depends(get_admin_user),
):
    """Uninstall a plugin (admin only)."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        result = await session.execute(select(Plugin).where(Plugin.id == plugin_id))
        plugin = result.scalar_one_or_none()
        if not plugin:
            raise HTTPException(status_code=404, detail="Plugin not found")
        await session.delete(plugin)
        await session.commit()
