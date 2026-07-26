"""FRIDAY Files API Routes

Provides secure file operations: upload, download,
browse, search, and manage files.
"""

from __future__ import annotations

import io
import os
import shutil
from pathlib import Path
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel

from backend.config.settings import settings
from backend.database.models import User
from backend.app.security.auth import get_current_user

router = APIRouter()

# Base directory for user files
USER_FILES_DIR = Path(settings.DATA_DIR) / "user_files"


class FileInfo(BaseModel):
    name: str
    path: str
    size: int
    is_directory: bool
    modified_at: str
    created_at: str
    extension: str = ""


class FileListResponse(BaseModel):
    files: List[FileInfo]
    path: str
    total: int
    total_size: int


@router.get("/list", response_model=FileListResponse)
async def list_files(
    path: str = Query("/", description="Directory path"),
    show_hidden: bool = False,
    current_user: User = Depends(get_current_user),
):
    """List files in a directory."""
    safe_path = _get_safe_path(path, current_user.id)

    if not safe_path.exists() or not safe_path.is_dir():
        raise HTTPException(status_code=404, detail="Directory not found")

    files = []
    total_size = 0

    for item in safe_path.iterdir():
        if item.name.startswith(".") and not show_hidden:
            continue

        try:
            stat = item.stat()
            is_dir = item.is_dir()
            size = stat.st_size if not is_dir else 0
            total_size += size

            files.append(FileInfo(
                name=item.name,
                path=str(item.relative_to(USER_FILES_DIR / current_user.id)).replace("\\", "/"),
                size=size,
                is_directory=is_dir,
                modified_at=datetime.fromtimestamp(stat.st_mtime).isoformat(),
                created_at=datetime.fromtimestamp(stat.st_ctime).isoformat(),
                extension=item.suffix[1:] if item.suffix else "",
            ))
        except OSError:
            continue

    files.sort(key=lambda f: (not f.is_directory, f.name.lower()))

    return FileListResponse(
        files=files,
        path=path,
        total=len(files),
        total_size=total_size,
    )


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    path: str = Form("/"),
    current_user: User = Depends(get_current_user),
):
    """Upload a file to the user's directory."""
    safe_path = _get_safe_path(path, current_user.id)

    if not safe_path.exists():
        safe_path.mkdir(parents=True, exist_ok=True)

    file_path = safe_path / file.filename

    try:
        content = await file.read()
        file_path.write_bytes(content)
        return {
            "message": "File uploaded successfully",
            "name": file.filename,
            "size": len(content),
            "path": str(file_path.relative_to(USER_FILES_DIR / current_user.id)).replace("\\", "/"),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}",
        )


@router.get("/download")
async def download_file(
    path: str = Query(..., description="File path"),
    current_user: User = Depends(get_current_user),
):
    """Download a file."""
    safe_path = _get_safe_path(path, current_user.id)

    if not safe_path.exists() or not safe_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=str(safe_path),
        filename=safe_path.name,
        media_type="application/octet-stream",
    )


@router.delete("/delete")
async def delete_file(
    path: str = Query(..., description="File or directory path"),
    recursive: bool = False,
    current_user: User = Depends(get_current_user),
):
    """Delete a file or directory."""
    safe_path = _get_safe_path(path, current_user.id)

    if not safe_path.exists():
        raise HTTPException(status_code=404, detail="Path not found")

    try:
        if safe_path.is_file():
            safe_path.unlink()
        elif safe_path.is_dir():
            if recursive:
                shutil.rmtree(safe_path)
            else:
                safe_path.rmdir()
        return {"message": f"Deleted: {path}"}
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


@router.post("/mkdir")
async def create_directory(
    path: str = Query(..., description="Directory path"),
    current_user: User = Depends(get_current_user),
):
    """Create a new directory."""
    safe_path = _get_safe_path(path, current_user.id)

    try:
        safe_path.mkdir(parents=True, exist_ok=True)
        return {"message": f"Directory created: {path}"}
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"Create directory failed: {str(e)}")


@router.post("/rename")
async def rename_file(
    old_path: str = Query(...),
    new_path: str = Query(...),
    current_user: User = Depends(get_current_user),
):
    """Rename or move a file or directory."""
    safe_old = _get_safe_path(old_path, current_user.id)
    safe_new = _get_safe_path(new_path, current_user.id)

    if not safe_old.exists():
        raise HTTPException(status_code=404, detail="Source not found")

    try:
        safe_old.rename(safe_new)
        return {"message": f"Renamed: {old_path} -> {new_path}"}
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"Rename failed: {str(e)}")


def _get_safe_path(requested_path: str, user_id: str) -> Path:
    """Resolve and validate a file path to prevent directory traversal.

    Args:
        requested_path: The path requested by the user.
        user_id: The user's unique ID.

    Returns:
        A safe, resolved Path object.

    Raises:
        HTTPException: If path traversal is detected.
    """
    user_dir = USER_FILES_DIR / user_id
    user_dir.mkdir(parents=True, exist_ok=True)

    # Normalize the requested path
    clean_path = requested_path.lstrip("/").replace("\\", "/")

    # Resolve to prevent directory traversal
    try:
        safe_path = (user_dir / clean_path).resolve()
        safe_path_str = str(safe_path)

        # Ensure the path is within the user's directory
        user_dir_str = str(user_dir.resolve())
        if not safe_path_str.startswith(user_dir_str) and str(user_dir) not in safe_path.parents:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: path traversal detected",
            )

        return safe_path
    except (ValueError, RuntimeError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid path",
        )
