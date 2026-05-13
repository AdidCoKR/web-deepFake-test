"""
model_loader.py
===============
Singleton pattern untuk memuat semua model AI sekali saat startup.
Mencegah OOM (Out of Memory) pada VRAM 4GB RTX 3050 Ti dengan
manajemen memori yang ketat dan Mixed Precision (FP16).
"""

# ============================================================
# PENTING: Set cache directory SEBELUM import timm/huggingface
# Ini menghindari PermissionError di Windows saat timm mencoba
# menulis ke C:\Users\..\.cache\huggingface yang diblokir ACL.
# ============================================================
import os
from pathlib import Path

# Gunakan folder 'models/hf_cache' di dalam project sebagai cache
_PROJECT_ROOT = Path(__file__).parent
_HF_CACHE_DIR = str(_PROJECT_ROOT / "models" / "hf_cache")

# Set env var SEBELUM huggingface_hub / timm diinisialisasi
os.environ["HF_HOME"]               = _HF_CACHE_DIR
os.environ["HUGGINGFACE_HUB_CACHE"] = _HF_CACHE_DIR
os.environ["TORCH_HOME"]            = str(_PROJECT_ROOT / "models" / "torch_cache")

# Pastikan direktori cache ada
Path(_HF_CACHE_DIR).mkdir(parents=True, exist_ok=True)
Path(os.environ["TORCH_HOME"]).mkdir(parents=True, exist_ok=True)
# ============================================================

import torch
import timm
from transformers import pipeline
import logging

# Konfigurasi logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Konfigurasi Global ---
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_DIR = Path(__file__).parent / "models"
MODEL_DIR.mkdir(exist_ok=True)

# Nama model EfficientNet yang digunakan (bisa diganti ke efficientnet_b3 jika VRAM kurang)
EFFICIENTNET_VARIANT = "efficientnet_b4"
NUM_CLASSES = 2  # [REAL, FAKE]


class ModelLoader:
    """
    Singleton class untuk mengelola semua model AI.
    Memastikan model hanya dimuat satu kali ke VRAM.
    """
    _instance = None          # Referensi singleton
    _face_model = None        # Model klasifikasi wajah deepfake
    _audio_model = None       # Model klasifikasi suara deepfake
    _is_initialized = False   # Flag apakah sudah diinisialisasi

    def __new__(cls):
        """Implementasi singleton: hanya buat satu instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def initialize(self):
        """
        Muat semua model ke device (GPU/CPU).
        Dipanggil sekali saat startup FastAPI.
        """
        if self._is_initialized:
            logger.info("Models sudah diinisialisasi, skip loading.")
            return

        logger.info(f"🚀 Menginisialisasi ModelLoader pada device: {DEVICE}")
        self._log_device_info()

        # Muat model klasifikasi wajah
        self._face_model = self._load_face_model()

        # Muat model klasifikasi audio (CNN sederhana)
        self._audio_model = self._load_audio_model()

        self._is_initialized = True
        logger.info("✅ Semua model berhasil dimuat!")

    def _log_device_info(self):
        """Tampilkan informasi GPU/CUDA untuk debugging."""
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            vram_total = torch.cuda.get_device_properties(0).total_memory / 1024**3
            logger.info(f"🎮 GPU Terdeteksi: {gpu_name}")
            logger.info(f"💾 VRAM Total: {vram_total:.1f} GB")
        else:
            logger.warning("⚠️ CUDA tidak tersedia. Menggunakan CPU (performa lebih lambat).")

    def _load_face_model(self):
        """
        Muat model pre-trained Deepfake & AI Image Detection dari HuggingFace.
        Kita menggunakan dima806/deepfake_vs_real_image_detection yang sangat bagus
        untuk mendeteksi AI generatif (Midjourney/Flux).
        """
        model_name = "dima806/deepfake_vs_real_image_detection"
        logger.info(f"📦 Memuat model AI dari HuggingFace: {model_name}...")

        try:
            device_id = 0 if DEVICE.type == "cuda" else -1
            model_pipeline = pipeline(
                "image-classification",
                model=model_name,
                device=device_id,
                top_k=2  # Return semua kelas (Real dan Fake)
            )
            logger.info(f"✅ Model {model_name} berhasil dimuat!")
            return model_pipeline
        except Exception as e:
            logger.error(f"❌ Gagal memuat model HuggingFace: {e}")
            raise e

    def _load_audio_model(self) -> torch.nn.Module:
        """
        Muat model CNN sederhana untuk analisis spektrogram audio.
        Menggunakan MobileNetV3-Small untuk efisiensi VRAM.
        """
        logger.info("📦 Memuat model audio: mobilenetv3_small_100...")

        # MobileNetV3 lebih ringan dari EfficientNet, cocok untuk audio spectrogram
        model = timm.create_model(
            "mobilenetv3_small_100",
            pretrained=True,
            num_classes=NUM_CLASSES,
            in_chans=1  # Spectrogram adalah grayscale (1 channel)
        )

        model.eval()
        model = model.to(DEVICE)

        if DEVICE.type == "cuda":
            model = model.half()
            logger.info("✅ Model audio: FP16 (half-precision) diaktifkan")

        logger.info("✅ Model audio 'MobileNetV3-Small' siap digunakan")
        return model

    @property
    def face_model(self):
        """Akses model wajah yang sudah dimuat."""
        if not self._is_initialized:
            raise RuntimeError("ModelLoader belum diinisialisasi! Panggil .initialize() dulu.")
        return self._face_model

    @property
    def audio_model(self) -> torch.nn.Module:
        """Akses model audio yang sudah dimuat."""
        if not self._is_initialized:
            raise RuntimeError("ModelLoader belum diinisialisasi! Panggil .initialize() dulu.")
        return self._audio_model

    @property
    def device(self) -> torch.device:
        """Kembalikan device yang sedang digunakan (cuda/cpu)."""
        return DEVICE

    def get_vram_usage(self) -> dict:
        """
        Kembalikan informasi penggunaan VRAM saat ini.
        Berguna untuk monitoring di endpoint /api/health.
        """
        if DEVICE.type != "cuda":
            return {"available": False, "reason": "CUDA not available"}

        allocated = torch.cuda.memory_allocated(0) / 1024**3   # GB
        reserved  = torch.cuda.memory_reserved(0) / 1024**3    # GB
        total     = torch.cuda.get_device_properties(0).total_memory / 1024**3

        return {
            "available": True,
            "gpu_name": torch.cuda.get_device_name(0),
            "vram_total_gb": round(total, 2),
            "vram_allocated_gb": round(allocated, 3),
            "vram_reserved_gb": round(reserved, 3),
            "vram_free_gb": round(total - reserved, 3),
        }


# Instance singleton global - diimport oleh modul lain
model_loader = ModelLoader()
