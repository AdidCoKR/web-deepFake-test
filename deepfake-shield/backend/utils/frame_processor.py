"""
frame_processor.py
==================
Utilitas untuk preprocessing frame video sebelum dimasukkan ke model.
Termasuk: resize, quality enhancement, dan konversi format.
"""

import cv2
import numpy as np
from typing import Tuple, Optional


def decode_base64_frame(b64_string: str) -> Optional[np.ndarray]:
    """
    Decode string base64 menjadi frame OpenCV BGR.
    
    Args:
        b64_string: String base64 (dengan atau tanpa data URL prefix)
        
    Returns:
        numpy array [H, W, 3] BGR, atau None jika gagal
    """
    import base64

    # Hapus prefix data URL jika ada
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]

    try:
        # Decode base64 → bytes → numpy
        raw_bytes = base64.b64decode(b64_string)
        arr = np.frombuffer(raw_bytes, dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return frame
    except Exception:
        return None


def preprocess_frame(
    frame: np.ndarray,
    target_size: Tuple[int, int] = (640, 480),
    enhance_quality: bool = True
) -> np.ndarray:
    """
    Preprocess frame video untuk optimasi deteksi.
    
    Args:
        frame       : Frame BGR dari OpenCV
        target_size : (width, height) target untuk resize
        enhance_quality: Terapkan CLAHE untuk perbaikan kontras
        
    Returns:
        Frame BGR yang sudah dipreprocess
    """
    # Resize frame jika terlalu besar (menghemat waktu proses)
    h, w = frame.shape[:2]
    target_w, target_h = target_size

    # Hanya resize jika lebih besar dari target
    if w > target_w or h > target_h:
        frame = cv2.resize(frame, target_size, interpolation=cv2.INTER_LINEAR)

    # CLAHE (Contrast Limited Adaptive Histogram Equalization)
    # Meningkatkan kontras lokal untuk membantu deteksi wajah
    if enhance_quality:
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)  # Konversi ke LAB color space
        l_channel, a, b = cv2.split(lab)

        # Terapkan CLAHE hanya pada channel L (luminance/kecerahan)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_enhanced = clahe.apply(l_channel)

        # Gabungkan kembali channel
        enhanced_lab = cv2.merge([l_enhanced, a, b])
        frame = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    return frame


def draw_detection_overlay(
    frame: np.ndarray,
    face_boxes: list,
    label: str,
    score: float
) -> np.ndarray:
    """
    Gambar bounding box dan label deteksi di atas frame.
    
    Args:
        frame    : Frame BGR
        face_boxes: List of [x, y, w, h] dalam piksel
        label    : Label deteksi ('REAL', 'FAKE', 'UNCERTAIN')
        score    : Skor keaslian (0.0 - 1.0)
        
    Returns:
        Frame dengan overlay
    """
    # Pilih warna berdasarkan label
    color_map = {
        "REAL"     : (0, 255, 100),    # Hijau neon
        "FAKE"     : (0, 50, 255),      # Merah
        "UNCERTAIN": (0, 165, 255),     # Oranye
        "NO_FACE"  : (128, 128, 128),   # Abu-abu
    }
    color = color_map.get(label, (255, 255, 255))

    # Gambar bounding box untuk setiap wajah
    for (x, y, w, h) in face_boxes:
        # Bounding box utama
        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)

        # Label teks di atas bounding box
        label_text = f"{label} {score:.0%}"
        cv2.putText(
            frame, label_text,
            (x, max(y - 10, 10)),        # Posisi: di atas bbox, minimal y=10
            cv2.FONT_HERSHEY_SIMPLEX,     # Font
            0.7,                           # Scale
            color,                         # Warna
            2,                             # Tebal
            cv2.LINE_AA                    # Anti-aliasing
        )

    return frame
