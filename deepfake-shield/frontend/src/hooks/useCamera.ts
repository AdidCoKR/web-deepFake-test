/**
 * useCamera.ts
 * ============
 * Custom hook untuk mengakses kamera pengguna via getUserMedia API.
 * Menangani: izin kamera, error handling, dan capture frame.
 */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Status kamera
export type CameraStatus = "idle" | "requesting" | "active" | "error" | "denied";

interface UseCameraReturn {
  videoRef     : React.RefObject<HTMLVideoElement>;
  status       : CameraStatus;
  errorMessage : string | null;
  captureFrame : () => string | null;   // Kembalikan data URL base64 JPEG
  startCamera  : () => void;
  stopCamera   : () => void;
}

// Konfigurasi kualitas kamera
const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width      : { ideal: 640, max: 1280 },  // Lebar ideal 640px (lebih ringan)
    height     : { ideal: 480, max: 720 },   // Tinggi ideal 480px
    frameRate  : { ideal: 30, max: 60 },     // Target 30fps
    facingMode : "user",                      // Gunakan kamera depan
  },
  audio: false,  // Tidak perlu audio dari kamera
};

// Kualitas kompresi JPEG untuk pengiriman ke server (0.0 - 1.0)
// 0.7 = trade-off baik antara kualitas dan ukuran data
const JPEG_QUALITY = 0.7;

export function useCamera(): UseCameraReturn {
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ref ke elemen <video> di DOM (tidak trigger re-render)
  const videoRef    = useRef<HTMLVideoElement>(null);

  // Ref ke MediaStream aktif (untuk bisa di-stop nanti)
  const streamRef   = useRef<MediaStream | null>(null);

  // Canvas tersembunyi untuk capture frame
  const canvasRef   = useRef<HTMLCanvasElement | null>(null);

  /**
   * Mulai stream kamera dan tampilkan di elemen video.
   */
  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMessage("Browser ini tidak mendukung akses kamera.");
      return;
    }

    setStatus("requesting");
    setErrorMessage(null);

    try {
      // Minta izin akses kamera dari pengguna
      const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
      streamRef.current = stream;

      // Hubungkan stream ke elemen video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Tunggu sampai video siap diputar
        await videoRef.current.play();
      }

      setStatus("active");
      console.log("[Camera] Stream kamera aktif.");

    } catch (error: unknown) {
      const err = error as DOMException;
      console.error("[Camera] Error:", err);

      // Bedakan error izin ditolak vs error lainnya
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setStatus("denied");
        setErrorMessage("Akses kamera ditolak. Mohon izinkan akses kamera di browser Anda.");
      } else if (err.name === "NotFoundError") {
        setStatus("error");
        setErrorMessage("Tidak ada kamera yang ditemukan di perangkat ini.");
      } else {
        setStatus("error");
        setErrorMessage(`Error kamera: ${err.message}`);
      }
    }
  }, []);

  /**
   * Hentikan stream kamera dan bebaskan resource.
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      // Hentikan semua track media (video/audio)
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStatus("idle");
    console.log("[Camera] Stream kamera dihentikan.");
  }, []);

  /**
   * Capture satu frame dari video dan kembalikan sebagai data URL JPEG.
   * Menggunakan hidden canvas untuk mengambil frame.
   */
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;

    // Pastikan video sedang aktif dan frame tersedia
    if (!video || video.readyState < 2 || status !== "active") {
      return null;
    }

    const width  = video.videoWidth;
    const height = video.videoHeight;

    if (width === 0 || height === 0) return null;

    // Buat canvas tersembunyi jika belum ada
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    const canvas = canvasRef.current;
    canvas.width  = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Gambar frame video ke canvas
    ctx.drawImage(video, 0, 0, width, height);

    // Konversi canvas ke data URL JPEG (lebih kecil dari PNG)
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  }, [status]);

  // Cleanup saat komponen unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    status,
    errorMessage,
    captureFrame,
    startCamera,
    stopCamera,
  };
}
