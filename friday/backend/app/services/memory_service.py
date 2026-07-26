"""FRIDAY Memory Service

Manages long-term memory with:
- Semantic search using vector embeddings
- Memory ranking by importance and recency
- Context injection for conversations
- Automatic memory consolidation
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import numpy as np

from loguru import logger

from backend.config.settings import settings
from backend.database.base import async_session_factory
from backend.database.models import Memory, MemoryType


class MemoryService:
    """Service for managing FRIDAY's long-term memory with semantic search."""

    def __init__(self):
        self._embedding_model = None
        self._vector_store = None

    async def _get_embeddings(self, texts: List[str]) -> Optional[np.ndarray]:
        """Generate embeddings for a list of texts.

        Uses sentence-transformers locally when available,
        falls back to OpenAI embeddings API.
        """
        try:
            if self._embedding_model is None:
                from sentence_transformers import SentenceTransformer
                self._embedding_model = SentenceTransformer(
                    settings.EMBEDDING_MODEL,
                    device="cpu",
                )
                logger.info(f"✅ Loaded embedding model: {settings.EMBEDDING_MODEL}")

            embeddings = self._embedding_model.encode(texts, show_progress_bar=False)
            return embeddings

        except Exception as e:
            logger.warning(f"Local embedding failed, trying API: {e}")
            try:
                # Fall back to OpenAI embeddings
                if settings.OPENAI_API_KEY:
                    from openai import AsyncOpenAI
                    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                    response = await client.embeddings.create(
                        model=settings.OPENAI_EMBEDDING_MODEL,
                        input=texts,
                    )
                    embeddings = np.array([item.embedding for item in response.data])
                    return embeddings
            except Exception as e2:
                logger.error(f"All embedding methods failed: {e2}")
                return None

    async def store_memory(
        self,
        user_id: str,
        key: str,
        content: str,
        memory_type: MemoryType = MemoryType.KNOWLEDGE,
        summary: Optional[str] = None,
        importance: float = 0.5,
        metadata: Optional[Dict] = None,
        source: Optional[str] = None,
        expires_at: Optional[datetime] = None,
    ) -> Memory:
        """Store a new memory or update an existing one.

        Args:
            user_id: Owner of the memory.
            key: Unique identifier for the memory.
            content: Memory content text.
            memory_type: Type of memory.
            summary: Optional short summary.
            importance: Relevance score (0.0 to 1.0).
            metadata: Additional metadata dictionary.
            source: Source of the memory.
            expires_at: Optional expiration date.

        Returns:
            The created or updated Memory object.
        """
        from sqlalchemy import select

        async with async_session_factory() as session:
            # Check if memory already exists
            result = await session.execute(
                select(Memory).where(
                    Memory.user_id == user_id,
                    Memory.key == key,
                )
            )
            existing = result.scalar_one_or_none()

            if existing:
                # Update existing
                existing.content = content
                existing.type = memory_type
                existing.summary = summary or existing.summary
                existing.importance = importance
                existing.metadata = metadata or existing.metadata
                existing.source = source or existing.source
                existing.expires_at = expires_at
                existing.updated_at = datetime.utcnow()
                memory = existing
            else:
                # Create new
                memory = Memory(
                    user_id=user_id,
                    key=key,
                    content=content,
                    type=memory_type,
                    summary=summary,
                    importance=importance,
                    metadata=metadata or {},
                    source=source,
                    expires_at=expires_at,
                )
                session.add(memory)

            # Generate embedding for semantic search
            embedding_text = f"{key}: {content}"
            if summary:
                embedding_text = f"{key}: {summary}"

            embeddings = await self._get_embeddings([embedding_text])
            if embeddings is not None:
                memory.embedding = embeddings[0].tobytes()

            await session.commit()
            logger.debug(f"Stored memory: {key} ({memory_type.value})")

            return memory

    async def search_memories(
        self,
        user_id: str,
        query: str,
        limit: int = 10,
        memory_type: Optional[MemoryType] = None,
        min_importance: float = 0.0,
    ) -> List[Tuple[Memory, float]]:
        """Search memories using semantic similarity.

        Args:
            user_id: Owner of memories to search.
            query: Search query text.
            limit: Maximum number of results.
            memory_type: Optional filter by memory type.
            min_importance: Minimum importance threshold.

        Returns:
            List of (Memory, relevance_score) tuples sorted by relevance.
        """
        from sqlalchemy import select, and_

        async with async_session_factory() as session:
            query_obj = select(Memory).where(
                Memory.user_id == user_id,
                Memory.importance >= min_importance,
            )

            if memory_type:
                query_obj = query_obj.where(Memory.type == memory_type)

            # Check for expiration
            query_obj = query_obj.where(
                (Memory.expires_at.is_(None)) | (Memory.expires_at > datetime.utcnow())
            )

            result = await session.execute(
                query_obj.order_by(Memory.updated_at.desc()).limit(50)
            )
            memories = result.scalars().all()

            if not memories:
                return []

            # Try semantic search with embeddings
            query_embedding = await self._get_embeddings([query])
            if query_embedding is not None and memories:
                scored_memories = []
                for memory in memories:
                    if memory.embedding:
                        mem_embedding = np.frombuffer(memory.embedding, dtype=np.float32)
                        # Cosine similarity
                        similarity = np.dot(query_embedding[0], mem_embedding) / (
                            np.linalg.norm(query_embedding[0]) * np.linalg.norm(mem_embedding) + 1e-8
                        )
                        score = float(similarity) * memory.importance
                    else:
                        # Fall back to keyword matching
                        score = self._keyword_score(query, memory.content) * memory.importance

                    scored_memories.append((memory, score))

                scored_memories.sort(key=lambda x: x[1], reverse=True)
                return scored_memories[:limit]

            # Fall back to keyword search
            scored = [
                (m, self._keyword_score(query, m.content) * m.importance)
                for m in memories
            ]
            scored.sort(key=lambda x: x[1], reverse=True)
            return scored[:limit]

    async def get_relevant_memories(
        self,
        user_id: str,
        query: str,
        limit: int = 5,
    ) -> List[Tuple[Memory, float]]:
        """Get the most relevant memories for context injection.

        Wrapper around search_memories that returns top results
        across all memory types for conversation context.
        """
        results = await self.search_memories(
            user_id=user_id,
            query=query,
            limit=limit,
            min_importance=0.3,
        )
        return results

    async def get_memory_context(self, user_id: str, query: str) -> str:
        """Get a formatted context string from relevant memories.

        Used to inject memory context into AI prompts.

        Args:
            user_id: User ID.
            query: The current context/query.

        Returns:
            Formatted memory context string.
        """
        memories = await self.get_relevant_memories(
            user_id=user_id,
            query=query,
            limit=settings.MAX_MEMORY_CONTEXT,
        )

        if not memories:
            return ""

        context_parts = ["\n## Relevant Memories\n"]
        for memory, score in memories:
            if score > 0.3:
                context_parts.append(
                    f"- [{memory.type.value}] {memory.key}: "
                    f"{memory.content[:300]}"
                )

        return "\n".join(context_parts) if len(context_parts) > 1 else ""

    async def cleanup_expired(self) -> int:
        """Remove expired memories.

        Returns:
            Number of memories removed.
        """
        from sqlalchemy import delete

        async with async_session_factory() as session:
            result = await session.execute(
                delete(Memory).where(
                    Memory.expires_at.isnot(None),
                    Memory.expires_at < datetime.utcnow(),
                )
            )
            await session.commit()
            count = result.rowcount
            if count > 0:
                logger.info(f"Cleaned up {count} expired memories")
            return count

    def _keyword_score(self, query: str, content: str) -> float:
        """Simple keyword matching score as fallback.

        Args:
            query: Search query.
            content: Content to match against.

        Returns:
            Score between 0.0 and 1.0.
        """
        query_words = set(query.lower().split())
        content_words = set(content.lower().split())

        if not query_words:
            return 0.0

        intersection = query_words & content_words
        if not intersection:
            return 0.0

        # Jaccard-like similarity weighted by word frequency
        score = len(intersection) / len(query_words)
        return min(score, 1.0)
