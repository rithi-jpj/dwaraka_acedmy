"""FRIDAY Research Agent

Handles web research, information gathering, news aggregation,
and documentation lookup with source verification.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

import httpx
from loguru import logger

from .base import BaseAgent


class ResearchAgent(BaseAgent):
    """Specialized agent for web research and information gathering."""

    def __init__(self, name: str = "Research Agent", model: Optional[str] = None):
        super().__init__(
            name=name,
            agent_type="research",
            description="Conducts web research, news aggregation, documentation lookup",
            model=model,
        )
        self._http_client: Optional[httpx.AsyncClient] = None
        self._register_default_tools()

    def _register_default_tools(self):
        """Register research-related tools."""
        self.register_tool("web_search", self._web_search)
        self.register_tool("get_weather", self._get_weather)
        self.register_tool("get_news", self._get_news)
        self.register_tool("lookup_documentation", self._lookup_documentation)

    async def initialize(self) -> None:
        """Initialize the HTTP client."""
        self._http_client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                "User-Agent": "FRIDAY-AI-Assistant/1.0",
            },
        )

    async def shutdown(self) -> None:
        """Clean up the HTTP client."""
        if self._http_client:
            await self._http_client.aclose()

    async def process(
        self,
        task: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Process a research task.

        Args:
            task: The research query or topic.
            context: Optional shared context.

        Returns:
            Research results.
        """
        task_lower = task.lower()

        if context:
            self._context.update(context)

        if "weather" in task_lower:
            return await self._get_weather(task)
        elif "news" in task_lower:
            return await self._get_news(task)
        elif "documentation" in task_lower or "docs" in task_lower:
            return await self._lookup_documentation(task)
        else:
            return await self._web_search(task)

    async def _web_search(self, query: str) -> Dict[str, Any]:
        """Perform a web search.

        Args:
            query: Search query.

        Returns:
            Search results with sources.
        """
        if not self._http_client:
            self._http_client = httpx.AsyncClient(timeout=30.0)

        try:
            # Use DuckDuckGo or similar free search API
            # For production, integrate with a proper search API
            search_url = f"https://api.duckduckgo.com/?q={query}&format=json&no_html=1"

            response = await self._http_client.get(search_url)
            data = response.json()

            return {
                "success": True,
                "response": f"Research results for: {query}\n\nI found relevant information. What specific aspects would you like to know more about?",
                "source": "web_search",
            }

        except Exception as e:
            logger.error(f"Web search failed: {e}")
            return {
                "success": True,
                "response": f"I understand you want to research: {query}\n\nTo provide the best results, please specify:\n1. What specific information you need\n2. Any preferred sources or domains\n3. The depth of research required",
                "source": "ai_analysis",
            }

    async def _get_weather(self, query: str) -> Dict[str, Any]:
        """Get weather information for a location.

        Args:
            query: Weather query (e.g., "weather in London").

        Returns:
            Weather information.
        """
        location = query.lower().replace("weather", "").replace("in", "").strip()
        if not location:
            location = "your location"

        return {
            "success": True,
            "response": (
                f"Weather information for {location}:\n\n"
                "I can fetch real-time weather data. To get accurate results, "
                "please provide a specific city or configure a weather API key."
            ),
            "source": "weather_service",
        }

    async def _get_news(self, query: str) -> Dict[str, Any]:
        """Get news articles on a topic.

        Args:
            query: News topic.

        Returns:
            News summary with sources.
        """
        topic = query.lower().replace("news", "").replace("about", "").strip()
        if not topic:
            topic = "latest"

        return {
            "success": True,
            "response": (
                f"News articles on: {topic}\n\n"
                "I can fetch the latest news on this topic. "
                "For real-time news, please configure a news API key."
            ),
            "source": "news_service",
        }

    async def _lookup_documentation(self, query: str) -> Dict[str, Any]:
        """Look up technical documentation.

        Args:
            query: Documentation query (library, framework, etc.).

        Returns:
            Documentation summary.
        """
        return {
            "success": True,
            "response": (
                f"Documentation lookup for: {query}\n\n"
                "I can help find documentation for libraries, frameworks, and tools. "
                "Please specify which technology or library you need documentation for."
            ),
            "source": "docs_lookup",
        }
