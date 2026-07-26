"""FRIDAY Agents API Routes

Manages specialized AI agent creation, configuration,
and runtime orchestration.
"""

from __future__ import annotations

from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from backend.database.base import async_session_factory
from backend.database.models import User, Agent, AgentType
from backend.app.security.auth import get_current_user, get_admin_user

router = APIRouter()


class AgentResponse(BaseModel):
    id: str
    name: str
    agent_type: str
    description: Optional[str]
    model: Optional[str]
    is_active: bool
    config: Optional[dict]
    created_at: str

    @classmethod
    def from_orm(cls, agent: Agent) -> "AgentResponse":
        return cls(
            id=agent.id,
            name=agent.name,
            agent_type=agent.agent_type.value if hasattr(agent.agent_type, 'value') else agent.agent_type,
            description=agent.description,
            model=agent.model,
            is_active=agent.is_active,
            config=agent.config,
            created_at=agent.created_at.isoformat(),
        )


class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    agent_type: AgentType
    description: Optional[str] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    config: Optional[dict] = None


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    config: Optional[dict] = None
    is_active: Optional[bool] = None


@router.get("", response_model=List[AgentResponse])
async def list_agents(
    agent_type: Optional[AgentType] = None,
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
):
    """List all available agents."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        query = select(Agent)
        if agent_type:
            query = query.where(Agent.agent_type == agent_type)
        if active_only:
            query = query.where(Agent.is_active == True)

        result = await session.execute(query.order_by(Agent.name))
        agents = result.scalars().all()
        return [AgentResponse.from_orm(a) for a in agents]


@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    request: AgentCreate,
    current_user: User = Depends(get_admin_user),
):
    """Create a new agent (admin only)."""
    async with async_session_factory() as session:
        from sqlalchemy import select
        result = await session.execute(
            select(Agent).where(Agent.name == request.name)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Agent with this name already exists",
            )

        agent = Agent(
            name=request.name,
            agent_type=request.agent_type,
            description=request.description,
            model=request.model,
            system_prompt=request.system_prompt,
            config=request.config or {},
            is_active=True,
        )
        session.add(agent)
        await session.commit()
        return AgentResponse.from_orm(agent)


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get agent details."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        result = await session.execute(
            select(Agent).where(Agent.id == agent_id)
        )
        agent = result.scalar_one_or_none()
        if not agent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
        return AgentResponse.from_orm(agent)


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    request: AgentUpdate,
    current_user: User = Depends(get_admin_user),
):
    """Update agent configuration (admin only)."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        result = await session.execute(
            select(Agent).where(Agent.id == agent_id)
        )
        agent = result.scalar_one_or_none()
        if not agent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

        if request.name is not None:
            agent.name = request.name
        if request.description is not None:
            agent.description = request.description
        if request.model is not None:
            agent.model = request.model
        if request.system_prompt is not None:
            agent.system_prompt = request.system_prompt
        if request.config is not None:
            agent.config = request.config
        if request.is_active is not None:
            agent.is_active = request.is_active

        await session.commit()
        return AgentResponse.from_orm(agent)


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    agent_id: str,
    current_user: User = Depends(get_admin_user),
):
    """Delete an agent (admin only)."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        result = await session.execute(
            select(Agent).where(Agent.id == agent_id)
        )
        agent = result.scalar_one_or_none()
        if not agent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
        await session.delete(agent)
        await session.commit()
