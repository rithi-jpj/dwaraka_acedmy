"""FRIDAY Agent System - Multi-Agent Orchestration

Specialized agents that collaborate to accomplish complex tasks:
- Commander: Orchestrates other agents
- Coding: Code generation and analysis
- Research: Web research and information gathering
- Memory: Memory management and retrieval
- Vision: Image and video analysis
- Automation: Task scheduling and workflow automation
- Security: Security monitoring and threat detection
- Planning: Task planning and decomposition
- FileSystem: File management operations
- Browser: Web browsing and automation
"""

from .base import BaseAgent, AgentRegistry
from .commander import CommanderAgent
from .coding import CodingAgent
from .research import ResearchAgent
