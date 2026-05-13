/**
 * ImageUpload.tsx
 */
"use client";

import { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { DetectionResult } from "@/hooks/useWebSocket";

interface ImageUploadProps {
  onResult: (res: DetectionResult | null) => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const borderByLabel: Record<string, string> = {
  REAL     : "#22C55E",
  FAKE     : "#EF4444",
  UNCERTAIN: "#F97316",
  NO_FACE  : "#CBD5E1",
};

export default function ImageUpload({ onResult }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localResult, setLocalResult] = useState<DetectionResult | null>(null);
  
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    
    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setLocalResult(null);
    onResult(null);

    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${BACKEND_URL}/api/analyze/image`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: DetectionResult = await res.json();
      setLocalResult(data);
      onResult(data);
    } catch (e: any) {
      setError(e.message || "Gagal menganalisis gambar");
    } finally {
      setLoading(false);
    }
  };

  const borderColor = localResult ? (borderByLabel[localResult.label] ?? "#CBD5E1") : "#E2E8F0";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, height:"100%" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <ImageIcon size={17} color="#1E4FD8" />
          <span style={{ fontWeight:800, fontSize:15, color:"#1E293B" }}>Upload Foto</span>
        </div>
        {localResult && (
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full"
              style={{
                background: "#EEF2FF",
                border    : "1px solid rgba(30,79,216,0.2)",
                fontSize  : 12, fontWeight:800, color:"#1E4FD8",
              }}
            >
              {(localResult.smoothed_score * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </div>

      {/* Image Box */}
      <div
        style={{
          position    : "relative",
          flex        : 1,
          minHeight   : 300,
          background  : "#F8FAFC",
          borderRadius: 20,
          overflow    : "hidden",
          border      : `2px dashed ${borderColor}`,
          transition  : "border-color 0.4s ease",
          display     : "flex",
          alignItems  : "center",
          justifyContent: "center",
          cursor      : previewUrl ? "default" : "pointer"
        }}
        onClick={() => !loading && !previewUrl && fileRef.current?.click()}
      >
        <input 
          ref={fileRef} 
          type="file" 
          accept="image/*" 
          style={{ display: "none" }} 
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {previewUrl ? (
          <>
            <img 
              src={previewUrl} 
              alt="Preview" 
              style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 18 }} 
            />
            {loading && (
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(255,255,255,0.7)", backdropFilter: "blur(4px)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12
              }}>
                <Loader2 size={40} color="#1E4FD8" style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontWeight: 700, color: "#1E4FD8" }}>Menganalisis Wajah...</span>
              </div>
            )}
            {/* Label overlay */}
            {localResult && localResult.label !== "NO_FACE" && !loading && (
              <div style={{
                position  : "absolute",
                top:12, left:12,
                padding   : "4px 14px",
                borderRadius: 100,
                background: borderByLabel[localResult.label] ?? "#CBD5E1",
                color     : "white",
                fontWeight: 800,
                fontSize  : 12,
                boxShadow : "0 2px 10px rgba(0,0,0,0.15)",
              }}>
                {localResult.label}
              </div>
            )}
            {/* Processing time */}
            {localResult && !loading && (
              <div style={{
                position  : "absolute",
                bottom:10, right:10,
                padding   : "3px 10px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.85)",
                fontSize  : 11, fontWeight:700, color:"#64748B",
                backdropFilter:"blur(6px)",
              }}>
                {localResult.processing_time_ms?.toFixed(0) ?? "–"}ms · {localResult.faces_detected} wajah
              </div>
            )}
          </>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:24, textAlign:"center" }}>
            <div style={{
              width:72, height:72, borderRadius:"50%", background:"#EEF2FF",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Upload size={32} color="#1E4FD8" />
            </div>
            <div>
              <p style={{ fontWeight:700, color:"#475569", marginBottom:4 }}>Klik untuk Upload Foto</p>
              <p style={{ color:"#94A3B8", fontSize:13 }}>Format didukung: JPG, PNG, WEBP</p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background:"#FEF2F2", borderRadius:12, padding:"10px 14px",
          color:"#DC2626", fontSize:13, fontWeight:600,
          border:"1px solid rgba(239,68,68,0.2)",
          display: "flex", alignItems: "center", gap: 8
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Upload button alternative */}
      <button
        onClick={() => !loading && fileRef.current?.click()}
        disabled={loading}
        style={{
          display        : "flex",
          alignItems     : "center",
          justifyContent : "center",
          gap            : 8,
          padding        : "13px",
          borderRadius   : 14,
          border         : "none",
          cursor         : loading ? "wait" : "pointer",
          fontFamily     : "Nunito",
          fontWeight     : 800,
          fontSize       : 15,
          transition     : "all 0.2s",
          background     : previewUrl ? "#F1F5F9" : "linear-gradient(135deg, #1E4FD8, #3B6EFF)",
          color          : previewUrl ? "#475569" : "white",
          boxShadow      : previewUrl ? "none" : "0 4px 15px rgba(30,79,216,0.35)"
        }}
      >
        {loading ? (
          <><Loader2 size={17} style={{ animation:"spin 1s linear infinite" }} /> Mengunggah...</>
        ) : (
          <><Upload size={17} /> {previewUrl ? "Ganti Foto" : "Pilih Foto"}</>
        )}
      </button>
    </div>
  );
}
