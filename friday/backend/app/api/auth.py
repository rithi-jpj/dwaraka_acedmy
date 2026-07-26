"""FRIDAY Authentication API Routes

Handles user registration, login, session management,
and API key authentication.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field

from backend.database.base import get_db, async_session_factory
from backend.database.models import User, UserRole
from backend.app.security.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    get_current_user,
    TokenPayload,
)

router = APIRouter()
security = HTTPBearer()


# --- Schemas ---

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    display_name: Optional[str] = Field(None, max_length=100)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    display_name: Optional[str]
    role: str
    is_active: bool
    created_at: str

    @classmethod
    def from_orm(cls, user: User) -> "UserResponse":
        return cls(
            id=user.id,
            username=user.username,
            email=user.email,
            display_name=user.display_name,
            role=user.role.value,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
        )


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


# --- Routes ---

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """Register a new user account."""
    async with async_session_factory() as session:
        # Check if email already exists
        existing = await session.get(User, {"email": request.email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        # Check if username already exists
        from sqlalchemy import select
        result = await session.execute(select(User).where(User.username == request.username))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken",
            )

        # Create user
        user = User(
            username=request.username,
            email=request.email,
            hashed_password=hash_password(request.password),
            display_name=request.display_name or request.username,
            role=UserRole.USER,
        )
        session.add(user)
        await session.commit()

        # Generate token
        access_token, expires_in = create_access_token(user.id, user.role.value)

        return TokenResponse(
            access_token=access_token,
            expires_in=expires_in,
            user=UserResponse.from_orm(user).model_dump(),
        )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Authenticate user and return access token."""
    async with async_session_factory() as session:
        from sqlalchemy import select
        result = await session.execute(
            select(User).where(User.email == request.email)
        )
        user = result.scalar_one_or_none()

        if not user or not verify_password(request.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated",
            )

        # Update last login
        user.last_login = datetime.utcnow()
        await session.commit()

        # Generate token
        access_token, expires_in = create_access_token(user.id, user.role.value)

        return TokenResponse(
            access_token=access_token,
            expires_in=expires_in,
            user=UserResponse.from_orm(user).model_dump(),
        )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user's profile."""
    return UserResponse.from_orm(current_user)


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
):
    """Change the current user's password."""
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    current_user.hashed_password = hash_password(request.new_password)

    async with async_session_factory() as session:
        session.add(current_user)
        await session.commit()

    return {"message": "Password changed successfully"}


@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Logout (client-side token invalidation)."""
    # In a production system, you'd add the token to a blacklist
    return {"message": "Logged out successfully"}


@router.post("/verify")
async def verify_token(
    current_user: User = Depends(get_current_user),
):
    """Verify that the current token is valid."""
    return {
        "valid": True,
        "user": UserResponse.from_orm(current_user).model_dump(),
    }
