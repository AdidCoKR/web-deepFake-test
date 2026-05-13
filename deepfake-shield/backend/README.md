---
title: Deepfake Shield API
emoji: 🛡️
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# Deepfake Shield API

Backend API untuk deteksi deepfake real-time berbasis AI.

## Endpoints

- `GET /api/health` — Status server
- `POST /api/analyze/image` — Analisis gambar
- `POST /api/analyze/frame` — Analisis frame base64 (untuk live camera)
- `POST /api/analyze/audio` — Analisis audio
- `GET /api/reset` — Reset temporal buffer
