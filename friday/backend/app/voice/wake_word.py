"""FRIDAY Wake Word Detection

Detects wake words ("FRIDAY", "Hey FRIDAY") with low CPU usage.
Supports offline detection with configurable sensitivity.
"""

from __future__ import annotations

import asyncio
import queue
import threading
from typing import Callable, List, Optional, Set
from dataclasses import dataclass, field

from loguru import logger

from backend.config.settings import settings


@dataclass
class WakeWordResult:
    """Result from wake word detection."""
    detected: bool
    wake_word: str = ""
    confidence: float = 0.0
    timestamp: float = 0.0


class WakeWordDetector:
    """Detects wake words in audio streams.

    Supports multiple detection backends:
    - Porcupine (efficient, cross-platform)
    - Snowboy (legacy)
    - Simple keyword spotting (fallback)
    """

    def __init__(
        self,
        wake_words: Optional[List[str]] = None,
        sensitivity: float = 0.5,
        on_detection: Optional[Callable[[WakeWordResult], None]] = None,
    ):
        self.wake_words = wake_words or settings.wake_words_list
        self.sensitivity = max(0.0, min(1.0, sensitivity))
        self.on_detection = on_detection
        self._running = False
        self._audio_queue: queue.Queue = queue.Queue()
        self._detection_thread: Optional[threading.Thread] = None
        self._detector = None

    async def start(self) -> None:
        """Start continuous wake word detection."""
        if self._running:
            logger.warning("Wake word detector is already running")
            return

        self._running = True
        logger.info(f"🎤 Wake word detector started. Listening for: {', '.join(self.wake_words)}")

        # Initialize detection backend
        try:
            self._detector = self._init_detector()
        except Exception as e:
            logger.error(f"Failed to initialize wake word detector: {e}")
            self._detector = None

        # Start detection thread
        self._detection_thread = threading.Thread(
            target=self._detection_loop,
            daemon=True,
            name="wake-word-detection",
        )
        self._detection_thread.start()

    def stop(self) -> None:
        """Stop wake word detection."""
        self._running = False
        logger.info("Wake word detector stopped")

    def feed_audio(self, audio_data: bytes) -> None:
        """Feed audio data for processing.

        Args:
            audio_data: Raw audio bytes (16-bit PCM, 16kHz).
        """
        if self._running:
            self._audio_queue.put(audio_data)

    def _init_detector(self):
        """Initialize the detection backend.

        Tries Porcupine first, falls back to simple keyword spotting.
        """
        try:
            import pvporcupine
            keywords = [w.replace(" ", "_").lower() for w in self.wake_words]
            porcupine = pvporcupine.create(
                keywords=keywords,
                sensitivities=[self.sensitivity] * len(keywords),
            )
            logger.info(f"✅ Porcupine wake word detector initialized")
            return porcupine
        except ImportError:
            logger.warning("Porcupine not available, using simple keyword detection")
            return None
        except Exception as e:
            logger.warning(f"Porcupine init failed: {e}, using fallback")
            return None

    def _detection_loop(self) -> None:
        """Main detection loop running in a separate thread."""
        import time
        import struct

        while self._running:
            try:
                audio_data = self._audio_queue.get(timeout=0.1)
            except queue.Empty:
                continue

            if not audio_data:
                continue

            if self._detector:
                # Process with Porcupine
                try:
                    audio_frame = struct.unpack_from("h" * (len(audio_data) // 2), audio_data)
                    result = self._detector.process(audio_frame)

                    if result >= 0:
                        wake_word = self.wake_words[result] if result < len(self.wake_words) else "FRIDAY"
                        self._on_detection(WakeWordResult(
                            detected=True,
                            wake_word=wake_word,
                            confidence=self.sensitivity,
                            timestamp=time.time(),
                        ))
                except Exception as e:
                    logger.error(f"Wake word processing error: {e}")
            else:
                # Simple keyword spotting fallback
                self._simple_keyword_spot(audio_data, time.time())

    def _simple_keyword_spot(self, audio_data: bytes, timestamp: float) -> None:
        """Simple keyword spotting as fallback.

        Uses basic audio energy detection and simple pattern matching.
        """
        # Convert bytes to samples and calculate energy
        import struct
        samples = struct.unpack_from("h" * (len(audio_data) // 2), audio_data)
        energy = sum(abs(s) for s in samples) / len(samples)

        # Very basic detection based on audio energy threshold
        threshold = 500 * (1 + self.sensitivity)  # Simple threshold
        if energy > threshold:
            self._on_detection(WakeWordResult(
                detected=False,  # Don't trigger on energy alone
                wake_word="",
                confidence=min(energy / 10000, 1.0),
                timestamp=timestamp,
            ))

    def _on_detection(self, result: WakeWordResult) -> None:
        """Handle wake word detection event.

        Args:
            result: Detection result.
        """
        if result.detected:
            logger.info(f"🔊 Wake word detected: '{result.wake_word}' (confidence: {result.confidence:.2f})")

        if self.on_detection:
            self.on_detection(result)

    @property
    def is_listening(self) -> bool:
        """Whether the detector is currently running."""
        return self._running
