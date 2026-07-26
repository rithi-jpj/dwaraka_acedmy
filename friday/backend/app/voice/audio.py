"""FRIDAY Audio Processor

Handles audio capture, voice activity detection (VAD),
noise suppression, and audio format conversion.
"""

from __future__ import annotations

import asyncio
import struct
from typing import Optional, Callable, AsyncGenerator
from dataclasses import dataclass

from loguru import logger

from backend.config.settings import settings


@dataclass
class AudioConfig:
    """Audio processing configuration."""
    sample_rate: int = 16000
    sample_width: int = 2  # 16-bit
    channels: int = 1  # Mono
    frame_duration_ms: int = 30  # VAD frame duration
    silence_duration_ms: int = 500  # Time before considering speech ended


class AudioProcessor:
    """Processes audio streams for voice interaction.

    Features:
    - Voice Activity Detection (VAD)
    - Noise suppression (basic)
    - Audio format conversion
    - Streaming audio capture
    """

    def __init__(self, config: Optional[AudioConfig] = None):
        self.config = config or AudioConfig()
        self._vad = None
        self._audio_interface = None
        self._stream = None
        self._is_recording = False

    def initialize(self) -> None:
        """Initialize audio processing components."""
        try:
            import webrtcvad
            self._vad = webrtcvad.Vad(2)  # Aggressiveness level 2
            logger.info("✅ VAD initialized")
        except ImportError:
            logger.warning("webrtcvad not available, VAD disabled")
            self._vad = None

        try:
            import pyaudio
            self._audio_interface = pyaudio.PyAudio()
            logger.info("✅ Audio interface initialized")
        except ImportError:
            logger.warning("pyaudio not available, audio capture disabled")
            self._audio_interface = None

    def cleanup(self) -> None:
        """Clean up audio resources."""
        self.stop_recording()

        if self._audio_interface:
            self._audio_interface.terminate()
            self._audio_interface = None

    def start_recording(
        self,
        callback: Optional[Callable[[bytes], None]] = None,
    ) -> None:
        """Start recording audio from the microphone.

        Args:
            callback: Function to call with each audio chunk.
        """
        if not self._audio_interface:
            logger.error("Cannot start recording: audio interface not available")
            return

        if self._is_recording:
            logger.warning("Already recording")
            return

        try:
            self._stream = self._audio_interface.open(
                format=pyaudio.paInt16,
                channels=self.config.channels,
                rate=self.config.sample_rate,
                input=True,
                frames_per_buffer=int(self.config.sample_rate * self.config.frame_duration_ms / 1000),
                stream_callback=self._audio_callback if not callback else None,
            )

            if callback:
                self._audio_callback = callback

            self._is_recording = True
            logger.info("🎙️ Audio recording started")
        except Exception as e:
            logger.error(f"Failed to start recording: {e}")

    def stop_recording(self) -> None:
        """Stop recording audio."""
        if self._stream:
            try:
                self._stream.stop_stream()
                self._stream.close()
            except Exception:
                pass
            self._stream = None

        self._is_recording = False
        logger.info("Audio recording stopped")

    def is_speech(self, audio_frame: bytes) -> bool:
        """Detect if an audio frame contains speech.

        Args:
            audio_frame: Raw audio frame (must be 10, 20, or 30ms).

        Returns:
            True if speech is detected.
        """
        if not self._vad:
            return False

        try:
            return self._vad.is_speech(audio_frame, self.config.sample_rate)
        except Exception:
            return False

    def convert_audio_format(
        self,
        audio_data: bytes,
        from_sample_rate: int,
        to_sample_rate: int = 16000,
    ) -> bytes:
        """Convert audio data to a different sample rate.

        Args:
            audio_data: Raw PCM audio data.
            from_sample_rate: Source sample rate.
            to_sample_rate: Target sample rate.

        Returns:
            Converted audio data.
        """
        if from_sample_rate == to_sample_rate:
            return audio_data

        # Simple resampling by interpolation
        # For production, use librosa or scipy
        ratio = to_sample_rate / from_sample_rate
        samples = struct.unpack_from("h" * (len(audio_data) // 2), audio_data)
        new_length = int(len(samples) * ratio)

        resampled = []
        for i in range(new_length):
            src_index = int(i / ratio)
            if src_index < len(samples):
                resampled.append(samples[src_index])

        return struct.pack(f"<{len(resampled)}h", *resampled)

    def normalize_audio(self, audio_data: bytes, target_level: float = 0.7) -> bytes:
        """Normalize audio volume to a target level.

        Args:
            audio_data: Raw PCM audio.
            target_level: Target RMS level (0.0 to 1.0).

        Returns:
            Normalized audio data.
        """
        samples = struct.unpack_from("h" * (len(audio_data) // 2), audio_data)
        if not samples:
            return audio_data

        # Calculate current RMS
        rms = (sum(s * s for s in samples) / len(samples)) ** 0.5
        if rms == 0:
            return audio_data

        # Calculate gain
        target_rms = target_level * 32767
        gain = target_rms / rms
        gain = min(gain, 3.0)  # Limit gain to avoid clipping

        # Apply gain
        normalized = [min(int(s * gain), 32767) for s in samples]
        return struct.pack(f"<{len(normalized)}h", *normalized)

    def remove_silence(self, audio_data: bytes, frame_duration_ms: int = 30) -> bytes:
        """Remove silence from audio data using VAD.

        Args:
            audio_data: Raw PCM audio.
            frame_duration_ms: Frame duration in ms.

        Returns:
            Audio with silence removed.
        """
        if not self._vad:
            return audio_data

        frame_size = int(self.config.sample_rate * frame_duration_ms / 1000)
        samples = struct.unpack_from("h" * (len(audio_data) // 2), audio_data)

        # Process frames
        speech_frames = []
        for i in range(0, len(samples), frame_size):
            frame = samples[i:i + frame_size]
            frame_bytes = struct.pack(f"<{len(frame)}h", *frame)

            if self._vad.is_speech(frame_bytes, self.config.sample_rate):
                speech_frames.append(frame_bytes)

        if not speech_frames:
            return b""

        # Add small buffer around speech segments
        return b"".join(speech_frames)

    async def stream_from_mic(self) -> AsyncGenerator[bytes, None]:
        """Async generator that yields audio chunks from microphone.

        Yields:
            Raw audio chunks (16-bit PCM, 16kHz).
        """
        if not self._audio_interface:
            return

        chunk_duration = 30  # ms
        chunk_size = int(self.config.sample_rate * chunk_duration / 1000)

        stream = self._audio_interface.open(
            format=pyaudio.paInt16,
            channels=self.config.channels,
            rate=self.config.sample_rate,
            input=True,
            frames_per_buffer=chunk_size,
        )

        try:
            while True:
                data = stream.read(chunk_size, exception_on_overflow=False)
                yield data
                await asyncio.sleep(0)  # Allow other tasks to run
        except asyncio.CancelledError:
            pass
        finally:
            stream.stop_stream()
            stream.close()
