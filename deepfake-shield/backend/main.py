"""
main.py
=======
Entry point untuk Deepfake Shield Backend.
Mengelola:
  - FastAPI application lifecycle (startup/shutdown)
  - WebSocket endpoint untuk streaming video frame
  - REST endpoint untuk upload dan analisis audio
  - CORS middleware untuk komunikasi dengan frontend Next.js
  - Health check endpoint dengan info GPU

Jalankan dengan:
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import cv2
import json
import base64
import logging
import asyncio
import numpy as np
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import torch

# Import modul internal
from model_loader import model_loader
from detector import FaceDeepfakeDetector
from audio_detector import AudioDeepfakeDetector

# Konfigurasi logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# --- Instance Global Detektor ---
# Dibuat sebagai variabel module-level agar tersedia di semua endpoint
face_detector: Optional[FaceDeepfakeDetector]  = None
audio_detector: Optional[AudioDeepfakeDetector] = None


# ========================================
# Lifecycle Management (Startup & Shutdown)
# ========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Konteks manager untuk lifecycle aplikasi FastAPI.
    - Startup: Muat semua model AI ke GPU
    - Shutdown: Bersihkan memori GPU
    """
    global face_detector, audio_detector

    # === STARTUP ===
    logger.info("🚀 Deepfake Shield Backend starting up...")
    logger.info("📦 Memuat model AI ke GPU... (mungkin butuh 30-60 detik pertama kali)")

    # Inisialisasi model loader (muat weights ke VRAM)
    model_loader.initialize()

    # Buat instance detektor
    face_detector  = FaceDeepfakeDetector()
    audio_detector = AudioDeepfakeDetector()

    logger.info("✅ Backend siap menerima koneksi!")
    logger.info("📡 WebSocket: ws://localhost:8000/ws/video")
    logger.info("🎵 Audio API: POST http://localhost:8000/api/analyze/audio")
    logger.info("🏥 Health:    GET  http://localhost:8000/api/health")

    yield  # ← Aplikasi berjalan di sini

    # === SHUTDOWN ===
    logger.info("🛑 Shutting down Deepfake Shield Backend...")

    # Bersihkan cache GPU untuk membebaskan VRAM
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        logger.info("✅ VRAM GPU berhasil dibersihkan")


# ========================================
# FastAPI App Instance
# ========================================

app = FastAPI(
    title="Deepfake Shield API",
    description="Real-time deepfake detection backend powered by EfficientNet + MediaPipe",
    version="1.0.0",
    lifespan=lifespan  # Gunakan lifecycle manager baru (bukan @app.on_event yang deprecated)
)

# --- CORS Middleware ---
# Izinkan frontend Next.js (localhost:3000) mengakses backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",    # Next.js dev server
        "http://127.0.0.1:3000",   # Alternatif localhost
        "http://localhost:3001",    # Port alternatif jika 3000 busy
    ],
    allow_credentials=True,
    allow_methods=["*"],            # Izinkan semua HTTP method
    allow_headers=["*"],            # Izinkan semua header
)


# ========================================
# REST Endpoints
# ========================================

@app.get("/api/health")
async def health_check():
    """
    Endpoint health check.
    Mengembalikan status server, info GPU, dan penggunaan VRAM.
    Frontend menggunakan ini untuk menampilkan status koneksi.
    """
    vram_info = model_loader.get_vram_usage()

    return JSONResponse({
        "status"         : "online",
        "version"        : "1.0.0",
        "models_loaded"  : True,
        "cuda_available" : torch.cuda.is_available(),
        "vram_info"      : vram_info,
    })


@app.post("/api/analyze/audio")
async def analyze_audio(file: UploadFile = File(...)):
    """
    Endpoint untuk menganalisis file audio dan mendeteksi deepfake suara.
    
    Menerima file audio (WAV, MP3, OGG, FLAC) via multipart form.
    Frontend mengirim chunk audio setiap beberapa detik.
    
    Returns:
        JSON dengan authenticity_score, label, dan confidence.
    """
    if audio_detector is None:
        raise HTTPException(status_code=503, detail="Audio detector belum siap")

    # Validasi tipe file
    allowed_types = ["audio/wav", "audio/mpeg", "audio/ogg", "audio/flac", "audio/mp4"]
    if file.content_type not in allowed_types:
        # Coba tetap proses meskipun content type tidak diketahui
        logger.warning(f"Content type tidak dikenal: {file.content_type}, mencoba proses...")

    # Baca bytes dari file upload
    audio_bytes = await file.read()

    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="File audio kosong")

    logger.info(f"📤 Menerima audio: {file.filename}, ukuran: {len(audio_bytes)/1024:.1f} KB")

    # Analisis audio
    result = audio_detector.analyze_bytes(audio_bytes)

    logger.info(f"🎵 Audio result: score={result['authenticity_score']:.3f}, label={result['label']}")

    return JSONResponse(result)


@app.post("/api/analyze/image")
async def analyze_image(file: UploadFile = File(...)):
    """
    Endpoint untuk menganalisis file gambar (foto) dan mendeteksi deepfake wajah.

    Menerima file gambar (JPG, PNG, WEBP, BMP) via multipart form.

    Returns:
        JSON dengan authenticity_score, label, confidence, faces_detected, dan processing_time_ms.
    """
    import time

    if face_detector is None:
        raise HTTPException(status_code=503, detail="Face detector belum siap")

    # Baca bytes dari file upload
    image_bytes = await file.read()

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="File gambar kosong")

    logger.info(f"🖼️  Menerima gambar: {file.filename}, ukuran: {len(image_bytes)/1024:.1f} KB")

    # Decode bytes → numpy array → BGR frame (OpenCV)
    frame_array = np.frombuffer(image_bytes, dtype=np.uint8)
    frame_bgr   = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)

    if frame_bgr is None:
        raise HTTPException(status_code=400, detail="Gagal membaca file gambar. Pastikan format valid (JPG/PNG/WEBP)")

    # ⚠️ PENTING: Reset temporal buffer sebelum analisis foto
    # Supaya skor dari sesi kamera sebelumnya tidak mencemari hasil foto
    face_detector.reset_temporal_buffer()

    # Jalankan deteksi wajah deepfake
    start_time = time.perf_counter()

    result = await asyncio.get_event_loop().run_in_executor(
        None,
        face_detector.process_frame,
        frame_bgr
    )

    processing_ms = (time.perf_counter() - start_time) * 1000
    result["processing_time_ms"] = round(processing_ms, 2)
    result["filename"] = file.filename

    logger.info(
        f"🖼️  Image result: score={result['authenticity_score']:.3f}, "
        f"label={result['label']}, faces={result['faces_detected']}"
    )

    return JSONResponse(result)


@app.get("/api/reset")
async def reset_detectors():
    """
    Reset temporal smoothing buffer pada face detector.
    Berguna ketika user mengganti sumber video.
    """
    if face_detector:
        face_detector.reset_temporal_buffer()
    return {"status": "reset", "message": "Temporal buffer direset"}


# ========================================
# WebSocket Endpoint - Video Streaming
# ========================================

@app.websocket("/ws/video")
async def websocket_video_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint untuk real-time video analysis.
    
    Protokol komunikasi:
    CLIENT → SERVER: JSON dengan base64-encoded JPEG frame
      { "frame": "data:image/jpeg;base64,/9j/..." }
    
    SERVER → CLIENT: JSON dengan hasil deteksi
      {
        "authenticity_score": 0.85,
        "smoothed_score"    : 0.82,
        "faces_detected"    : 1,
        "face_boxes"        : [[x, y, w, h]],
        "label"             : "REAL",
        "confidence"        : 0.85,
        "processing_time_ms": 45.2
      }
    """
    # Terima koneksi WebSocket
    await websocket.accept()
    client_host = websocket.client.host
    logger.info(f"🔌 WebSocket terhubung dari: {client_host}")

    import time  # Import lokal untuk mengukur waktu proses

    try:
        while True:
            # --- Terima Data dari Client ---
            try:
                # Terima pesan JSON dari frontend
                data = await websocket.receive_text()
                message = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "error": "Format JSON tidak valid"
                }))
                continue

            # Validasi ada key 'frame' dalam pesan
            if "frame" not in message:
                await websocket.send_text(json.dumps({
                    "error": "Key 'frame' tidak ditemukan dalam pesan"
                }))
                continue

            # --- Decode Frame Base64 → OpenCV BGR ---
            frame_data_url = message["frame"]  # Format: "data:image/jpeg;base64,/9j/..."

            # Hapus prefix "data:image/...;base64," dari data URL
            if "," in frame_data_url:
                frame_b64 = frame_data_url.split(",", 1)[1]
            else:
                frame_b64 = frame_data_url

            # Decode base64 → bytes → numpy array
            frame_bytes  = base64.b64decode(frame_b64)
            frame_array  = np.frombuffer(frame_bytes, dtype=np.uint8)
            frame_bgr    = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)

            if frame_bgr is None:
                await websocket.send_text(json.dumps({
                    "error": "Gagal decode frame gambar"
                }))
                continue

            # --- Proses Frame dengan Face Detector ---
            start_time = time.perf_counter()

            # Jalankan deteksi di thread pool agar tidak blocking event loop
            result = await asyncio.get_event_loop().run_in_executor(
                None,                          # ThreadPoolExecutor default
                face_detector.process_frame,   # Fungsi yang dijalankan
                frame_bgr                       # Argumen fungsi
            )

            end_time = time.perf_counter()
            processing_ms = (end_time - start_time) * 1000

            # Tambahkan informasi waktu proses ke hasil
            result["processing_time_ms"] = round(processing_ms, 2)

            # --- Kirim Hasil ke Client ---
            await websocket.send_text(json.dumps(result))

    except WebSocketDisconnect:
        # Client memutus koneksi (normal behavior)
        logger.info(f"🔌 WebSocket terputus dari: {client_host}")

    except Exception as e:
        # Error tidak terduga
        logger.error(f"❌ Error WebSocket dari {client_host}: {e}", exc_info=True)
        try:
            await websocket.send_text(json.dumps({
                "error": f"Internal server error: {str(e)}"
            }))
        except Exception:
            pass  # Ignore jika koneksi sudah terputus


# ========================================
# Main Entry Point
# ========================================

if __name__ == "__main__":
    import uvicorn

    # Jalankan server dengan konfigurasi optimal
    uvicorn.run(
        "main:app",
        host="0.0.0.0",    # Dengarkan semua interface
        port=8000,
        reload=False,      # Matikan reload untuk produksi (aktifkan saat dev: True)
        workers=1,         # Satu worker untuk berbagi model di memori GPU
        log_level="info"
    )
