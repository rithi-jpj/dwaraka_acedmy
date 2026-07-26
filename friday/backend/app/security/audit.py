"""FRIDAY Audit Logger

Tracks all security-relevant events for compliance and monitoring.
Supports structured logging, retention policies, and export.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
from enum import Enum

from loguru import logger

from backend.config.settings import settings


class AuditEventType(str, Enum):
    """Types of auditable events."""
    LOGIN = "login"
    LOGOUT = "logout"
    LOGIN_FAILED = "login_failed"
    PASSWORD_CHANGE = "password_change"
    TOKEN_REFRESH = "token_refresh"
    API_CALL = "api_call"
    FILE_ACCESS = "file_access"
    FILE_DELETE = "file_delete"
    FILE_MODIFY = "file_modify"
    COMMAND_EXECUTE = "command_execute"
    COMMAND_DANGEROUS = "command_dangerous"
    SETTINGS_CHANGE = "settings_change"
    PERMISSION_CHANGE = "permission_change"
    PLUGIN_INSTALL = "plugin_install"
    PLUGIN_UNINSTALL = "plugin_uninstall"
    PLUGIN_ENABLE = "plugin_enable"
    PLUGIN_DISABLE = "plugin_disable"
    AGENT_CREATE = "agent_create"
    AGENT_DELETE = "agent_delete"
    AGENT_MODIFY = "agent_modify"
    MEMORY_ACCESS = "memory_access"
    MEMORY_DELETE = "memory_delete"
    EXPORT_DATA = "export_data"
    IMPORT_DATA = "import_data"
    ERROR = "error"
    UNKNOWN = "unknown"


class AuditLog:
    """A single audit log entry."""

    def __init__(
        self,
        event_type: AuditEventType,
        user_id: Optional[str] = None,
        username: Optional[str] = None,
        resource: Optional[str] = None,
        action: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: bool = True,
    ):
        self.id = str(uuid.uuid4())
        self.timestamp = datetime.utcnow().isoformat()
        self.event_type = event_type.value if isinstance(event_type, AuditEventType) else event_type
        self.user_id = user_id
        self.username = username
        self.resource = resource
        self.action = action
        self.details = details or {}
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.success = success

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "event_type": self.event_type,
            "user_id": self.user_id,
            "username": self.username,
            "resource": self.resource,
            "action": self.action,
            "details": self.details,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "success": self.success,
        }


class AuditLogger:
    """Centralized audit logging service.

    Writes structured audit logs to both file and the application log.
    Handles retention and rotation automatically.
    """

    def __init__(self):
        self.log_dir = Path(settings.LOGS_DIR) / "audit"
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self._current_file: Optional[Path] = None
        self._current_date: Optional[str] = None
        self._entries_since_rotation: int = 0
        self._max_entries_per_file = 10000

    def _get_log_file(self) -> Path:
        """Get the current audit log file, rotating by date."""
        today = datetime.utcnow().strftime("%Y-%m-%d")

        if today != self._current_date or self._current_file is None:
            self._current_date = today
            self._current_file = self.log_dir / f"audit-{today}.jsonl"
            self._entries_since_rotation = 0

        return self._current_file

    def log(
        self,
        event_type: AuditEventType,
        user_id: Optional[str] = None,
        username: Optional[str] = None,
        resource: Optional[str] = None,
        action: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: bool = True,
    ) -> None:
        """Record an audit log entry."""
        entry = AuditLog(
            event_type=event_type,
            user_id=user_id,
            username=username,
            resource=resource,
            action=action,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
        )

        # Write to audit log file
        try:
            log_file = self._get_log_file()
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry.to_dict()) + "\n")
            self._entries_since_rotation += 1
        except Exception as e:
            logger.error(f"Failed to write audit log: {e}")

        # Also log to application log
        log_data = entry.to_dict()
        log_msg = f"AUDIT [{entry.event_type}] user={username or 'unknown'} resource={resource or 'N/A'} success={success}"
        if success:
            logger.info(log_msg)
        else:
            logger.warning(log_msg)

    def query(
        self,
        event_type: Optional[AuditEventType] = None,
        user_id: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Query audit logs with filters.

        Simple file-based query for recent logs.
        For production, use a dedicated logging system (ELK, etc.).
        """
        results: List[Dict[str, Any]] = []
        log_files = sorted(self.log_dir.glob("audit-*.jsonl"), reverse=True)

        for log_file in log_files:
            if len(results) >= limit + offset:
                break

            file_date = log_file.stem.replace("audit-", "")
            if start_date and file_date < start_date:
                continue
            if end_date and file_date > end_date:
                continue

            try:
                with open(log_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            entry = json.loads(line)
                            if event_type and entry.get("event_type") != event_type.value:
                                continue
                            if user_id and entry.get("user_id") != user_id:
                                continue
                            results.append(entry)
                        except json.JSONDecodeError:
                            continue
            except FileNotFoundError:
                continue

        return results[offset:offset + limit]

    def get_stats(self) -> Dict[str, Any]:
        """Get audit log statistics."""
        total_entries = 0
        event_counts: Dict[str, int] = {}

        for log_file in self.log_dir.glob("audit-*.jsonl"):
            try:
                with open(log_file, "r", encoding="utf-8") as f:
                    for line in f:
                        if line.strip():
                            total_entries += 1
                            try:
                                entry = json.loads(line)
                                etype = entry.get("event_type", "unknown")
                                event_counts[etype] = event_counts.get(etype, 0) + 1
                            except json.JSONDecodeError:
                                pass
            except FileNotFoundError:
                continue

        return {
            "total_entries": total_entries,
            "event_counts": event_counts,
            "log_files": len(list(self.log_dir.glob("audit-*.jsonl"))),
            "retention_days": settings.AUDIT_LOG_RETENTION_DAYS,
        }


# Global audit logger instance
audit_logger = AuditLogger()
