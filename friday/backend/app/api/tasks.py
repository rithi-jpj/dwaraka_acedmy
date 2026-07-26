"""FRIDAY Tasks API Routes

Manages scheduled tasks, automation workflows,
reminders, and background jobs.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from backend.database.base import async_session_factory
from backend.database.models import User, Task, TaskStatus
from backend.app.security.auth import get_current_user

router = APIRouter()


class TaskResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    task_type: str
    status: str
    priority: int
    progress: float
    error: Optional[str]
    scheduled_at: Optional[str]
    started_at: Optional[str]
    completed_at: Optional[str]
    is_recurring: bool
    created_at: str

    @classmethod
    def from_orm(cls, task: Task) -> "TaskResponse":
        return cls(
            id=task.id,
            name=task.name,
            description=task.description,
            task_type=task.task_type,
            status=task.status.value if hasattr(task.status, 'value') else task.status,
            priority=task.priority,
            progress=task.progress,
            error=task.error,
            scheduled_at=task.scheduled_at.isoformat() if task.scheduled_at else None,
            started_at=task.started_at.isoformat() if task.started_at else None,
            completed_at=task.completed_at.isoformat() if task.completed_at else None,
            is_recurring=task.is_recurring,
            created_at=task.created_at.isoformat(),
        )


class TaskCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    task_type: str = "custom"
    config: Optional[dict] = None
    priority: int = Field(0, ge=-10, le=10)
    scheduled_at: Optional[str] = None
    is_recurring: bool = False
    cron_expression: Optional[str] = None


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[int] = None
    config: Optional[dict] = None


@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    status_filter: Optional[TaskStatus] = Query(None, alias="status"),
    task_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
):
    """List tasks for the current user."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        query = select(Task).where(Task.user_id == current_user.id)
        if status_filter:
            query = query.where(Task.status == status_filter)
        if task_type:
            query = query.where(Task.task_type == task_type)
        query = query.order_by(Task.created_at.desc()).limit(limit)

        result = await session.execute(query)
        tasks = result.scalars().all()
        return [TaskResponse.from_orm(t) for t in tasks]


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    request: TaskCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a new task."""
    scheduled_at = None
    if request.scheduled_at:
        try:
            scheduled_at = datetime.fromisoformat(request.scheduled_at)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")

    async with async_session_factory() as session:
        task = Task(
            user_id=current_user.id,
            name=request.name,
            description=request.description,
            task_type=request.task_type,
            config=request.config or {},
            priority=request.priority,
            scheduled_at=scheduled_at,
            is_recurring=request.is_recurring,
            cron_expression=request.cron_expression,
            status=TaskStatus.PENDING if not scheduled_at else TaskStatus.SCHEDULED,
        )
        session.add(task)
        await session.commit()
        return TaskResponse.from_orm(task)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, current_user: User = Depends(get_current_user)):
    """Get task details."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        result = await session.execute(
            select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
        )
        task = result.scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return TaskResponse.from_orm(task)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    request: TaskUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update a task."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        result = await session.execute(
            select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
        )
        task = result.scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        if request.name is not None:
            task.name = request.name
        if request.description is not None:
            task.description = request.description
        if request.status is not None:
            task.status = request.status
        if request.priority is not None:
            task.priority = request.priority
        if request.config is not None:
            task.config = request.config

        await session.commit()
        return TaskResponse.from_orm(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: str, current_user: User = Depends(get_current_user)):
    """Delete a task."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        result = await session.execute(
            select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
        )
        task = result.scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        await session.delete(task)
        await session.commit()


@router.post("/{task_id}/cancel")
async def cancel_task(task_id: str, current_user: User = Depends(get_current_user)):
    """Cancel a running or pending task."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        result = await session.execute(
            select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
        )
        task = result.scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        task.status = TaskStatus.CANCELLED
        await session.commit()
        return {"message": "Task cancelled"}
