/**
 * CameraFeed.tsx — Educational light theme redesign
 */
"use client";

import { useEffect, useRef, useCallback } from "react";
import { Camera, CameraOff, Wifi, WifiOff, Loader2, AlertCircle } from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { WsStatus, DetectionResult } from "@/hooks/useWebSocket";

interface CameraFeedProps {
  wsStatus     : WsStatus;
  lastResult   : DetectionResult | null;
  onSendFrame  : (url: string) => void;
  isStreaming  : boolean;
  onStartCamera: () => void;
  onStopCamera : () => void;
}

const FRAME_INTERVAL_MS = 100;

// Warna border berdasarkan label
const borderByLabel: Record<string, string> = {
  REAL     : "#22C55E",
  FAKE     : "#EF4444",
  UNCERTAIN: "#F97316",
  NO_FACE  : "#CBD5E1",
};

export default function CameraFeed({
  wsStatus, lastResult, onSendFrame, isStreaming, onStartCamera, onStopCamera,
}: CameraFeedProps) {
  const { videoRef, status: camStatus, errorMessage, captureFrame, startCamera, stopCamera } =
    useCamera();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startLoop = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      const f = captureFrame();
      if (f && wsStatus === "connected") onSendFrame(f);
    }, FRAME_INTERVAL_MS);
  }, [captureFrame, onSendFrame, wsStatus]);

  const stopLoop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (isStreaming && camStatus === "active") startLoop();
    else stopLoop();
    return () => stopLoop();
  }, [isStreaming, camStatus, startLoop, stopLoop]);

  const handleToggle = () => {
    if (camStatus === "active") { stopCamera(); onStopCamera(); }
    else { startCamera(); onStartCamera(); }
  };

  const borderColor = lastResult ? (borderByLabel[lastResult.label] ?? "#CBD5E1") : "#E2E8F0";
  const score       = lastResult?.smoothed_score;
  const pct         = score !== undefined ? Math.round(score * 100) : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, height:"100%" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Camera size={17} color="#1E4FD8" />
          <span style={{ fontWeight:800, fontSize:15, color:"#1E293B" }}>Live Camera</span>
        </div>
        <div className="flex items-center gap-2">
          {/* WS status pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{
              background: wsStatus === "connected" ? "#DCFCE7" : "#FEF2F2",
              border    : `1px solid ${wsStatus === "connected" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            }}
          >
            {wsStatus === "connected"
              ? <Wifi size={12} color="#16A34A" />
              : <WifiOff size={12} color="#EF4444" />
            }
            <span style={{ fontSize:11, fontWeight:700, color: wsStatus === "connected" ? "#16A34A" : "#EF4444" }}>
              {wsStatus === "connected" ? "Terhubung" : "Offline"}
            </span>
          </div>
          {/* Score pill */}
          {pct !== null && (
            <div className="px-3 py-1 rounded-full"
              style={{
                background: "#EEF2FF",
                border    : "1px solid rgba(30,79,216,0.2)",
                fontSize  : 12, fontWeight:800, color:"#1E4FD8",
              }}
            >
              {pct}%
            </div>
          )}
        </div>
      </div>

      {/* Video Box */}
      <div
        style={{
          position    : "relative",
          flex        : 1,
          minHeight   : 300,
          background  : "#F8FAFC",
          borderRadius: 20,
          overflow    : "hidden",
          border      : `2px solid ${borderColor}`,
          transition  : "border-color 0.4s ease",
          display     : "flex",
          alignItems  : "center",
          justifyContent: "center",
        }}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          style={{
            width      : "100%",
            height     : "100%",
            objectFit  : "cover",
            display    : camStatus === "active" ? "block" : "none",
            borderRadius: 18,
          }}
          muted playsInline
        />

        {/* Scan animation */}
        {camStatus === "active" && (
          <div style={{
            position  : "absolute",
            left:0, right:0, height:2,
            background: `linear-gradient(90deg, transparent, ${borderColor}, transparent)`,
            animation : "scanLine 3s linear infinite",
            pointerEvents:"none",
          }} />
        )}

        {/* Label overlay */}
        {lastResult && camStatus === "active" && lastResult.label !== "NO_FACE" && (
          <div style={{
            position  : "absolute",
            top:12, left:12,
            padding   : "4px 14px",
            borderRadius: 100,
            background: borderByLabel[lastResult.label] ?? "#CBD5E1",
            color     : "white",
            fontWeight: 800,
            fontSize  : 12,
            boxShadow : "0 2px 10px rgba(0,0,0,0.15)",
          }}>
            {lastResult.label}
          </div>
        )}

        {/* Processing time */}
        {lastResult && camStatus === "active" && (
          <div style={{
            position  : "absolute",
            bottom:10, right:10,
            padding   : "3px 10px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.85)",
            fontSize  : 11, fontWeight:700, color:"#64748B",
            backdropFilter:"blur(6px)",
          }}>
            {lastResult.processing_time_ms?.toFixed(0) ?? "–"}ms · {lastResult.faces_detected} wajah
          </div>
        )}

        {/* Idle / Error state */}
        {camStatus !== "active" && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:24, textAlign:"center" }}>
            {camStatus === "requesting" ? (
              <>
                <Loader2 size={40} color="#1E4FD8" style={{ animation:"spin 1s linear infinite" }} />
                <p style={{ color:"#64748B", fontWeight:600 }}>Meminta akses kamera...</p>
              </>
            ) : camStatus === "denied" || camStatus === "error" ? (
              <>
                <AlertCircle size={40} color="#EF4444" />
                <p style={{ color:"#EF4444", fontWeight:700, fontSize:14 }}>{errorMessage}</p>
              </>
            ) : (
              <>
                <div style={{
                  width:72, height:72, borderRadius:"50%", background:"#EEF2FF",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <CameraOff size={32} color="#94A3B8" />
                </div>
                <div>
                  <p style={{ fontWeight:700, color:"#475569", marginBottom:4 }}>Kamera belum aktif</p>
                  <p style={{ color:"#94A3B8", fontSize:13 }}>Klik tombol di bawah untuk mulai</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={handleToggle}
        disabled={camStatus === "requesting"}
        style={{
          display        : "flex",
          alignItems     : "center",
          justifyContent : "center",
          gap            : 8,
          padding        : "13px",
          borderRadius   : 14,
          cursor         : camStatus === "requesting" ? "wait" : "pointer",
          fontFamily     : "Nunito",
          fontWeight     : 800,
          fontSize       : 15,
          transition     : "all 0.2s",
          ...(camStatus === "active"
            ? { background:"#FEF2F2", color:"#DC2626", border:"2px solid rgba(239,68,68,0.3)" }
            : { background:"linear-gradient(135deg, #1E4FD8, #3B6EFF)", color:"white", border:"none", boxShadow:"0 4px 15px rgba(30,79,216,0.35)" }
          ),
        }}
      >
        {camStatus === "requesting" ? (
          <><Loader2 size={17} style={{ animation:"spin 1s linear infinite" }} /> Memulai...</>
        ) : camStatus === "active" ? (
          <><CameraOff size={17} /> Hentikan Kamera</>
        ) : (
          <><Camera size={17} /> Mulai Kamera</>
        )}
      </button>
    </div>
  );
}
