FROM python:3.10-slim

WORKDIR /app

# Install system dependencies untuk OpenCV dan MediaPipe
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements dan install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Buat direktori cache untuk HuggingFace models
RUN mkdir -p models/hf_cache models/torch_cache

# Port yang digunakan HF Spaces
EXPOSE 7860

# Jalankan server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
