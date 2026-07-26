"""FRIDAY Authentication & Authorization Module

Handles password hashing, JWT token management, and user session validation.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Optional, Tuple

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from backend.config.settings import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security_scheme = HTTPBearer()


class TokenPayload(BaseModel):
    """JWT token payload structure."""
    sub: str  # User ID
    role: str  # User role
    exp: datetime  # Expiration
    iat: datetime  # Issued at
    jti: str  # Token ID (unique, for revocation)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    user_id: str,
    role: str = "user",
    expires_in_hours: Optional[int] = None,
) -> Tuple[str, int]:
    """Create a JWT access token.

    Returns:
        Tuple of (token_string, expires_in_seconds)
    """
    if expires_in_hours is None:
        expires_in_hours = settings.TOKEN_EXPIRY_HOURS

    expires_in_seconds = expires_in_hours * 3600
    now = datetime.utcnow()
    expires = now + timedelta(hours=expires_in_hours)

    payload = {
        "sub": user_id,
        "role": role,
        "exp": expires,
        "iat": now,
        "jti": str(uuid.uuid4()),
    }

    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm="HS256",
    )

    return token, expires_in_seconds


def decode_access_token(token: str) -> TokenPayload:
    """Decode and validate a JWT access token.

    Raises:
        HTTPException: If token is invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"],
        )
        return TokenPayload(
            sub=payload["sub"],
            role=payload["role"],
            exp=datetime.fromtimestamp(payload["exp"]),
            iat=datetime.fromtimestamp(payload["iat"]),
            jti=payload["jti"],
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> "User":  # type: ignore
    """FastAPI dependency: Get the currently authenticated user.

    Requires a valid Bearer token in the Authorization header.
    """
    from backend.database.base import async_session_factory
    from backend.database.models import User
    from sqlalchemy import select

    token_payload = decode_access_token(credentials.credentials)

    async with async_session_factory() as session:
        result = await session.execute(
            select(User).where(User.id == token_payload.sub)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated",
            )

        return user


async def get_admin_user(
    current_user: User = Depends(get_current_user),  # type: ignore
) -> "User":  # type: ignore
    """FastAPI dependency: Require admin role."""
    from backend.database.models import UserRole

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user
