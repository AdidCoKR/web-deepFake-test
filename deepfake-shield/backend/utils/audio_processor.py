"""
audio_processor.py
==================
Utilitas untuk preprocessing audio chunk sebelum dianalisis.
"""

import numpy as np
import librosa
import io
import soundfile as sf
from typing import Tuple, Optional


def bytes_to_audio(audio_bytes: bytes) -> Tuple[np.ndarray, int]:
    """
    Konversi bytes audio ke numpy array PCM.
    Mendukung format: WAV, MP3, OGG, FLAC.
    
    Returns:
        Tuple (audio_array float32 mono, sample_rate)
    """
    buffer = io.BytesIO(audio_bytes)

    # Coba baca dengan soundfile terlebih dahulu
    try:
        audio, sr = sf.read(buffer, dtype='float32')
    except Exception:
        # Fallback ke librosa (lebih lambat tapi mendukung lebih banyak format)
        buffer.seek(0)
        audio, sr = librosa.load(buffer, sr=None, mono=True)
        return audio, sr

    # Konversi stereo ke mono jika diperlukan
    if audio.ndim == 2:
        audio = np.mean(audio, axis=1)

    return audio, sr


def normalize_audio(audio: np.ndarray) -> np.ndarray:
    """
    Normalisasi amplitudo audio ke range [-1.0, 1.0].
    Mencegah saturasi dan memastikan konsistensi input model.
    """
    max_val = np.max(np.abs(audio))
    if max_val > 0:
        audio = audio / max_val
    return audio


def split_audio_chunks(
    audio: np.ndarray,
    sample_rate: int,
    chunk_duration: float = 2.0,
    overlap: float = 0.5
) -> list:
    """
    Bagi audio panjang menjadi chunks kecil dengan overlap.
    
    Args:
        audio         : Array audio PCM
        sample_rate   : Sample rate (Hz)
        chunk_duration: Durasi setiap chunk (detik)
        overlap       : Overlap antar chunk (detik)
        
    Returns:
        List of numpy arrays, masing-masing adalah satu chunk
    """
    chunk_samples = int(chunk_duration * sample_rate)
    hop_samples   = int((chunk_duration - overlap) * sample_rate)
    
    chunks = []
    start = 0

    while start + chunk_samples <= len(audio):
        chunk = audio[start:start + chunk_samples]
        chunks.append(chunk)
        start += hop_samples

    # Tambahkan sisa audio jika belum masuk (dengan padding)
    if start < len(audio):
        remainder = audio[start:]
        padded = np.pad(remainder, (0, chunk_samples - len(remainder)))
        chunks.append(padded)

    return chunks
