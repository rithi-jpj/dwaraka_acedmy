"""FRIDAY Memory API Routes

Manages long-term memory with CRUD operations,
semantic search, and memory management.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from backend.database.base import async_session_factory
from backend.database.models import User, Memory, MemoryType
from backend.app.security.auth import get_current_user
from backend.app.services.memory_service import MemoryService

router = APIRouter()
memory_service = MemoryService()


# --- Schemas ---

class MemoryCreate(BaseModel):
    key: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1, max_length=100000)
    type: MemoryType = MemoryType.KNOWLEDGE
    summary: Optional[str] = None
    importance: float = Field(0.5, ge=0.0, le=1.0)
    metadata: Optional[dict] = None
    source: Optional[str] = None
    expires_at: Optional[str] = None


class MemoryUpdate(BaseModel):
    content: Optional[str] = None
    summary: Optional[str] = None
    importance: Optional[float] = Field(None, ge=0.0, le=1.0)
    metadata: Optional[dict] = None


class MemoryResponse(BaseModel):
    id: str
    key: str
    content: str
    type: str
    summary: Optional[str]
    importance: float
    metadata: Optional[dict]
    source: Optional[str]
    created_at: str
    updated_at: str
    accessed_at: Optional[str]

    @classmethod
    def from_orm(cls, mem: Memory) -> "MemoryResponse":
        return cls(
            id=mem.id,
            key=mem.key,
            content=mem.content,
            type=mem.type.value if hasattr(mem.type, 'value') else mem.type,
            summary=mem.summary,
            importance=mem.importance,
            metadata=mem.metadata,
            source=mem.source,
            created_at=mem.created_at.isoformat(),
            updated_at=mem.updated_at.isoformat(),
            accessed_at=mem.accessed_at.isoformat() if mem.accessed_at else None,
        )


class MemorySearchResponse(BaseModel):
    id: str
    key: str
    content: str
    type: str
    relevance_score: float = 0.0

    @classmethod
    def from_orm(cls, mem: Memory, score: float = 0.0) -> "MemorySearchResponse":
        return cls(
            id=mem.id,
            key=mem.key,
            content=mem.content[:200] + ("..." if len(mem.content) > 200 else ""),
            type=mem.type.value if hasattr(mem.type, 'value') else mem.type,
            relevance_score=score,
        )


class MemorySearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    limit: int = Field(10, ge=1, le=50)
    type: Optional[MemoryType] = None
    min_importance: float = Field(0.0, ge=0.0, le=1.0)


class MemoryStats(BaseModel):
    total: int
    by_type: dict
    oldest: Optional[str]
    newest: Optional[str]


# --- Routes ---

@router.get("", response_model=List[MemoryResponse])
async def list_memories(
    type: Optional[MemoryType] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
):
    """List all memories for the current user."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        query = select(Memory).where(Memory.user_id == current_user.id)

        if type:
            query = query.where(Memory.type == type)

        query = query.order_by(Memory.updated_at.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        memories = result.scalars().all()

        return [MemoryResponse.from_orm(m) for m in memories]


@router.post("", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
async def create_memory(
    request: MemoryCreate,
    current_user: User = Depends(get_current_user),
):
    """Store a new memory."""
    expires_at = None
    if request.expires_at:
        try:
            expires_at = datetime.fromisoformat(request.expires_at)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid expires_at format. Use ISO 8601.",
            )

    memory = await memory_service.store_memory(
        user_id=current_user.id,
        key=request.key,
        content=request.content,
        memory_type=request.type,
        summary=request.summary,
        importance=request.importance,
        metadata=request.metadata or {},
        source=request.source,
        expires_at=expires_at,
    )

    return MemoryResponse.from_orm(memory)


@router.get("/search", response_model=List[MemorySearchResponse])
async def search_memories(
    query: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    type: Optional[MemoryType] = None,
    current_user: User = Depends(get_current_user),
):
    """Semantic search across memories."""
    results = await memory_service.search_memories(
        user_id=current_user.id,
        query=query,
        limit=limit,
        memory_type=type,
    )

    return [
        MemorySearchResponse.from_orm(mem, score=score)
        for mem, score in results
    ]


@router.get("/{memory_id}", response_model=MemoryResponse)
async def get_memory(
    memory_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get a specific memory by ID."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        result = await session.execute(
            select(Memory).where(
                Memory.id == memory_id,
                Memory.user_id == current_user.id,
            )
        )
        memory = result.scalar_one_or_none()

        if not memory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found",
            )

        # Update access time
        memory.accessed_at = datetime.utcnow()
        await session.commit()

        return MemoryResponse.from_orm(memory)


@router.patch("/{memory_id}", response_model=MemoryResponse)
async def update_memory(
    memory_id: str,
    request: MemoryUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update a memory entry."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        result = await session.execute(
            select(Memory).where(
                Memory.id == memory_id,
                Memory.user_id == current_user.id,
            )
        )
        memory = result.scalar_one_or_none()

        if not memory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found",
            )

        if request.content is not None:
            memory.content = request.content
        if request.summary is not None:
            memory.summary = request.summary
        if request.importance is not None:
            memory.importance = request.importance
        if request.metadata is not None:
            memory.metadata = request.metadata

        memory.updated_at = datetime.utcnow()
        await session.commit()

        return MemoryResponse.from_orm(memory)


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(
    memory_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a memory entry."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        result = await session.execute(
            select(Memory).where(
                Memory.id == memory_id,
                Memory.user_id == current_user.id,
            )
        )
        memory = result.scalar_one_or_none()

        if not memory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found",
            )

        await session.delete(memory)
        await session.commit()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_memories(
    type: Optional[MemoryType] = None,
    current_user: User = Depends(get_current_user),
):
    """Clear all memories (optionally by type)."""
    from sqlalchemy import delete

    async with async_session_factory() as session:
        query = delete(Memory).where(Memory.user_id == current_user.id)
        if type:
            query = query.where(Memory.type == type)
        await session.execute(query)
        await session.commit()


@router.get("/stats", response_model=MemoryStats)
async def get_memory_stats(
    current_user: User = Depends(get_current_user),
):
    """Get memory statistics."""
    from sqlalchemy import select, func

    async with async_session_factory() as session:
        # Total count
        result = await session.execute(
            select(func.count(Memory.id))
            .where(Memory.user_id == current_user.id)
        )
        total = result.scalar() or 0

        # Count by type
        result = await session.execute(
            select(Memory.type, func.count(Memory.id))
            .where(Memory.user_id == current_user.id)
            .group_by(Memory.type)
        )
        by_type = {row[0].value if hasattr(row[0], 'value') else row[0]: row[1] for row in result}

        # Oldest and newest
        result = await session.execute(
            select(func.min(Memory.created_at), func.max(Memory.created_at))
            .where(Memory.user_id == current_user.id)
        )
        row = result.one()
        oldest = row[0].isoformat() if row[0] else None
        newest = row[1].isoformat() if row[1] else None

        return MemoryStats(
            total=total,
            by_type=by_type,
            oldest=oldest,
            newest=newest,
        )
