import os
from pathlib import Path
_PROJECT_ROOT = Path(__file__).parent
_HF_CACHE_DIR = str(_PROJECT_ROOT / "models" / "hf_cache")
os.environ["HF_HOME"] = _HF_CACHE_DIR

import torch
from transformers import pipeline
from PIL import Image
import urllib.request
import io

print("Loading models...")
p1 = pipeline("image-classification", model="Wvolf/ViT_Deepfake_Detection", device=-1)
p2 = pipeline("image-classification", model="prithivMLmods/deepfake-detector-model-v1", device=-1)

# Download a real face
url = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=224&auto=format&fit=crop"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        img_data = response.read()
    img = Image.open(io.BytesIO(img_data)).convert("RGB")
    print("Downloaded real face.")
except Exception as e:
    print("Failed to download face, using dummy image.", e)
    img = Image.new("RGB", (224, 224), color=(255, 200, 200))

print("\nTesting p1 (Wvolf)...")
res1 = p1(img)
print(res1)

print("\nTesting p2 (prithiv)...")
res2 = p2(img)
print(res2)
