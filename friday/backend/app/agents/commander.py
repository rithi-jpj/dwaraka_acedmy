"""FRIDAY Commander Agent

Orchestrates multi-agent collaboration by:
- Analyzing user requests
- Delegating tasks to specialized agents
- Aggregating results
- Managing context between agents
- Handling errors and fallbacks
"""

from __future__ import annotations

import asyncio
from typing import Any, Dict, List, Optional

from loguru import logger

from .base import BaseAgent, AgentRegistry
from backend.config.settings import settings


class CommanderAgent(BaseAgent):
    """The commander agent orchestrates other agents to accomplish complex tasks."""

    def __init__(self, name: str = "Commander", model: Optional[str] = None):
        super().__init__(
            name=name,
            agent_type="commander",
            description="Orchestrates multi-agent collaboration and task delegation",
            model=model,
        )

    async def process(
        self,
        task: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Process a task by delegating to specialized agents.

        Analyzes the task and determines which agents to involve.

        Args:
            task: The task description.
            context: Optional shared context.

        Returns:
            Aggregated results from all involved agents.
        """
        logger.info(f"Commander processing task: {task[:100]}...")

        if context:
            self._context.update(context)

        # Analyze task to determine required agents
        required_agents = self._analyze_task(task)

        if not required_agents:
            return {
                "success": True,
                "response": "I understand your request. How can I help you with this?",
                "agents_involved": [],
            }

        # Execute tasks with specialized agents
        results = await self._delegate_tasks(task, required_agents)

        return {
            "success": True,
            "response": self._aggregate_results(results),
            "agents_involved": [r["agent"] for r in results],
            "details": results,
        }

    def _analyze_task(self, task: str) -> List[str]:
        """Analyze a task to determine which agents to involve.

        Returns list of agent types needed.
        """
        task_lower = task.lower()
        agents_needed = []

        # Check for coding tasks
        code_keywords = [
            "code", "program", "function", "script", "debug", "refactor",
            "python", "javascript", "typescript", "java", "react", "api",
            "algorithm", "implement", "build", "test",
        ]
        if any(kw in task_lower for kw in code_keywords):
            agents_needed.append("coding")

        # Check for research tasks
        research_keywords = [
            "search", "research", "find", "look up", "what is", "how to",
            "documentation", "tutorial", "explain", "news", "weather",
        ]
        if any(kw in task_lower for kw in research_keywords):
            agents_needed.append("research")

        # Check for file system tasks
        file_keywords = [
            "file", "folder", "directory", "save", "load", "read", "write",
            "create", "delete", "move", "rename", "copy", "open",
        ]
        if any(kw in task_lower for kw in file_keywords):
            agents_needed.append("file_system")

        # Check for vision tasks
        vision_keywords = [
            "image", "photo", "picture", "screenshot", "ocr", "scan",
            "see", "look", "visual", "camera", "webcam",
        ]
        if any(kw in task_lower for kw in vision_keywords):
            agents_needed.append("vision")

        # Check for automation tasks
        automation_keywords = [
            "schedule", "remind", "automate", "recurring", "cron",
            "repeat", "every day", "every week", "timer",
        ]
        if any(kw in task_lower for kw in automation_keywords):
            agents_needed.append("automation")

        # Check for planning tasks
        planning_keywords = [
            "plan", "project", "milestone", "roadmap", "strategy",
            "organize", "manage", "coordinate",
        ]
        if any(kw in task_lower for kw in planning_keywords):
            agents_needed.append("planning")

        # Default to at least the basic processing
        if not agents_needed:
            agents_needed.append("general")

        return agents_needed

    async def _delegate_tasks(
        self,
        task: str,
        agent_types: List[str],
    ) -> List[Dict[str, Any]]:
        """Delegate tasks to specialized agents in parallel.

        Args:
            task: The task to delegate.
            agent_types: List of agent types to involve.

        Returns:
            List of results from each agent.
        """
        results = []

        async def execute_agent(agent_type: str) -> Dict[str, Any]:
            """Execute a task with a specific agent type."""
            agents = AgentRegistry.get_agents_by_type(agent_type)
            if not agents:
                return {
                    "agent": agent_type,
                    "success": False,
                    "error": f"No {agent_type} agent available",
                }

            agent = agents[0]
            try:
                result = await agent.process(task, self._context)
                return {
                    "agent": agent_type,
                    "success": result.get("success", True),
                    "result": result.get("response", ""),
                }
            except Exception as e:
                logger.error(f"Agent {agent_type} failed: {e}")
                return {
                    "agent": agent_type,
                    "success": False,
                    "error": str(e),
                }

        # Execute agents in parallel
        tasks = [execute_agent(at) for at in agent_types]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        processed_results = []
        for r in results:
            if isinstance(r, Exception):
                processed_results.append({
                    "agent": "unknown",
                    "success": False,
                    "error": str(r),
                })
            else:
                processed_results.append(r)

        return processed_results

    def _aggregate_results(self, results: List[Dict[str, Any]]) -> str:
        """Aggregate results from multiple agents into a coherent response.

        Args:
            results: List of results from specialized agents.

        Returns:
            Aggregated response string.
        """
        successful = [r for r in results if r.get("success")]
        failed = [r for r in results if not r.get("success")]

        if not successful:
            return "I encountered some issues while processing your request. Please try again."

        # Combine successful results
        responses = [r["result"] for r in successful if r.get("result")]
        combined = "\n\n".join(responses) if responses else "Task completed successfully."

        if failed:
            combined += f"\n\n*Note: Some subsystems were unavailable: {', '.join(f['agent'] for f in failed)}*"

        return combined
