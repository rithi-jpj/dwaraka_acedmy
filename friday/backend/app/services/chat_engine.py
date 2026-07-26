"""FRIDAY Chat Engine

Core AI conversation engine supporting multiple providers:
- OpenAI GPT-4/GPT-3.5
- Anthropic Claude
- Google Gemini
- Ollama (local)
- LM Studio (local)

Handles streaming, context management, and automatic provider selection.
"""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import AsyncGenerator, Dict, List, Optional, Tuple, Any
from enum import Enum

from loguru import logger

from backend.config.settings import settings


class AIProvider(str, Enum):
    """Available AI providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    OLLAMA = "ollama"
    LM_STUDIO = "lm_studio"


class ChatEngine:
    """Central AI chat engine that routes to the best available provider."""

    def __init__(self):
        self._provider_instances: Dict[str, Any] = {}
        self._default_provider: Optional[str] = None

    async def _get_provider(self, provider: Optional[str] = None) -> tuple[str, Any]:
        """Get the best available provider instance.

        Args:
            provider: Optional specific provider to use.

        Returns:
            Tuple of (provider_name, provider_instance).

        Raises:
            RuntimeError: If no provider is available.
        """
        if provider and provider in self._provider_instances:
            return provider, self._provider_instances[provider]

        if provider:
            instance = await self._init_provider(provider)
            if instance:
                return provider, instance

        # Auto-select: try the preferred provider first
        preferred = settings.PREFERRED_PROVIDER
        if preferred != "auto":
            instance = await self._init_provider(preferred)
            if instance:
                return preferred, instance

        # Try providers in order
        for prov in [AIProvider.OPENAI, AIProvider.ANTHROPIC, AIProvider.GEMINI,
                     AIProvider.OLLAMA, AIProvider.LM_STUDIO]:
            if prov.value not in self._provider_instances:
                instance = await self._init_provider(prov.value)
                if instance:
                    return prov.value, instance

        raise RuntimeError("No AI provider available. Configure at least one provider.")

    async def _init_provider(self, provider: str) -> Optional[Any]:
        """Initialize an AI provider client.

        Args:
            provider: Provider name to initialize.

        Returns:
            Provider instance or None if unavailable.
        """
        try:
            if provider == AIProvider.OPENAI.value and settings.OPENAI_API_KEY:
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                self._provider_instances[provider] = client
                logger.info(f"✅ Initialized OpenAI provider")
                return client

            elif provider == AIProvider.ANTHROPIC.value and settings.ANTHROPIC_API_KEY:
                from anthropic import AsyncAnthropic
                client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
                self._provider_instances[provider] = client
                logger.info(f"✅ Initialized Anthropic provider")
                return client

            elif provider == AIProvider.GEMINI.value and settings.GEMINI_API_KEY:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self._provider_instances[provider] = genai
                logger.info(f"✅ Initialized Gemini provider")
                return genai

            elif provider == AIProvider.OLLAMA.value:
                import httpx
                client = httpx.AsyncClient(base_url=settings.OLLAMA_BASE_URL)
                # Test connection
                try:
                    response = await client.get("/api/tags", timeout=5)
                    if response.status_code == 200:
                        self._provider_instances[provider] = client
                        logger.info(f"✅ Initialized Ollama provider")
                        return client
                except Exception:
                    logger.warning("Ollama not available")
                    return None

            elif provider == AIProvider.LM_STUDIO.value:
                import httpx
                client = httpx.AsyncClient(base_url=settings.LM_STUDIO_BASE_URL)
                self._provider_instances[provider] = client
                logger.info(f"✅ Initialized LM Studio provider")
                return client

        except Exception as e:
            logger.warning(f"Failed to initialize {provider}: {e}")
            return None

        return None

    def _build_system_prompt(self, user_id: str) -> str:
        """Build the FRIDAY system prompt with personality and context."""
        return f"""You are FRIDAY, a production-grade AI assistant. You are:
- Professional, calm, and intelligent
- Helpful, concise, and respectful
- Proactive without being intrusive
- Context-aware and adaptive in communication style

You have access to tools for:
- Web search and research
- Code generation and analysis
- File system operations
- Computer control
- Memory and knowledge retrieval
- Task automation
- Multi-agent collaboration

Always provide accurate, well-reasoned responses. When you don't know something, say so.
Use markdown formatting for clear communication. For code, use proper syntax highlighting.

Current user: {user_id}
Current time: {datetime.utcnow().isoformat()}
"""

    def _prepare_messages(self, messages: List[dict]) -> List[dict]:
        """Prepare messages for the AI provider format."""
        return [
            {"role": m.get("role", "user"), "content": m.get("content", "")}
            for m in messages
        ]

    async def generate_response(
        self,
        user_id: str,
        conversation_id: str,
        message: str,
        stream: bool = False,
        provider_name: Optional[str] = None,
    ) -> Tuple[str, Dict[str, Any]]:
        """Generate an AI response to a user message.

        Args:
            user_id: The user's unique identifier.
            conversation_id: The conversation ID.
            message: The user's message content.
            stream: Whether to stream the response.
            provider_name: Optional specific provider to use.

        Returns:
            Tuple of (response_text, metadata_dict).
        """
        try:
            provider_name, provider = await self._get_provider(provider_name)
            logger.info(f"Using provider: {provider_name} for conversation {conversation_id}")

            # Build context from memory
            from backend.app.services.memory_service import MemoryService
            memory_service = MemoryService()
            memories = await memory_service.get_relevant_memories(
                user_id=user_id,
                query=message,
                limit=5,
            )

            memory_context = ""
            if memories:
                memory_context = "\nRelevant memories:\n" + "\n".join(
                    f"- [{mem.key}]: {mem.content[:200]}"
                    for mem, _ in memories
                )

            system_prompt = self._build_system_prompt(user_id) + memory_context

            metadata = {
                "provider": provider_name,
                "model": "",
                "tokens_used": 0,
                "timestamp": datetime.utcnow().isoformat(),
            }

            if provider_name == AIProvider.OPENAI.value:
                response = await provider.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message},
                    ],
                    temperature=0.7,
                    max_tokens=4096,
                    stream=False,
                )
                metadata["model"] = settings.OPENAI_MODEL
                metadata["tokens_used"] = response.usage.total_tokens if response.usage else 0
                return response.choices[0].message.content or "", metadata

            elif provider_name == AIProvider.ANTHROPIC.value:
                response = await provider.messages.create(
                    model=settings.ANTHROPIC_MODEL,
                    system=system_prompt,
                    messages=[{"role": "user", "content": message}],
                    max_tokens=4096,
                )
                metadata["model"] = settings.ANTHROPIC_MODEL
                metadata["tokens_used"] = response.usage.input_tokens + response.usage.output_tokens if response.usage else 0
                return response.content[0].text, metadata

            elif provider_name == AIProvider.GEMINI.value:
                model = provider.GenerativeModel(
                    settings.GEMINI_MODEL,
                    system_instruction=system_prompt,
                )
                response = await model.generate_content_async(message)
                metadata["model"] = settings.GEMINI_MODEL
                if hasattr(response, 'usage_metadata'):
                    metadata["tokens_used"] = response.usage_metadata.prompt_token_count + response.usage_metadata.candidates_token_count
                return response.text, metadata

            elif provider_name == AIProvider.OLLAMA.value:
                response = await provider.post(
                    "/api/chat",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": message},
                        ],
                        "stream": False,
                    },
                    timeout=120,
                )
                data = response.json()
                metadata["model"] = settings.OLLAMA_MODEL
                return data.get("message", {}).get("content", ""), metadata

            elif provider_name == AIProvider.LM_STUDIO.value:
                response = await provider.post(
                    "/v1/chat/completions",
                    json={
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": message},
                        ],
                        "temperature": 0.7,
                        "max_tokens": 4096,
                    },
                    timeout=120,
                )
                data = response.json()
                metadata["model"] = data.get("model", "local")
                return data["choices"][0]["message"]["content"], metadata

            else:
                raise ValueError(f"Unknown provider: {provider_name}")

        except Exception as e:
            logger.error(f"AI response generation failed: {e}")
            return (
                f"I apologize, but I encountered an error: {str(e)}\n\n"
                "Please check your AI provider configuration and try again.",
                {"provider": "none", "model": "", "error": str(e), "tokens_used": 0},
            )

    async def summarize_conversation(self, messages: List["Message"]) -> str:
        """Generate a summary of a conversation.

        Args:
            messages: List of message objects to summarize.

        Returns:
            Summary text.
        """
        if not messages:
            return "No messages to summarize."

        try:
            provider_name, provider = await self._get_provider()

            conversation_text = "\n".join(
                f"{m.role.value if hasattr(m.role, 'value') else m.role}: {m.content[:500]}"
                for m in messages[-20:]  # Last 20 messages
            )

            prompt = f"Please summarize this conversation concisely:\n\n{conversation_text}"

            if provider_name == AIProvider.OPENAI.value:
                response = await provider.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=500,
                )
                return response.choices[0].message.content or ""

            elif provider_name == AIProvider.ANTHROPIC.value:
                response = await provider.messages.create(
                    model=settings.ANTHROPIC_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=500,
                )
                return response.content[0].text

            else:
                return f"Conversation with {len(messages)} messages"

        except Exception as e:
            logger.error(f"Summarization failed: {e}")
            return f"Conversation with {len(messages)} messages"

    async def chat_stream(
        self,
        user_id: str,
        conversation_id: str,
        message: str,
    ) -> AsyncGenerator[str, None]:
        """Stream an AI response token by token.

        Args:
            user_id: The user's unique identifier.
            conversation_id: The conversation ID.
            message: The user's message.

        Yields:
            Text chunks as they are generated.
        """
        try:
            provider_name, provider = await self._get_provider()

            system_prompt = self._build_system_prompt(user_id)

            if provider_name == AIProvider.OPENAI.value:
                stream = await provider.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message},
                    ],
                    temperature=0.7,
                    max_tokens=4096,
                    stream=True,
                )
                async for chunk in stream:
                    if chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content

            elif provider_name == AIProvider.OLLAMA.value:
                async with provider.stream(
                    "POST",
                    "/api/chat",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": message},
                        ],
                        "stream": True,
                    },
                    timeout=120,
                ) as response:
                    async for line in response.aiter_lines():
                        if line:
                            import json
                            try:
                                data = json.loads(line)
                                content = data.get("message", {}).get("content", "")
                                if content:
                                    yield content
                            except json.JSONDecodeError:
                                continue

        except Exception as e:
            logger.error(f"Streaming failed: {e}")
            yield f"\n\nError: {str(e)}"

    async def check_health(self) -> Dict[str, Any]:
        """Check the health status of all configured providers.

        Returns:
            Dictionary with health status per provider.
        """
        health = {}
        for provider in AIProvider:
            try:
                instance = await self._get_provider(provider.value)
                health[provider.value] = {"status": "available", "model": ""}
                if provider == AIProvider.OPENAI.value:
                    health[provider.value]["model"] = settings.OPENAI_MODEL
                elif provider == AIProvider.ANTHROPIC.value:
                    health[provider.value]["model"] = settings.ANTHROPIC_MODEL
                elif provider == AIProvider.GEMINI.value:
                    health[provider.value]["model"] = settings.GEMINI_MODEL
                elif provider == AIProvider.OLLAMA.value:
                    health[provider.value]["model"] = settings.OLLAMA_MODEL
            except Exception:
                health[provider.value] = {"status": "unavailable", "model": ""}
        return health
