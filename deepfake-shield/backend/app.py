"""
app.py - Entry point untuk Hugging Face Spaces
===============================================
Versi backend yang dioptimalkan untuk HF Spaces:
- Tanpa WebSocket (diganti HTTP polling dari frontend)
- CORS terbuka untuk domain Vercel
- Graceful fallback jika model gagal dimuat

Deploy: Upload folder backend/ ke HF Spaces sebagai Gradio/Docker App.
"""

import cv2
import json
import base64
import logging
import asyncio
import numpy as np
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import torch

# Import modul internal
from model_loader import model_loader
from detector import FaceDeepfakeDetector
from audio_detector import AudioDeepfakeDetector

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

face_detector: Optional[FaceDeepfakeDetector]  = None
audio_detector: Optional[AudioDeepfakeDetector] = None
startup_error: Optional[str] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global face_detector, audio_detector, startup_error

    logger.info("🚀 Deepfake Shield Backend (HF Spaces) starting...")

    try:
        model_loader.initialize()
        face_detector  = FaceDeepfakeDetector()
        audio_detector = AudioDeepfakeDetector()
        logger.info("✅ Semua model berhasil dimuat!")
    except Exception as e:
        startup_error = str(e)
        logger.error(f"❌ Gagal memuat model: {e}")

    yield

    if torch.cuda.is_available():
        torch.cuda.empty_cache()


app = FastAPI(
    title="Deepfake Shield API",
    description="Real-time deepfake detection — hosted on Hugging Face Spaces",
    version="2.0.0",
    lifespan=lifespan
)

# CORS: Izinkan Vercel + localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Vercel generates random preview URLs, so allow all
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health Check ───────────────────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    if startup_error:
        return JSONResponse({
            "status"        : "error",
            "error"         : startup_error,
            "models_loaded" : False,
        }, status_code=500)

    return JSONResponse({
        "status"        : "online",
        "version"       : "2.0.0",
        "models_loaded" : face_detector is not None,
        "cuda_available": torch.cuda.is_available(),
        "device"        : str(model_loader.device),
    })


# ─── Analisis Gambar / Frame ─────────────────────────────────────────────────

@app.post("/api/analyze/image")
async def analyze_image(file: UploadFile = File(...)):
    """
    Analisis gambar untuk deteksi deepfake.
    Frontend mengirim frame kamera atau foto upload ke endpoint ini.
    Setiap foto upload di-reset buffer-nya agar tidak tercampur dengan foto sebelumnya.
    """
    import time

    if face_detector is None:
        raise HTTPException(
            status_code=503,
            detail=startup_error or "Face detector belum siap. Coba lagi dalam beberapa detik."
        )

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="File gambar kosong")

    frame_array = np.frombuffer(image_bytes, dtype=np.uint8)
    frame_bgr   = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)

    if frame_bgr is None:
        raise HTTPException(status_code=400, detail="Format gambar tidak valid (gunakan JPG/PNG/WEBP)")

    # ✅ FIX: Reset temporal buffer sebelum analisis foto baru
    # Mencegah score foto sebelumnya mencemari hasil foto saat ini
    face_detector.reset_temporal_buffer()

    start = time.perf_counter()

    result = await asyncio.get_event_loop().run_in_executor(
        None, face_detector.process_frame, frame_bgr
    )

    result["processing_time_ms"] = round((time.perf_counter() - start) * 1000, 2)
    result["filename"] = file.filename or "frame.jpg"
    result["mode"] = "image"

    return JSONResponse(result)


@app.post("/api/analyze/frame")
async def analyze_frame_base64(request: dict):
    """
    Analisis frame kamera yang dikirim sebagai base64 JSON.
    Digunakan sebagai pengganti WebSocket untuk polling dari frontend.

    Body: { "frame": "data:image/jpeg;base64,/9j/..." }
    """
    import time

    if face_detector is None:
        raise HTTPException(status_code=503, detail="Detektor belum siap")

    frame_data_url = request.get("frame", "")
    if not frame_data_url:
        raise HTTPException(status_code=400, detail="Key 'frame' tidak ditemukan")

    # Hapus prefix data URL
    if "," in frame_data_url:
        frame_b64 = frame_data_url.split(",", 1)[1]
    else:
        frame_b64 = frame_data_url

    try:
        frame_bytes = base64.b64decode(frame_b64)
        frame_array = np.frombuffer(frame_bytes, dtype=np.uint8)
        frame_bgr   = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)
    except Exception:
        raise HTTPException(status_code=400, detail="Gagal decode frame base64")

    if frame_bgr is None:
        raise HTTPException(status_code=400, detail="Gagal membaca gambar dari frame")

    start  = time.perf_counter()
    result = await asyncio.get_event_loop().run_in_executor(
        None, face_detector.process_frame, frame_bgr
    )
    result["processing_time_ms"] = round((time.perf_counter() - start) * 1000, 2)

    return JSONResponse(result)


# ─── Audio Analysis ──────────────────────────────────────────────────────────

@app.post("/api/analyze/audio")
async def analyze_audio(file: UploadFile = File(...)):
    if audio_detector is None:
        raise HTTPException(status_code=503, detail="Audio detector belum siap")

    audio_bytes = await file.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="File audio kosong")

    result = audio_detector.analyze_bytes(audio_bytes)
    return JSONResponse(result)


# ─── Reset Buffer ─────────────────────────────────────────────────────────────

@app.get("/api/reset")
async def reset():
    if face_detector:
        face_detector.reset_temporal_buffer()
    return {"status": "reset"}


# ─── Root ─────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name"   : "Deepfake Shield API",
        "status" : "online",
        "docs"   : "/docs",
        "health" : "/api/health",
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))  # HF Spaces default port
    uvicorn.run("app:app", host="0.0.0.0", port=port, log_level="info")
