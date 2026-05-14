# ============================================================
# upload_to_hf.ps1
# Upload backend ke Hugging Face Spaces via Git
# ============================================================
# CARA PAKAI:
#   1. Ganti HF_USERNAME dengan username Hugging Face kamu
#   2. Jalankan di folder backend: .\upload_to_hf.ps1
# ============================================================

$HF_USERNAME   = "adidtiya"
$HF_SPACE_NAME = "deepfake-shield-api"
$HF_TOKEN      = "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"   # dari https://huggingface.co/settings/tokens

# --- Validasi ---
if ($HF_USERNAME -eq "GANTI_DENGAN_USERNAME_HF_KAMU") {
    Write-Host ""
    Write-Host "ERROR: Belum isi HF_USERNAME!" -ForegroundColor Red
    Write-Host "Ganti nilai HF_USERNAME di baris 10 dengan username HF kamu." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

if ($HF_TOKEN -eq "PASTE_TOKEN_KAMU_DISINI") {
    Write-Host ""
    Write-Host "ERROR: Belum isi HF_TOKEN!" -ForegroundColor Red
    Write-Host "1. Buka https://huggingface.co/settings/tokens" -ForegroundColor Yellow
    Write-Host "2. Klik 'New token' -> pilih Write -> Generate" -ForegroundColor Yellow
    Write-Host "3. Copy token dan paste di baris HF_TOKEN di script ini" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

$HF_REPO_URL      = "https://huggingface.co/spaces/$HF_USERNAME/$HF_SPACE_NAME"
$HF_REPO_URL_AUTH = "https://${HF_USERNAME}:${HF_TOKEN}@huggingface.co/spaces/${HF_USERNAME}/${HF_SPACE_NAME}"
$TEMP_DIR    = "$env:TEMP\hf_deploy_$HF_SPACE_NAME"
$BACKEND_DIR = $PSScriptRoot

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " Deepfake Shield - Upload ke Hugging Face Spaces" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " Space: $HF_REPO_URL" -ForegroundColor Gray
Write-Host ""

# --- Step 1: Clone Space ---
Write-Host "[Step 1] Clone Space dari Hugging Face..." -ForegroundColor Yellow

if (Test-Path $TEMP_DIR) {
    Remove-Item -Recurse -Force $TEMP_DIR
}

git clone $HF_REPO_URL_AUTH $TEMP_DIR
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "GAGAL clone Space. Pastikan:" -ForegroundColor Red
    Write-Host "  1. Space '$HF_SPACE_NAME' sudah dibuat di https://huggingface.co/new-space" -ForegroundColor Yellow
    Write-Host "  2. Token HF_TOKEN sudah benar dan punya akses Write" -ForegroundColor Yellow
    Write-Host "  3. Username '$HF_USERNAME' sudah benar" -ForegroundColor Yellow
    exit 1
}

Write-Host "OK - Clone berhasil!" -ForegroundColor Green

# --- Step 2: Hapus file lama (kecuali .git) ---
Write-Host ""
Write-Host "[Step 2] Bersihkan file lama di Space..." -ForegroundColor Yellow

Get-ChildItem $TEMP_DIR | Where-Object { $_.Name -ne ".git" } | Remove-Item -Recurse -Force

# --- Step 3: Copy file backend ---
Write-Host ""
Write-Host "[Step 3] Copy file backend..." -ForegroundColor Yellow

$FILES_TO_COPY = @(
    "app.py",
    "detector.py",
    "model_loader.py",
    "audio_detector.py",
    "Dockerfile",
    "README.md"
)

foreach ($file in $FILES_TO_COPY) {
    $src = Join-Path $BACKEND_DIR $file
    $dst = Join-Path $TEMP_DIR $file
    if (Test-Path $src) {
        Copy-Item $src $dst
        Write-Host "  OK - Copied: $file" -ForegroundColor Green
    } else {
        Write-Host "  SKIP - Tidak ditemukan: $file" -ForegroundColor Yellow
    }
}

# Copy requirements_hf.txt sebagai requirements.txt
$req_src = Join-Path $BACKEND_DIR "requirements_hf.txt"
$req_dst = Join-Path $TEMP_DIR "requirements.txt"
if (Test-Path $req_src) {
    Copy-Item $req_src $req_dst
    Write-Host "  OK - Copied: requirements_hf.txt -> requirements.txt" -ForegroundColor Green
}

# Copy folder utils kalau ada
$utils_src = Join-Path $BACKEND_DIR "utils"
$utils_dst = Join-Path $TEMP_DIR "utils"
if (Test-Path $utils_src) {
    Copy-Item $utils_src $utils_dst -Recurse
    Write-Host "  OK - Copied: utils/" -ForegroundColor Green
}

# --- Step 4: Git commit & push ---
Write-Host ""
Write-Host "[Step 4] Push ke Hugging Face..." -ForegroundColor Yellow

Set-Location $TEMP_DIR
git add -A
git commit -m "Deploy Deepfake Shield Backend v2.0"
git push

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "GAGAL push. Coba login manual dulu:" -ForegroundColor Red
    Write-Host "  git config --global credential.helper manager" -ForegroundColor Yellow
    Set-Location $BACKEND_DIR
    exit 1
}

# Kembali ke direktori semula
Set-Location $BACKEND_DIR

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host " BERHASIL! Backend sudah di-upload ke HF Spaces!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Host " URL Space kamu:" -ForegroundColor White
Write-Host " $HF_REPO_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host " URL API (setelah build selesai ~5 menit):" -ForegroundColor White
Write-Host " https://$HF_USERNAME-$HF_SPACE_NAME.hf.space" -ForegroundColor Cyan
Write-Host ""
Write-Host " Langkah selanjutnya:" -ForegroundColor White
Write-Host " 1. Buka tab Logs di Space untuk cek progress build" -ForegroundColor Gray
Write-Host " 2. Buka Vercel Dashboard -> Settings -> Environment Variables" -ForegroundColor Gray
Write-Host " 3. Set NEXT_PUBLIC_BACKEND_URL = https://$HF_USERNAME-$HF_SPACE_NAME.hf.space" -ForegroundColor Gray
Write-Host " 4. Set NEXT_PUBLIC_WS_URL      = https://$HF_USERNAME-$HF_SPACE_NAME.hf.space" -ForegroundColor Gray
Write-Host " 5. Redeploy di Vercel" -ForegroundColor Gray
Write-Host "=====================================================" -ForegroundColor Green
