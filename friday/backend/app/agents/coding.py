"""FRIDAY Coding Agent

Provides code generation, analysis, debugging, refactoring,
and documentation capabilities across multiple languages.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from loguru import logger

from .base import BaseAgent
from backend.config.settings import settings


class CodingAgent(BaseAgent):
    """Specialized agent for code-related tasks."""

    def __init__(self, name: str = "Coding Agent", model: Optional[str] = None):
        super().__init__(
            name=name,
            agent_type="coding",
            description="Generates, analyzes, debugs, and refactors code across multiple languages",
            model=model,
        )
        self._register_default_tools()

    def _register_default_tools(self):
        """Register code-related tools."""
        self.register_tool("generate_code", self._generate_code)
        self.register_tool("review_code", self._review_code)
        self.register_tool("explain_code", self._explain_code)
        self.register_tool("debug_code", self._debug_code)
        self.register_tool("refactor_code", self._refactor_code)
        self.register_tool("write_tests", self._write_tests)

    async def process(
        self,
        task: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Process a coding task.

        Args:
            task: Description of the coding task.
            context: Optional shared context.

        Returns:
            Task results with generated code or analysis.
        """
        task_lower = task.lower()

        if context:
            self._context.update(context)

        # Determine the type of coding task
        if "generate" in task_lower or "write" in task_lower or "create" in task_lower:
            return await self._generate_code(task)
        elif "review" in task_lower or "analyze" in task_lower:
            return await self._review_code(task)
        elif "explain" in task_lower or "what does" in task_lower:
            return await self._explain_code(task)
        elif "debug" in task_lower or "fix" in task_lower or "error" in task_lower:
            return await self._debug_code(task)
        elif "refactor" in task_lower or "improve" in task_lower:
            return await self._refactor_code(task)
        elif "test" in task_lower:
            return await self._write_tests(task)
        else:
            return {
                "success": True,
                "response": (
                    "I can help with code generation, review, debugging, refactoring, "
                    "explanations, and testing. What coding task would you like me to help with?"
                ),
            }

    async def _generate_code(self, task: str) -> Dict[str, Any]:
        """Generate code based on requirements."""
        return {
            "success": True,
            "response": (
                "I'll help generate code for your requirements. "
                "Please provide more details about:\n"
                "1. Programming language\n"
                "2. What the code should do\n"
                "3. Any specific requirements or constraints\n\n"
                "For example: 'Generate a Python function that downloads a file from a URL'"
            ),
        }

    async def _review_code(self, task: str) -> Dict[str, Any]:
        """Review code for issues and improvements."""
        code = self._extract_code(task)
        if code:
            return {
                "success": True,
                "response": (
                    f"Code review analysis:\n\n"
                    f"```\n{code}\n```\n\n"
                    "I can review this code for:\n"
                    "- Bugs and logic errors\n"
                    "- Performance issues\n"
                    "- Security vulnerabilities\n"
                    "- Style and best practices\n"
                    "- Potential improvements\n\n"
                    "What aspects would you like me to focus on?"
                ),
            }
        return {
            "success": True,
            "response": "I'd be happy to review your code. Please share the code you'd like me to review.",
        }

    async def _explain_code(self, task: str) -> Dict[str, Any]:
        """Explain what a piece of code does."""
        code = self._extract_code(task)
        if code:
            return {
                "success": True,
                "response": (
                    f"Code explanation for:\n\n```\n{code[:500]}\n```\n\n"
                    "I'll explain what this code does, including:\n"
                    "- Purpose and functionality\n"
                    "- How it works step by step\n"
                    "- Key concepts used\n"
                    "- Potential edge cases"
                ),
            }
        return {
            "success": True,
            "response": (
                "I can help explain code. Share the code you'd like me to explain, "
                "and I'll break down what it does."
            ),
        }

    async def _debug_code(self, task: str) -> Dict[str, Any]:
        """Debug code and suggest fixes."""
        code = self._extract_code(task)
        if code:
            return {
                "success": True,
                "response": (
                    f"Debugging analysis for:\n\n```\n{code[:500]}\n```\n\n"
                    "I'll help find and fix issues. Common areas I check:\n"
                    "- Syntax errors\n"
                    "- Logic errors\n"
                    "- Edge cases\n"
                    "- Type mismatches\n"
                    "- Resource leaks"
                ),
            }
        return {
            "success": True,
            "response": (
                "I can help debug code. Share the code that's having issues, "
                "along with any error messages or unexpected behavior."
            ),
        }

    async def _refactor_code(self, task: str) -> Dict[str, Any]:
        """Suggest refactoring improvements."""
        code = self._extract_code(task)
        if code:
            return {
                "success": True,
                "response": (
                    f"Refactoring suggestions for:\n\n```\n{code[:500]}\n```\n\n"
                    "I can suggest improvements for:\n"
                    "- Code organization and structure\n"
                    "- Performance optimization\n"
                    "- Readability and maintainability\n"
                    "- Design patterns\n"
                    "- Modern language features"
                ),
            }
        return {
            "success": True,
            "response": (
                "I can suggest refactoring improvements. Share the code you'd like me "
                "to analyze for potential improvements."
            ),
        }

    async def _write_tests(self, task: str) -> Dict[str, Any]:
        """Generate test cases for code."""
        code = self._extract_code(task)
        if code:
            return {
                "success": True,
                "response": (
                    f"Test generation for:\n\n```\n{code[:500]}\n```\n\n"
                    "I can generate tests including:\n"
                    "- Unit tests\n"
                    "- Integration tests\n"
                    "- Edge cases\n"
                    "- Mock objects\n"
                    "- Test fixtures"
                ),
            }
        return {
            "success": True,
            "response": (
                "I can help write tests for your code. Share the code you'd like "
                "test cases for, and specify the testing framework."
            ),
        }

    def _extract_code(self, text: str) -> Optional[str]:
        """Extract code blocks from markdown text.

        Args:
            text: Text that may contain code blocks.

        Returns:
            Extracted code or None if no code blocks found.
        """
        # Match ```code blocks
        pattern = r"```(?:\w+)?\n?(.*?)```"
        matches = re.findall(pattern, text, re.DOTALL)
        if matches:
            return matches[0].strip()

        # Match inline code
        pattern = r"`([^`]+)`"
        matches = re.findall(pattern, text)
        if matches:
            return matches[0]

        return None
