# 🛡️ Deepfake Shield — Real-Time Detection & Education Hub

Platform deteksi deepfake berbasis AI yang berjalan secara lokal dengan akselerasi GPU. Repositori ini berisi kode lengkap untuk mendeteksi video dan audio deepfake secara real-time, serta portal edukasi interaktif.

**Hardware Target yang Disarankan**: PC/Laptop dengan GPU Nvidia (misal: RTX 3050 Ti atau lebih baik)  
**Tumpukan Teknologi (Tech Stack)**:
- **Backend**: Python, FastAPI, PyTorch (CUDA 12.1), MediaPipe, timm (EfficientNet-B4), Librosa (MobileNetV3)
- **Frontend**: Next.js 14, React, Tailwind CSS, TypeScript

---

## 🏗️ Struktur Proyek

Kode utama aplikasi berada di dalam folder `deepfake-shield/`.

```
deepfake-shield/
├── backend/          # Python FastAPI + AI Engine (berjalan di port 8000)
│   ├── main.py              # Entry point + WebSocket server
│   ├── detector.py          # Face deepfake detection (EfficientNet + MediaPipe)
│   ├── audio_detector.py    # Audio deepfake detection (Librosa + MobileNetV3)
│   ├── model_loader.py      # CUDA model management (singleton)
│   ├── requirements.txt     # Python dependencies
│   └── utils/               # Pemrosesan frame video & audio
│
└── frontend/         # Next.js 14 + Tailwind CSS (berjalan di port 3000)
    ├── src/
    │   ├── app/             # App Router pages (Dashboard, Home)
    │   ├── components/      # UI components (CameraFeed, AudioAnalyzer)
    │   ├── hooks/           # Custom hooks (WebSocket, Camera)
    │   ├── lib/             # MDX utilities
    │   └── content/         # MDX educational articles
    └── package.json
```

> **Catatan Penting**: Folder `backend/models/hf_cache/` yang berisi file model berukuran besar sengaja dikecualikan dari repositori ini (.gitignore) karena batasan limit ukuran file GitHub. Model akan diunduh otomatis oleh script saat pertama kali backend dijalankan.

---

## ⚡ Quick Start

Untuk menjalankan proyek ini di komputermu, ikuti langkah-langkah di bawah ini. Buka dua terminal terpisah untuk menjalankan Backend dan Frontend secara bersamaan.

### Langkah 1: Setup Backend (Terminal 1)

```powershell
# Masuk ke direktori backend
cd deepfake-shield/backend

# Buat virtual environment Python (disarankan)
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Mac/Linux

# Install PyTorch dengan dukungan CUDA (Sangat disarankan agar performa cepat)
pip install torch==2.2.2+cu121 torchvision==0.17.2+cu121 --index-url https://download.pytorch.org/whl/cu121

# Install dependensi AI dan server lainnya
pip install -r requirements.txt

# Jalankan backend server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend akan tersedia di: `http://localhost:8000`  
Dokumentasi API interaktif: `http://localhost:8000/docs`

### Langkah 2: Setup Frontend (Terminal 2)

```powershell
# Masuk ke direktori frontend
cd deepfake-shield/frontend

# Install dependensi Node.js
npm install

# Jalankan development server
npm run dev
```

Frontend akan tersedia di: `http://localhost:3000`

---

## 🎮 Cara Penggunaan

### 1. Dashboard Deteksi Real-time (Video/Wajah)
- Buka `http://localhost:3000/dashboard` di browsermu.
- Pastikan indikator status backend di pojok layar berwarna hijau (terhubung).
- Klik tombol **"Mulai Kamera"** dan berikan izin akses kamera pada browser.
- Arahkan wajah ke kamera, dan sistem akan langsung memberikan persentase tingkat keaslian gambar/video (REAL / FAKE).

### 2. Analisis Audio Deepfake
- Di panel sebelah kanan dashboard, pilih tab "Audio Analyzer".
- Klik untuk mengunggah file suara (format WAV/MP3/OGG/FLAC).
- Tunggu beberapa detik, sistem akan menganalisis spektrum suara dan memunculkan hasil apakah suara tersebut asli atau hasil generasi AI.

### 3. Modul Edukasi
- Kunjungi halaman `http://localhost:3000/learn`.
- Di sini kamu bisa membaca panduan interaktif tentang bagaimana teknologi deepfake bekerja, etika AI, dan cara mendeteksi deepfake secara manual.

---

## 🧠 Arsitektur AI Secara Singkat

**Video Pipeline:**  
Frame Kamera ➔ MediaPipe (Deteksi Wajah/CPU) ➔ Crop & Normalize ➔ **EfficientNet-B4 (GPU/CUDA)** ➔ Temporal Smoothing (Rata-rata 10 frame) ➔ Hasil Deteksi via WebSocket.

**Audio Pipeline:**  
File Audio ➔ Mel-Spectrogram Extraction (Librosa) ➔ **MobileNetV3-Small (GPU/CUDA)** ➔ Hasil Prediksi.

---

## ⚠️ Troubleshooting Umum

- **Kamera Patah-Patah / Lagging**: Pastikan kamu sudah menginstal PyTorch versi CUDA. Jika menggunakan CPU, proses inferensi AI akan sangat lambat. Cek dengan menjalankan `python -c "import torch; print(torch.cuda.is_available())"` (Harus bernilai `True`).
- **Backend Gagal Berjalan (Error Memory)**: Jika GPU kamu memiliki VRAM kecil (di bawah 4GB), kamu bisa mengganti `EFFICIENTNET_VARIANT = "efficientnet_b3"` atau `b2` di dalam file `model_loader.py`.
- **Status "AI Offline" di Frontend**: Pastikan backend berjalan tepat di port `8000` dan tidak diblokir oleh firewall Windows.

---

## 📄 Lisensi

Proyek ini dibangun untuk tujuan edukasi, penelitian, dan literasi digital mengenai bahaya konten manipulasi AI. 
Dilarang menggunakan kode ini untuk tindakan ilegal atau merugikan pihak lain.