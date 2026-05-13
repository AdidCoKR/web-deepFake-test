# 🛡️ Deepfake Shield — Real-Time Detection & Education Hub

Platform deteksi deepfake berbasis AI yang berjalan secara lokal dengan akselerasi GPU.

**Hardware Target**: ASUS TUF · i7-12700H · RTX 3050 Ti · 16GB RAM  
**CUDA**: 12.1 · PyTorch 2.2.2 · EfficientNet-B4 + MediaPipe

---

## 🏗️ Struktur Proyek

```
deepfake-shield/
├── backend/          # Python FastAPI + AI Engine (port 8000)
│   ├── main.py              # Entry point + WebSocket server
│   ├── detector.py          # Face deepfake detection (EfficientNet + MediaPipe)
│   ├── audio_detector.py    # Audio deepfake detection (Librosa + MobileNetV3)
│   ├── model_loader.py      # CUDA model management (singleton)
│   ├── requirements.txt     # Python dependencies
│   └── utils/
│       ├── frame_processor.py
│       └── audio_processor.py
│
└── frontend/         # Next.js 14 + Tailwind CSS (port 3000)
    ├── src/
    │   ├── app/             # App Router pages
    │   ├── components/      # UI components
    │   ├── hooks/           # Custom hooks (WebSocket, Camera)
    │   ├── lib/             # MDX utilities
    │   └── content/         # MDX educational articles
    └── package.json
```

---

## ⚡ Quick Start

### Langkah 1: Setup Backend

```powershell
# Masuk ke direktori backend
cd backend

# Buat virtual environment Python
python -m venv venv
.\venv\Scripts\activate

# Install PyTorch dengan CUDA 12.1 (WAJIB duluan)
pip install torch==2.2.2+cu121 torchvision==0.17.2+cu121 --index-url https://download.pytorch.org/whl/cu121

# Install dependensi lainnya
pip install -r requirements.txt

# Jalankan backend server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend akan tersedia di: `http://localhost:8000`  
API Docs: `http://localhost:8000/docs`

### Langkah 2: Setup Frontend

```powershell
# Masuk ke direktori frontend
cd frontend

# Install dependensi Node.js
npm install

# Jalankan dev server
npm run dev
```

Frontend akan tersedia di: `http://localhost:3000`

---

## 🎮 Cara Penggunaan

### Dashboard Deteksi Real-time
1. Buka `http://localhost:3000/dashboard`
2. Pastikan backend online (indikator hijau di Navbar)
3. Klik **"Mulai Kamera"** → Izinkan akses kamera
4. Skor keaslian akan tampil secara real-time

### Analisis Audio
1. Di panel Audio Analyzer (kanan dashboard)
2. Klik **"Upload Audio"**
3. Pilih file WAV/MP3/OGG/FLAC
4. Hasil analisis tampil dalam hitungan detik

### Modul Edukasi
- Kunjungi `http://localhost:3000/learn`
- Baca 3 bab panduan deepfake literacy

---

## 🔧 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET`  | `/api/health` | Status server + info VRAM GPU |
| `POST` | `/api/analyze/audio` | Upload audio file untuk analisis |
| `GET`  | `/api/reset` | Reset temporal smoothing buffer |
| `WS`   | `/ws/video` | WebSocket real-time video analysis |

### WebSocket Protocol

**Client → Server** (setiap 100ms):
```json
{ "frame": "data:image/jpeg;base64,/9j/..." }
```

**Server → Client** (respons tiap frame):
```json
{
  "authenticity_score": 0.85,
  "smoothed_score": 0.82,
  "faces_detected": 1,
  "face_boxes": [[120, 80, 200, 240]],
  "label": "REAL",
  "confidence": 0.85,
  "processing_time_ms": 42.5
}
```

---

## 🧠 Arsitektur AI

```
Frame Video (WebCam)
        │
        ▼
MediaPipe Face Detection     ← CPU (tidak butuh GPU)
        │
        ▼
Crop & Preprocess Wajah      ← Resize 224x224, normalize
        │
        ▼
EfficientNet-B4 (FP16)       ← GPU CUDA (RTX 3050 Ti)
        │
        ▼
Softmax → [P(FAKE), P(REAL)]
        │
        ▼
Temporal Smoothing           ← Rolling average 10 frame
        │
        ▼
WebSocket → Frontend
```

**Audio Pipeline:**
```
Audio Chunk (2 detik)
        │
        ▼
Librosa Mel-Spectrogram      ← CPU
        │
        ▼
MobileNetV3-Small (FP16)     ← GPU CUDA
        │
        ▼
[P(FAKE), P(REAL)]
```

---

## ⚠️ Troubleshooting

### "CUDA out of memory"
- Ganti `EFFICIENTNET_VARIANT = "efficientnet_b3"` di `model_loader.py`
- Kurangi resolusi kamera di `useCamera.ts` (480p → 360p)

### "ModuleNotFoundError: mediapipe"
```powershell
pip install mediapipe==0.10.14
```

### Backend tidak bisa diakses dari frontend
- Pastikan backend berjalan di port 8000
- Cek firewall Windows tidak memblokir port tersebut
- Coba `http://127.0.0.1:8000/api/health` di browser

### Model terlalu lambat di CPU
- Pastikan PyTorch CUDA terinstall dengan benar: `python -c "import torch; print(torch.cuda.is_available())"`
- Harus output `True`

---

## 📚 Dataset untuk Fine-tuning (Opsional)

Untuk akurasi produksi terbaik, fine-tune model pada:
- **FaceForensics++**: [github.com/ondyari/FaceForensics](https://github.com/ondyari/FaceForensics)
- **DFDC (DeepFake Detection Challenge)**: [ai.facebook.com/datasets/dfdc](https://ai.facebook.com/datasets/dfdc/)
- **Celeb-DF**: Dataset deepfake berkualitas tinggi

---

## 📄 Lisensi

Proyek ini untuk keperluan edukasi dan penelitian. Jangan digunakan untuk membuat atau menyebarkan konten deepfake yang merugikan.
