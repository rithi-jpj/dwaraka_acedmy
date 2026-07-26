"""FRIDAY Chat API Routes

Handles conversations, messages, and AI-powered chat interactions.
Integrates with the AI engine and memory system.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from backend.database.base import get_db, async_session_factory
from backend.database.models import User, Conversation, Message, MessageRole
from backend.app.security.auth import get_current_user
from backend.app.services.chat_engine import ChatEngine

router = APIRouter()
chat_engine = ChatEngine()


# --- Schemas ---

class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    tool_calls: Optional[dict] = None
    tool_results: Optional[dict] = None
    metadata: Optional[dict] = None
    tokens_used: Optional[int] = None
    model_used: Optional[str] = None
    provider: Optional[str] = None
    created_at: str

    @classmethod
    def from_orm(cls, msg: Message) -> "MessageResponse":
        return cls(
            id=msg.id,
            role=msg.role.value if hasattr(msg.role, 'value') else msg.role,
            content=msg.content,
            tool_calls=msg.tool_calls,
            tool_results=msg.tool_results,
            metadata=msg.metadata,
            tokens_used=msg.tokens_used,
            model_used=msg.model_used,
            provider=msg.provider,
            created_at=msg.created_at.isoformat(),
        )


class ConversationResponse(BaseModel):
    id: str
    title: str
    summary: Optional[str] = None
    is_archived: bool
    created_at: str
    updated_at: str
    message_count: int = 0

    @classmethod
    def from_orm(cls, conv: Conversation) -> "ConversationResponse":
        return cls(
            id=conv.id,
            title=conv.title,
            summary=conv.summary,
            is_archived=conv.is_archived,
            created_at=conv.created_at.isoformat(),
            updated_at=conv.updated_at.isoformat(),
            message_count=len(conv.messages) if conv.messages else 0,
        )


class SendMessageRequest(BaseModel):
    conversation_id: Optional[str] = None
    content: str = Field(..., min_length=1, max_length=100000)
    stream: bool = False


class SendMessageResponse(BaseModel):
    conversation_id: str
    message: MessageResponse
    conversation: Optional[ConversationResponse] = None


class CreateConversationRequest(BaseModel):
    title: Optional[str] = "New Conversation"


# --- Routes ---

@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
):
    """List all conversations for the current user."""
    from sqlalchemy import select, func

    async with async_session_factory() as session:
        result = await session.execute(
            select(Conversation)
            .where(
                Conversation.user_id == current_user.id,
                Conversation.is_archived == False,
            )
            .order_by(Conversation.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        conversations = result.scalars().all()

        return [ConversationResponse.from_orm(c) for c in conversations]


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    request: CreateConversationRequest,
    current_user: User = Depends(get_current_user),
):
    """Create a new conversation."""
    async with async_session_factory() as session:
        conversation = Conversation(
            user_id=current_user.id,
            title=request.title or "New Conversation",
        )
        session.add(conversation)
        await session.commit()

        return ConversationResponse.from_orm(conversation)


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get a conversation with all its messages."""
    async with async_session_factory() as session:
        from sqlalchemy import select
        result = await session.execute(
            select(Conversation)
            .where(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
        conversation = result.scalar_one_or_none()

        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        return ConversationResponse.from_orm(conversation)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a conversation and all its messages."""
    async with async_session_factory() as session:
        from sqlalchemy import select
        result = await session.execute(
            select(Conversation)
            .where(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
        conversation = result.scalar_one_or_none()

        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        await session.delete(conversation)
        await session.commit()


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: str,
    limit: int = Query(100, ge=1, le=500),
    before_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """Get messages for a conversation."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        # Verify conversation belongs to user
        result = await session.execute(
            select(Conversation)
            .where(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        query = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        )

        if before_id:
            query = query.where(Message.id < before_id)

        result = await session.execute(query)
        messages = result.scalars().all()

        return [MessageResponse.from_orm(m) for m in messages]


@router.post("/send", response_model=SendMessageResponse)
async def send_message(
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
):
    """Send a message and get an AI response."""
    async with async_session_factory() as session:
        # Get or create conversation
        conversation_id = request.conversation_id
        if conversation_id:
            from sqlalchemy import select
            result = await session.execute(
                select(Conversation)
                .where(
                    Conversation.id == conversation_id,
                    Conversation.user_id == current_user.id,
                )
            )
            conversation = result.scalar_one_or_none()
            if not conversation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found",
                )
        else:
            conversation = Conversation(
                user_id=current_user.id,
                title=request.content[:50] + ("..." if len(request.content) > 50 else ""),
            )
            session.add(conversation)
            await session.flush()
            conversation_id = conversation.id

        # Save user message
        user_message = Message(
            conversation_id=conversation_id,
            role=MessageRole.USER,
            content=request.content,
        )
        session.add(user_message)

        # Get AI response
        ai_response, metadata = await chat_engine.generate_response(
            user_id=current_user.id,
            conversation_id=conversation_id,
            message=request.content,
            stream=request.stream,
        )

        # Save AI response
        assistant_message = Message(
            conversation_id=conversation_id,
            role=MessageRole.ASSISTANT,
            content=ai_response,
            tokens_used=metadata.get("tokens_used"),
            model_used=metadata.get("model"),
            provider=metadata.get("provider"),
            metadata=metadata,
        )
        session.add(assistant_message)

        # Update conversation
        conversation.updated_at = datetime.utcnow()
        if conversation.title == "New Conversation" and len(request.content) > 10:
            conversation.title = request.content[:50] + ("..." if len(request.content) > 50 else "")

        await session.commit()

        return SendMessageResponse(
            conversation_id=conversation_id,
            message=MessageResponse.from_orm(assistant_message),
            conversation=ConversationResponse.from_orm(conversation),
        )


@router.post("/conversations/{conversation_id}/summarize")
async def summarize_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
):
    """Generate a summary of the conversation."""
    from sqlalchemy import select

    async with async_session_factory() as session:
        result = await session.execute(
            select(Conversation)
            .where(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
        conversation = result.scalar_one_or_none()

        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        # Get all messages
        result = await session.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
        messages = result.scalars().all()

        # Generate summary using AI
        summary = await chat_engine.summarize_conversation(messages)
        conversation.summary = summary
        await session.commit()

        return {"summary": summary}
