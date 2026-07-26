"""FRIDAY Base Agent - Abstract Agent Framework

Provides the foundation for all specialized agents with:
- Common interface and lifecycle
- Agent registry for discovery
- Tool execution capabilities
- Context sharing
- Error handling
"""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Type

from loguru import logger

from backend.config.settings import settings


class BaseAgent(ABC):
    """Abstract base class for all FRIDAY agents."""

    def __init__(
        self,
        name: str,
        agent_type: str,
        description: str = "",
        model: Optional[str] = None,
    ):
        self.id = str(uuid.uuid4())
        self.name = name
        self.agent_type = agent_type
        self.description = description
        self.model = model
        self.created_at = datetime.utcnow()
        self._context: Dict[str, Any] = {}
        self._tools: Dict[str, callable] = {}

    @abstractmethod
    async def process(self, task: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Process a task and return results.

        Args:
            task: The task description or input.
            context: Optional shared context from other agents.

        Returns:
            Dictionary with task results.
        """
        pass

    async def initialize(self) -> None:
        """Initialize the agent. Override for custom setup."""
        logger.info(f"Agent {self.name} ({self.agent_type}) initialized")
        pass

    async def shutdown(self) -> None:
        """Clean up agent resources. Override for custom cleanup."""
        logger.info(f"Agent {self.name} ({self.agent_type}) shutting down")
        pass

    def register_tool(self, name: str, func: callable) -> None:
        """Register a tool that this agent can use."""
        self._tools[name] = func

    async def execute_tool(self, name: str, **kwargs) -> Any:
        """Execute a registered tool by name."""
        if name not in self._tools:
            raise ValueError(f"Tool '{name}' not found on agent {self.name}")
        return await self._tools[name](**kwargs)

    def get_capabilities(self) -> List[str]:
        """Get list of this agent's capabilities."""
        return list(self._tools.keys())

    def update_context(self, key: str, value: Any) -> None:
        """Update the agent's shared context."""
        self._context[key] = value

    def get_context(self, key: str, default: Any = None) -> Any:
        """Get a value from the shared context."""
        return self._context.get(key, default)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize agent info to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "type": self.agent_type,
            "description": self.description,
            "model": self.model,
            "capabilities": self.get_capabilities(),
            "created_at": self.created_at.isoformat(),
        }


class AgentRegistry:
    """Registry for discovering and managing agents."""

    _agents: Dict[str, BaseAgent] = {}
    _agent_types: Dict[str, Type[BaseAgent]] = {}

    @classmethod
    def register_agent_type(cls, name: str, agent_class: Type[BaseAgent]) -> None:
        """Register an agent class for dynamic instantiation."""
        cls._agent_types[name] = agent_class
        logger.debug(f"Registered agent type: {name}")

    @classmethod
    def register_instance(cls, agent: BaseAgent) -> None:
        """Register an agent instance."""
        cls._agents[agent.id] = agent
        logger.info(f"Registered agent instance: {agent.name} ({agent.id[:8]})")

    @classmethod
    def unregister(cls, agent_id: str) -> None:
        """Unregister an agent."""
        if agent_id in cls._agents:
            agent = cls._agents.pop(agent_id)
            logger.info(f"Unregistered agent: {agent.name}")

    @classmethod
    def get_agent(cls, agent_id: str) -> Optional[BaseAgent]:
        """Get an agent by ID."""
        return cls._agents.get(agent_id)

    @classmethod
    def get_agents_by_type(cls, agent_type: str) -> List[BaseAgent]:
        """Get all agents of a specific type."""
        return [
            agent for agent in cls._agents.values()
            if agent.agent_type == agent_type
        ]

    @classmethod
    def get_all_agents(cls) -> List[BaseAgent]:
        """Get all registered agents."""
        return list(cls._agents.values())

    @classmethod
    async def initialize_all(cls) -> None:
        """Initialize all registered agents."""
        for agent in cls._agents.values():
            try:
                await agent.initialize()
            except Exception as e:
                logger.error(f"Failed to initialize agent {agent.name}: {e}")

    @classmethod
    async def shutdown_all(cls) -> None:
        """Shut down all registered agents."""
        for agent in cls._agents.values():
            try:
                await agent.shutdown()
            except Exception as e:
                logger.error(f"Failed to shut down agent {agent.name}: {e}")

    @classmethod
    def create_instance(
        cls,
        agent_type: str,
        name: str,
        **kwargs,
    ) -> Optional[BaseAgent]:
        """Dynamically create an agent instance from a registered type."""
        if agent_type not in cls._agent_types:
            logger.error(f"Unknown agent type: {agent_type}")
            return None

        agent_class = cls._agent_types[agent_type]
        agent = agent_class(name=name, **kwargs)
        cls.register_instance(agent)
        return agent

    @classmethod
    def get_summary(cls) -> Dict[str, Any]:
        """Get a summary of all registered agents."""
        return {
            "total": len(cls._agents),
            "by_type": {
                agent_type: len(cls.get_agents_by_type(agent_type))
                for agent_type in set(a.agent_type for a in cls._agents.values())
            },
            "agents": [a.to_dict() for a in cls._agents.values()],
        }
