"""FRIDAY Screen Capture Module

Provides cross-platform screen capture and analysis capabilities.
"""

from __future__ import annotations

import io
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

from loguru import logger


class ScreenCapture:
    """Captures and analyzes screen content."""

    def __init__(self):
        self._last_screenshot_time = 0.0
        self._screenshot_interval = 1.0  # Minimum seconds between captures

    def capture(self) -> Tuple[Optional[bytes], int, int]:
        """Capture the current screen.

        Returns:
            Tuple of (image_bytes, width, height) or (None, 0, 0).
        """
        try:
            import pyautogui

            screenshot = pyautogui.screenshot()
            width, height = screenshot.size

            buffer = io.BytesIO()
            screenshot.save(buffer, format="PNG")
            image_bytes = buffer.getvalue()

            self._last_screenshot_time = time.time()
            return image_bytes, width, height

        except ImportError:
            logger.warning("pyautogui not available for screen capture")
            return None, 0, 0
        except Exception as e:
            logger.error(f"Screen capture failed: {e}")
            return None, 0, 0

    def capture_region(
        self,
        left: int,
        top: int,
        width: int,
        height: int,
    ) -> Optional[bytes]:
        """Capture a region of the screen.

        Args:
            left: X coordinate of region.
            top: Y coordinate of region.
            width: Width of region.
            height: Height of region.

        Returns:
            Image bytes or None on failure.
        """
        try:
            import pyautogui

            screenshot = pyautogui.screenshot(region=(left, top, width, height))

            buffer = io.BytesIO()
            screenshot.save(buffer, format="PNG")
            return buffer.getvalue()

        except Exception as e:
            logger.error(f"Region capture failed: {e}")
            return None

    def capture_active_window(self) -> Optional[bytes]:
        """Capture the currently active window.

        Returns:
            Image bytes or None on failure.
        """
        try:
            import pyautogui
            import pygetwindow as gw

            active_window = gw.getActiveWindow()
            if not active_window:
                return self.capture()[0]

            left, top = active_window.left, active_window.top
            width, height = active_window.width, active_window.height

            return self.capture_region(left, top, width, height)

        except ImportError:
            logger.warning("pygetwindow not available for window capture")
            return self.capture()[0]
        except Exception as e:
            logger.error(f"Window capture failed: {e}")
            return self.capture()[0]

    def find_element_on_screen(
        self,
        image_path: str,
        confidence: float = 0.8,
    ) -> Optional[Tuple[int, int, int, int]]:
        """Find an image on the screen using template matching.

        Args:
            image_path: Path to the template image.
            confidence: Matching confidence threshold.

        Returns:
            Bounding box (left, top, width, height) or None.
        """
        try:
            import pyautogui

            location = pyautogui.locateOnScreen(image_path, confidence=confidence)
            if location:
                return (location.left, location.top, location.width, location.height)
            return None

        except Exception as e:
            logger.error(f"Element search failed: {e}")
            return None

    def get_screen_resolution(self) -> Tuple[int, int]:
        """Get the current screen resolution.

        Returns:
            Tuple of (width, height).
        """
        try:
            import pyautogui
            width, height = pyautogui.size()
            return width, height
        except Exception:
            return (1920, 1080)  # Default fallback
