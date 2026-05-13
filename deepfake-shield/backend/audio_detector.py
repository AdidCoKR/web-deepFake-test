"""
audio_detector.py
=================
Modul deteksi deepfake audio (voice forgery detection).
Pipeline:
  1. Terima chunk audio PCM (numpy array)
  2. Librosa → Ekstrak mel-spectrogram (representasi visual suara)
  3. MobileNetV3 → Klasifikasikan REAL vs FAKE voice

Mel-spectrogram mengubah sinyal audio menjadi "gambar" frekuensi
yang bisa diklasifikasikan oleh CNN, sama seperti klasifikasi gambar biasa.
"""

import torch
import numpy as np
import librosa
import logging
from PIL import Image
import torchvision.transforms as transforms

from model_loader import model_loader, DEVICE

logger = logging.getLogger(__name__)

# --- Konfigurasi Mel-Spectrogram ---
SAMPLE_RATE     = 16000   # Sample rate audio (Hz) - standar untuk speech models
N_MELS          = 128     # Jumlah filter mel bank (resolusi frekuensi)
HOP_LENGTH      = 512     # Jumlah sample antara dua kolom spectrogram
N_FFT           = 2048    # Ukuran window FFT
DURATION        = 2.0     # Durasi chunk audio yang dianalisis (detik)
MAX_SAMPLES     = int(SAMPLE_RATE * DURATION)  # 32000 samples per chunk

# --- Transformasi untuk input MobileNetV3 ---
SPECTROGRAM_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),   # Resize spectrogram ke input size MobileNetV3
    transforms.ToTensor(),            # Konversi ke tensor [1, H, W] (grayscale)
    transforms.Normalize(
        mean=[0.5],                   # Normalisasi single channel
        std=[0.5]
    ),
])


class AudioDeepfakeDetector:
    """
    Detektor deepfake audio menggunakan Mel-Spectrogram + MobileNetV3.
    
    Cara kerja:
    - Audio chunk (PCM float32) → Mel-Spectrogram (2D matrix)
    - Spectrogram diperlakukan sebagai gambar grayscale
    - MobileNetV3 mengklasifikasikan gambar tersebut sebagai REAL/FAKE
    """

    def __init__(self):
        logger.info("✅ AudioDeepfakeDetector siap digunakan")

    def analyze_chunk(self, audio_data: np.ndarray, sample_rate: int = SAMPLE_RATE) -> dict:
        """
        Analisis chunk audio dan kembalikan skor keaslian.
        
        Args:
            audio_data : numpy array PCM float32, shape [N_samples]
            sample_rate: Sample rate audio (default 16000 Hz)
            
        Returns:
            dict dengan keys:
              - 'authenticity_score': float 0.0 (FAKE) - 1.0 (REAL)
              - 'label'             : str 'REAL' / 'FAKE' / 'UNCERTAIN'
              - 'confidence'        : float
              - 'spectrogram_shape' : tuple, dimensi spectrogram yang dihasilkan
        """
        # Resample jika sample rate berbeda dari yang diharapkan
        if sample_rate != SAMPLE_RATE:
            audio_data = librosa.resample(
                audio_data,
                orig_sr=sample_rate,
                target_sr=SAMPLE_RATE
            )

        # Pastikan panjang audio sesuai (padding/truncation)
        audio_data = self._normalize_length(audio_data)

        # Ekstrak mel-spectrogram dari audio
        spectrogram = self._extract_mel_spectrogram(audio_data)

        # Klasifikasikan spectrogram menggunakan MobileNetV3
        score = self._classify_spectrogram(spectrogram)

        return {
            "authenticity_score": round(score, 4),
            "label"             : self._score_to_label(score),
            "confidence"        : round(max(score, 1 - score), 4),
            "spectrogram_shape" : spectrogram.shape,
        }

    def _normalize_length(self, audio: np.ndarray) -> np.ndarray:
        """
        Normalisasi panjang audio chunk ke durasi tetap (2 detik).
        - Jika terlalu panjang: truncate
        - Jika terlalu pendek: padding dengan nol (silence)
        """
        if len(audio) > MAX_SAMPLES:
            # Truncate dari tengah untuk mengurangi efek silence di awal/akhir
            start = (len(audio) - MAX_SAMPLES) // 2
            return audio[start:start + MAX_SAMPLES]
        elif len(audio) < MAX_SAMPLES:
            # Padding nol di kanan
            pad_length = MAX_SAMPLES - len(audio)
            return np.pad(audio, (0, pad_length), mode='constant')
        return audio

    def _extract_mel_spectrogram(self, audio: np.ndarray) -> np.ndarray:
        """
        Konversi sinyal audio ke mel-spectrogram.
        
        Mel-spectrogram adalah representasi visual dari sinyal audio
        yang menunjukkan distribusi energi pada frekuensi tertentu seiring waktu.
        Deepfake voice sering meninggalkan artefak pada frekuensi tertentu.
        
        Returns:
            numpy array shape [N_MELS, T], nilai dalam dB
        """
        # Hitung mel-spectrogram menggunakan librosa
        mel_spec = librosa.feature.melspectrogram(
            y=audio,
            sr=SAMPLE_RATE,
            n_mels=N_MELS,        # 128 filter bank
            hop_length=HOP_LENGTH, # Step antar frame
            n_fft=N_FFT,           # FFT window size
            fmin=20,               # Frekuensi minimum (Hz) - batas pendengaran manusia
            fmax=8000              # Frekuensi maksimum (Hz) - cukup untuk speech
        )

        # Konversi ke decibel scale (lebih intuitif dan stabil untuk training)
        mel_db = librosa.power_to_db(mel_spec, ref=np.max)

        return mel_db

    def _classify_spectrogram(self, spectrogram: np.ndarray) -> float:
        """
        Klasifikasikan mel-spectrogram menggunakan MobileNetV3.
        
        Args:
            spectrogram: numpy array [N_MELS, T] dalam dB scale
            
        Returns:
            float: Skor keaslian (0.0 = FAKE, 1.0 = REAL)
        """
        # Normalisasi nilai ke range [0, 255] untuk konversi ke PIL Image
        spec_normalized = ((spectrogram - spectrogram.min()) /
                          (spectrogram.max() - spectrogram.min() + 1e-8) * 255).astype(np.uint8)

        # Konversi ke PIL Image grayscale
        pil_image = Image.fromarray(spec_normalized, mode='L')

        # Terapkan transformasi
        tensor = SPECTROGRAM_TRANSFORM(pil_image)  # Shape: [1, 224, 224]

        # Tambahkan dimensi batch
        tensor = tensor.unsqueeze(0).to(DEVICE)    # Shape: [1, 1, 224, 224]

        # Konversi ke FP16 jika pakai GPU
        if DEVICE.type == "cuda":
            tensor = tensor.half()

        # Inferensi
        with torch.no_grad():
            logits = model_loader.audio_model(tensor)   # Shape: [1, 2]
            probs  = torch.softmax(logits, dim=1)        # Probabilitas

        # Index 0 = FAKE, Index 1 = REAL
        real_prob = probs[0, 1].item()
        return real_prob

    def _score_to_label(self, score: float) -> str:
        """Konversi skor ke label teks."""
        if score >= 0.75:
            return "REAL"
        elif score <= 0.35:
            return "FAKE"
        else:
            return "UNCERTAIN"

    def analyze_bytes(self, audio_bytes: bytes, sample_rate: int = SAMPLE_RATE) -> dict:
        """
        Analisis audio dari raw bytes (dari upload file).
        
        Args:
            audio_bytes: Audio dalam format bytes (WAV/MP3/etc)
            sample_rate: Sample rate (jika diketahui)
        """
        import io
        import soundfile as sf

        # Baca audio dari bytes menggunakan soundfile
        audio_buffer = io.BytesIO(audio_bytes)
        audio_data, sr = sf.read(audio_buffer, dtype='float32')

        # Jika stereo, konversi ke mono dengan rata-rata kedua channel
        if audio_data.ndim == 2:
            audio_data = np.mean(audio_data, axis=1)

        return self.analyze_chunk(audio_data, sample_rate=sr)
