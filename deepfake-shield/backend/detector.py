"""
detector.py
===========
Core engine deteksi deepfake wajah secara real-time.
Menggunakan pipeline 2 tahap:
  1. MediaPipe Face Mesh → Deteksi & crop wajah dari frame
  2. EfficientNet-B4     → Klasifikasi REAL vs FAKE per wajah

Mendukung temporal smoothing untuk mengurangi false positive
pada stream video yang bergerak cepat.
"""

import cv2
import torch
import numpy as np
import mediapipe as mp
import logging
from collections import deque
from typing import Optional
from PIL import Image
import torchvision.transforms as transforms

from model_loader import model_loader, DEVICE

logger = logging.getLogger(__name__)

# --- Konfigurasi MediaPipe Face Mesh ---
MP_FACE_MESH = mp.solutions.face_mesh
MP_DRAWING   = mp.solutions.drawing_utils
MP_STYLES    = mp.solutions.drawing_styles

# --- Transformasi gambar untuk input EfficientNet ---
# ImageNet normalization + resize ke 224x224
FACE_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),          # EfficientNet-B4 input size
    transforms.ToTensor(),                   # [H,W,C] uint8 → [C,H,W] float32
    transforms.Normalize(                    # Normalisasi ImageNet
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])

# Padding (%) di sekitar bounding box wajah agar konteks wajah lebih lengkap
FACE_PADDING_RATIO = 0.20

# Jumlah frame untuk temporal smoothing (rolling average) - 15 frame sesuai permintaan
TEMPORAL_WINDOW = 15


class FaceDeepfakeDetector:
    """
    Detektor deepfake wajah berbasis MediaPipe + EfficientNet.
    
    Cara kerja:
    - Terima frame BGR dari OpenCV
    - MediaPipe deteksi wajah & ekstrak bounding box
    - EfficientNet klasifikasikan setiap wajah sebagai REAL/FAKE
    - Temporal smoothing untuk stabilitas score
    """

    def __init__(self):
        # Inisialisasi MediaPipe Face Detection (lebih cepat dari Face Mesh untuk bounding box)
        self.face_detection = mp.solutions.face_detection.FaceDetection(
            model_selection=1,        # Model 1 = full-range (jarak jauh), 0 = short-range
            min_detection_confidence=0.6
        )

        # Buffer rolling untuk temporal smoothing score
        self._score_buffer: deque = deque(maxlen=TEMPORAL_WINDOW)

        # Score terakhir yang sudah di-smooth
        self.last_smoothed_score: float = 0.5

        logger.info("✅ FaceDeepfakeDetector siap digunakan")

    def process_frame(self, frame_bgr: np.ndarray) -> dict:
        """
        Proses satu frame video dan kembalikan hasil deteksi.
        
        Args:
            frame_bgr: Frame dari OpenCV dalam format BGR, shape [H, W, 3]
            
        Returns:
            dict dengan keys:
              - 'authenticity_score': float 0.0 (FAKE) - 1.0 (REAL)
              - 'smoothed_score'    : float, hasil temporal smoothing
              - 'faces_detected'   : int, jumlah wajah terdeteksi
              - 'face_boxes'       : list of [x, y, w, h] dalam pixel
              - 'label'            : str, 'REAL' / 'FAKE' / 'UNCERTAIN'
              - 'confidence'       : float, confidence tertinggi
        """
        h, w = frame_bgr.shape[:2]

        # Konversi BGR → RGB (MediaPipe butuh RGB)
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

        # --- Step 1: Deteksi Wajah dengan MediaPipe ---
        results = self.face_detection.process(frame_rgb)

        # Jika tidak ada wajah terdeteksi, kembalikan nilai netral
        if not results.detections:
            return self._empty_result()

        face_boxes    = []
        face_scores   = []

        # --- Step 2: Proses Setiap Wajah yang Terdeteksi ---
        for detection in results.detections:
            # Ekstrak bounding box relatif (0.0 - 1.0) dari MediaPipe
            bbox = detection.location_data.relative_bounding_box

            # Konversi ke koordinat piksel
            x = int(bbox.xmin * w)
            y = int(bbox.ymin * h)
            bw = int(bbox.width * w)
            bh = int(bbox.height * h)

            # Skip wajah yang terlalu kecil (< 40x40 px) — crop kecil tidak akurat
            if bw < 40 or bh < 40:
                logger.debug(f"⏭️ Skip wajah terlalu kecil: {bw}x{bh}px")
                continue

            # Tambahkan padding di sekitar wajah
            pad_x = int(bw * FACE_PADDING_RATIO)
            pad_y = int(bh * FACE_PADDING_RATIO)

            # Pastikan koordinat tidak keluar dari batas frame
            x1 = max(0, x - pad_x)
            y1 = max(0, y - pad_y)
            x2 = min(w, x + bw + pad_x)
            y2 = min(h, y + bh + pad_y)

            # Crop region wajah dari frame RGB
            face_crop = frame_rgb[y1:y2, x1:x2]

            # Skip jika crop kosong (edge case)
            if face_crop.size == 0:
                continue

            # Jalankan model untuk klasifikasi pada crop wajah
            score = self._classify_image(face_crop)
            face_scores.append(score)
            face_boxes.append([x1, y1, x2 - x1, y2 - y1])

        # --- Step 3: Evaluasi Full Frame ---
        # Untuk AI Generatif modern (Midjourney/Flux), konteks background seringkali 
        # lebih mudah dideteksi palsu daripada crop wajah.
        full_frame_score = self._classify_image(frame_rgb)
        
        # --- Sistem Penilaian Agresif ---
        # Kumpulkan semua score (Full Frame + Wajah)
        all_scores = [full_frame_score] + face_scores
        
        # Ambil nilai probabilitas REAL terkecil (artinya paling FAKE).
        # Jika salah satu komponen (background/wajah) terdeteksi palsu, anggap palsu.
        representative_score = float(min(all_scores))
        
        logger.info(
            f"📊 Skor: Full Frame={full_frame_score:.3f}, Wajah={[round(s,3) for s in face_scores]} "
            f"-> Final Score={representative_score:.3f}"
        )

        # Tambahkan ke buffer temporal smoothing
        self._score_buffer.append(representative_score)

        # Hitung rata-rata dari buffer (temporal smoothing)
        smoothed = float(np.mean(self._score_buffer))
        self.last_smoothed_score = smoothed

        # Untuk mode foto (buffer=1), pakai raw score langsung
        effective_score = representative_score if len(self._score_buffer) == 1 else smoothed
        
        # Hitung jumlah total wajah dari MediaPipe
        total_faces = len(face_boxes)

        return {
            "authenticity_score": round(representative_score, 4),
            "smoothed_score"    : round(effective_score, 4),
            "faces_detected"    : total_faces,
            "face_boxes"        : face_boxes,
            "label"             : self._score_to_label(effective_score),
            "confidence"        : round(max(effective_score, 1 - effective_score), 4),
        }

    def _classify_image(self, rgb_image: np.ndarray) -> float:
        """
        Klasifikasikan gambar menggunakan HuggingFace Pipeline (dima806).
        
        Args:
            rgb_image: Format RGB numpy array (Bisa berupa crop wajah ATAU full frame)
            
        Returns:
            float: Skor keaslian (0.0 = pasti FAKE, 1.0 = pasti REAL)
        """
        # Konversi numpy array → PIL Image
        pil_image = Image.fromarray(rgb_image)

        try:
            results = model_loader.face_model(pil_image)
            
            real_prob = None
            fake_prob = None
            
            for res in results:
                lbl = str(res.get('label', '')).strip().lower()
                score = float(res.get('score', 0.5))
                
                is_real = lbl in ['real', '1', 'label_1'] or 'real' in lbl
                is_fake = lbl in ['fake', '0', 'label_0'] or 'fake' in lbl or 'ai' in lbl or 'manipulated' in lbl
                
                if is_real and not is_fake:
                    real_prob = score
                elif is_fake:
                    fake_prob = score
            
            # Normalisasi probabilitas jika salah satu kosong
            if real_prob is not None and fake_prob is None:
                fake_prob = 1.0 - real_prob
            elif fake_prob is not None and real_prob is None:
                real_prob = 1.0 - fake_prob
            elif real_prob is None and fake_prob is None:
                real_prob = 0.5
                
            return float(real_prob)
            
        except Exception as e:
            logger.error(f"Error inferensi pipeline HF: {e}")
            return 0.5

    def _score_to_label(self, score: float) -> str:
        """
        Konversi skor numerik menjadi label teks dengan Logic Thresholding Dinamis.
        """
        # score = probabilitas REAL (0.0 = pasti FAKE, 1.0 = pasti REAL)
        # Sesuai instruksi: "Berikan label Uncertain/Suspicious jika skor 
        # berada di rentang 0.4 - 0.7"
        
        if score > 0.70:
            return "REAL"
        elif 0.40 <= score <= 0.70:
            return "UNCERTAIN"
        else:
            return "FAKE"

    def _empty_result(self) -> dict:
        """Kembalikan hasil kosong ketika tidak ada wajah terdeteksi."""
        return {
            "authenticity_score": 0.5,
            "smoothed_score"    : self.last_smoothed_score,
            "faces_detected"    : 0,
            "face_boxes"        : [],
            "label"             : "NO_FACE",
            "confidence"        : 0.0,
        }

    def reset_temporal_buffer(self):
        """Reset buffer temporal smoothing. Berguna saat sumber video berganti."""
        self._score_buffer.clear()
        self.last_smoothed_score = 0.5
        logger.info("Buffer temporal smoothing direset.")
