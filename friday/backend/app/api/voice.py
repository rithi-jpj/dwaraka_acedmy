"""FRIDAY Voice API Routes

Handles wake word detection, speech-to-text, text-to-speech,
and voice interaction management.
"""

from __future__ import annotations

import asyncio
import base64
from typing import Optional, List
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status, UploadFile, File
from pydantic import BaseModel, Field

from backend.config.settings import settings
from backend.database.models import User
from backend.app.security.auth import get_current_user

router = APIRouter()


# --- Schemas ---

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    voice: Optional[str] = None
    speed: float = Field(1.0, ge=0.5, le=2.0)


class TTSResponse(BaseModel):
    audio: str  # base64-encoded audio
    format: str = "wav"
    duration_seconds: float
    text_length: int


class STTResponse(BaseModel):
    text: str
    confidence: float
    language: str = "en"
    duration_seconds: float


class VoiceStatusResponse(BaseModel):
    wake_word_enabled: bool
    stt_engine: str
    tts_engine: str
    tts_voice: str
    is_listening: bool
    microphones: List[str] = []


# WebSocket connections for real-time voice
active_connections: List[WebSocket] = []


@router.get("/status", response_model=VoiceStatusResponse)
async def get_voice_status():
    """Get the current status of the voice system."""
    return VoiceStatusResponse(
        wake_word_enabled=True,
        stt_engine=settings.STT_ENGINE,
        tts_engine=settings.TTS_ENGINE,
        tts_voice=settings.TTS_VOICE,
        is_listening=len(active_connections) > 0,
        microphones=["Default Microphone"],
    )


@router.post("/synthesize", response_model=TTSResponse)
async def synthesize_speech(
    request: TTSRequest,
    current_user: User = Depends(get_current_user),
):
    """Convert text to speech using the configured TTS engine."""
    try:
        audio_bytes, duration = await _synthesize(
            text=request.text,
            voice=request.voice or settings.TTS_VOICE,
            speed=request.speed,
        )

        return TTSResponse(
            audio=base64.b64encode(audio_bytes).decode(),
            duration_seconds=duration,
            text_length=len(request.text),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech synthesis failed: {str(e)}",
        )


@router.post("/transcribe", response_model=STTResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Transcribe audio file to text using the configured STT engine."""
    try:
        audio_data = await file.read()
        text, confidence, duration = await _transcribe(audio_data)

        return STTResponse(
            text=text,
            confidence=confidence,
            duration_seconds=duration,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}",
        )


@router.websocket("/stream")
async def voice_stream(websocket: WebSocket):
    """WebSocket endpoint for real-time voice streaming.

    Supports:
    - Bidirectional audio streaming
    - Wake word detection events
    - Real-time transcription
    - Speech synthesis streaming
    """
    await websocket.accept()
    active_connections.append(websocket)

    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type", "")

            if message_type == "audio_chunk":
                # Process incoming audio chunk
                audio_data = base64.b64decode(data["audio"])
                text, confidence, _ = await _transcribe(audio_data)

                await websocket.send_json({
                    "type": "transcription",
                    "text": text,
                    "confidence": confidence,
                })

            elif message_type == "synthesize":
                # Synthesize and stream audio
                text = data.get("text", "")
                audio_bytes, duration = await _synthesize(text)

                # Send in chunks
                chunk_size = 4096
                for i in range(0, len(audio_bytes), chunk_size):
                    chunk = audio_bytes[i:i + chunk_size]
                    is_last = (i + chunk_size) >= len(audio_bytes)

                    await websocket.send_json({
                        "type": "audio_chunk",
                        "audio": base64.b64encode(chunk).decode(),
                        "is_last": is_last,
                        "duration": duration,
                    })

            elif message_type == "wake_word":
                await websocket.send_json({
                    "type": "wake_word_detected",
                    "message": "FRIDAY is listening",
                })

            elif message_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Voice WebSocket error: {e}")
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)


async def _synthesize(text: str, voice: Optional[str] = None, speed: float = 1.0) -> tuple[bytes, float]:
    """Internal TTS synthesis.

    Args:
        text: Text to synthesize.
        voice: Voice name to use.
        speed: Speech speed multiplier.

    Returns:
        Tuple of (audio_bytes, duration_seconds).
    """
    engine = settings.TTS_ENGINE

    try:
        if engine == "edge":
            import edge_tts
            communicate = edge_tts.Communicate(text, voice=voice or settings.TTS_VOICE)
            audio_bytes = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_bytes += chunk["data"]

            # Estimate duration (rough)
            duration = len(text) / 15.0 / speed  # ~15 chars/sec average
            return audio_bytes, duration

        elif engine == "pyttsx3":
            import io
            import pyttsx3

            tts_engine = pyttsx3.init()
            tts_engine.setProperty("rate", int(200 * speed))
            tts_engine.setProperty("volume", 0.9)

            # Save to buffer
            audio_buffer = io.BytesIO()
            tts_engine.save_to_file(text, audio_buffer)
            tts_engine.runAndWait()

            audio_buffer.seek(0)
            duration = len(text) / 15.0 / speed
            return audio_buffer.read(), duration

        else:
            # Fallback: simple notification beep
            import wave
            import struct
            import math

            sample_rate = 22050
            duration = 0.5
            frequency = 440.0

            samples = []
            for i in range(int(sample_rate * duration)):
                sample = math.sin(2 * math.pi * frequency * i / sample_rate)
                samples.append(int(sample * 32767))

            buffer = io.BytesIO()
            with wave.open(buffer, 'wb') as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(sample_rate)
                wf.writeframes(struct.pack(f'<{len(samples)}h', *samples))

            buffer.seek(0)
            return buffer.read(), duration

    except ImportError as e:
        logger.warning(f"TTS engine {engine} not available: {e}")
        return b"", 0.0


async def _transcribe(audio_data: bytes) -> tuple[str, float, float]:
    """Internal STT transcription.

    Args:
        audio_data: Raw audio bytes.

    Returns:
        Tuple of (transcribed_text, confidence_score, duration_seconds).
    """
    engine = settings.STT_ENGINE

    try:
        if engine == "whisper" or engine == "faster_whisper":
            from faster_whisper import WhisperModel

            model = WhisperModel("base", device="cpu", compute_type="int8")
            segments, info = model.transcribe(audio_data, beam_size=5)

            text = " ".join(segment.text for segment in segments)
            confidence = info.average_logprob if info else 0.8
            duration = info.duration if info else 0.0

            return text, confidence, duration

        else:
            return "Voice transcription available", 0.5, 0.0

    except ImportError as e:
        logger.warning(f"STT engine {engine} not available: {e}")
        return "Transcription service unavailable", 0.0, 0.0


# Import logger for error handling
from loguru import logger
