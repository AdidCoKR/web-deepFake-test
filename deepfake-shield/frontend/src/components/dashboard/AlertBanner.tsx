/**
 * AlertBanner.tsx
 * ===============
 * Banner alert yang muncul di atas dashboard ketika mendeteksi deepfake.
 * Menggunakan animasi flicker dan warna merah neon.
 */
"use client";

import { AlertTriangle, CheckCircle, HelpCircle, X } from "lucide-react";
import { useState, useEffect } from "react";

type AlertType = "FAKE" | "UNCERTAIN" | "REAL" | null;

interface AlertBannerProps {
  label         : string;
  score         : number;
  facesDetected : number;
}

// Konfigurasi per tipe alert
const alertConfig = {
  FAKE: {
    icon   : AlertTriangle,
    title  : "⚠️ DEEPFAKE TERDETEKSI",
    color  : "#FF3131",
    bg     : "rgba(255, 49, 49, 0.10)",
    border : "rgba(255, 49, 49, 0.40)",
    message: "Konten video yang sedang dianalisis menunjukkan tanda-tanda manipulasi digital.",
  },
  UNCERTAIN: {
    icon   : HelpCircle,
    title  : "🔍 ANALISIS TIDAK KONKLUSIF",
    color  : "#FFD700",
    bg     : "rgba(255, 215, 0, 0.08)",
    border : "rgba(255, 215, 0, 0.35)",
    message: "Skor keaslian berada di zona abu-abu. Diperlukan analisis lebih lanjut.",
  },
  REAL: {
    icon   : CheckCircle,
    title  : "✅ KONTEN TAMPAK ASLI",
    color  : "#39FF14",
    bg     : "rgba(57, 255, 20, 0.08)",
    border : "rgba(57, 255, 20, 0.35)",
    message: "Tidak terdeteksi tanda-tanda manipulasi digital pada frame yang dianalisis.",
  },
};

export default function AlertBanner({ label, score, facesDetected }: AlertBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [prevLabel, setPrevLabel] = useState<string>(label);

  // Re-show banner ketika label berubah
  useEffect(() => {
    if (label !== prevLabel) {
      setIsDismissed(false);
      setPrevLabel(label);
    }
  }, [label, prevLabel]);

  // Tentukan tipe alert
  const alertType: AlertType = 
    label === "FAKE"      ? "FAKE"      :
    label === "UNCERTAIN" ? "UNCERTAIN" :
    label === "REAL"      ? "REAL"      : null;

  // Jangan tampilkan banner jika tidak ada wajah atau dismissed
  if (!alertType || isDismissed || facesDetected === 0) return null;

  const config = alertConfig[alertType];
  const Icon   = config.icon;

  return (
    <div
      className="relative flex items-start gap-4 p-4 rounded-xl"
      style={{
        background : config.bg,
        border     : `1px solid ${config.border}`,
        boxShadow  : alertType === "FAKE" ? `0 0 30px rgba(255,49,49,0.15)` : "none",
      }}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{
          background: `${config.color}18`,
          border    : `1px solid ${config.color}40`,
        }}
      >
        <Icon
          size={20}
          style={{
            color     : config.color,
            animation : alertType === "FAKE" ? "textFlicker 3s infinite" : "none",
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1">
        <div
          className="font-display text-sm font-bold mb-1 tracking-wider"
          style={{
            color     : config.color,
            fontFamily: "Orbitron, sans-serif",
            animation : alertType === "FAKE" ? "textFlicker 3s infinite" : "none",
          }}
        >
          {config.title}
        </div>
        <p className="text-[#94A3B8] text-xs leading-relaxed">{config.message}</p>
        <div className="flex gap-4 mt-2">
          <span className="text-[10px] font-mono" style={{ color: config.color }}>
            SKOR: {(score * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] font-mono text-[#4A6080]">
            WAJAH TERDETEKSI: {facesDetected}
          </span>
        </div>
      </div>

      {/* Tombol dismiss */}
      <button
        onClick={() => setIsDismissed(true)}
        className="flex-shrink-0 text-[#4A6080] hover:text-[#94A3B8] transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
