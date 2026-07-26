"""FRIDAY Encryption Module

Provides encryption/decryption for sensitive data at rest.
Uses Fernet (AES-128-CBC) for symmetric encryption.
"""

from __future__ import annotations

import base64
import os
from pathlib import Path
from typing import Optional, Union

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from loguru import logger

from backend.config.settings import settings


def _get_fernet() -> Fernet:
    """Get or create a Fernet encryption instance.

    Uses the configured encryption key, or derives one from the
    application secret key.
    """
    key = settings.ENCRYPTION_KEY
    if not key:
        # Derive a key from the secret key
        salt = b"friday-encryption-salt"
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(
            kdf.derive(settings.SECRET_KEY.encode())
        )
        return Fernet(key)

    return Fernet(key.encode() if isinstance(key, str) else key)


def generate_key() -> str:
    """Generate a new Fernet encryption key."""
    return Fernet.generate_key().decode()


def encrypt_data(data: str) -> str:
    """Encrypt a string and return base64-encoded ciphertext."""
    f = _get_fernet()
    return f.encrypt(data.encode()).decode()


def decrypt_data(encrypted_data: str) -> str:
    """Decrypt base64-encoded ciphertext back to original string."""
    f = _get_fernet()
    return f.decrypt(encrypted_data.encode()).decode()


def encrypt_file(file_path: Union[str, Path]) -> Path:
    """Encrypt a file in-place and return the path.

    The original file is replaced with its encrypted version.
    """
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    f = _get_fernet()
    data = file_path.read_bytes()
    encrypted = f.encrypt(data)
    file_path.write_bytes(encrypted)
    logger.debug(f"Encrypted file: {file_path}")
    return file_path


def decrypt_file(file_path: Union[str, Path]) -> Path:
    """Decrypt a file in-place and return the path.

    The encrypted file is replaced with its decrypted version.
    """
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    f = _get_fernet()
    data = file_path.read_bytes()
    decrypted = f.decrypt(data)
    file_path.write_bytes(decrypted)
    logger.debug(f"Decrypted file: {file_path}")
    return file_path


class SecureStorage:
    """Secure key-value storage for credentials and sensitive data.

    Data is encrypted at rest in a JSON file.
    """

    def __init__(self, storage_path: Optional[Path] = None):
        self.storage_path = storage_path or Path(settings.DATA_DIR) / "secure_storage.enc"
        self._data: dict = {}
        self._load()

    def _load(self) -> None:
        """Load and decrypt stored data."""
        if self.storage_path.exists():
            try:
                encrypted = self.storage_path.read_text()
                if encrypted.strip():
                    decrypted = decrypt_data(encrypted)
                    import json
                    self._data = json.loads(decrypted)
            except Exception as e:
                logger.error(f"Failed to load secure storage: {e}")
                self._data = {}
        else:
            self._data = {}

    def _save(self) -> None:
        """Encrypt and save data to disk."""
        import json
        data_json = json.dumps(self._data)
        encrypted = encrypt_data(data_json)
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        self.storage_path.write_text(encrypted)

    def set(self, key: str, value: str) -> None:
        """Store a value securely."""
        self._data[key] = value
        self._save()

    def get(self, key: str) -> Optional[str]:
        """Retrieve a stored value."""
        return self._data.get(key)

    def delete(self, key: str) -> bool:
        """Delete a stored value."""
        if key in self._data:
            del self._data[key]
            self._save()
            return True
        return False

    def list_keys(self) -> list[str]:
        """List all stored keys."""
        return list(self._data.keys())

    def clear(self) -> None:
        """Clear all stored data."""
        self._data = {}
        self._save()
