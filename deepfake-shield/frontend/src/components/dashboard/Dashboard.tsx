/**
 * Dashboard.tsx — Redesign Educational Style
 * Tema terang, card putih, warna biru/hijau/oranye
 */
"use client";

import { useState, useCallback, useEffect } from "react";
import {
  LayoutDashboard, Cpu, Zap, Shield, Activity,
  Camera, CheckCircle, XCircle, HelpCircle, Minus
} from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import CameraFeed    from "./CameraFeed";
import ImageUpload   from "./ImageUpload";
import AuthScore     from "./AuthScore";
import AudioAnalyzer from "./AudioAnalyzer";
import AlertBanner   from "./AlertBanner";

const MAX_HISTORY = 30;

export default function Dashboard() {
  const [source, setSource]             = useState<"camera" | "upload">("camera");
  const [isStreaming, setIsStreaming]   = useState(false);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const { status: wsStatus, lastResult, sendFrame, connect, disconnect } =
    useWebSocket("/ws/video");

  const currentResult = source === "camera" ? lastResult : uploadResult;

  const handleSendFrame = useCallback((dataUrl: string) => {
    sendFrame(dataUrl);
  }, [sendFrame]);

  useEffect(() => {
    if (currentResult?.smoothed_score !== undefined) {
      setScoreHistory(prev => [...prev, currentResult.smoothed_score].slice(-MAX_HISTORY));
    }
  }, [currentResult]);

  const handleStartCamera = useCallback(() => {
    setIsStreaming(true);
    connect();
  }, [connect]);

  const handleStopCamera = useCallback(() => {
    setIsStreaming(false);
    disconnect();
    setScoreHistory([]);
  }, [disconnect]);

  // Warna tema berdasarkan label
  const themeColor =
    currentResult?.label === "REAL"      ? "#22C55E" :
    currentResult?.label === "FAKE"      ? "#EF4444" :
    currentResult?.label === "UNCERTAIN" ? "#F97316" : "#1E4FD8";

  const statusInfo = {
    REAL     : { icon: CheckCircle, text: "Konten Asli",          bg: "#DCFCE7", border: "rgba(34,197,94,0.35)",  color: "#16A34A" },
    FAKE     : { icon: XCircle,     text: "Deepfake Terdeteksi!", bg: "#FEF2F2", border: "rgba(239,68,68,0.35)",  color: "#DC2626" },
    UNCERTAIN: { icon: HelpCircle,  text: "Tidak Konklusif",      bg: "#FFF7ED", border: "rgba(249,115,22,0.35)", color: "#EA580C" },
    NO_FACE  : { icon: Minus,       text: "Tidak Ada Wajah",      bg: "#F0F4FF", border: "rgba(30,79,216,0.2)",   color: "#1E4FD8" },
  };
  const si = statusInfo[(currentResult?.label as keyof typeof statusInfo) ?? "NO_FACE"] ?? statusInfo["NO_FACE"];
  const StatusIcon = si.icon;

  const infoStats = [
    { label: "Status Koneksi",     value: source === "camera" ? (wsStatus === "connected" ? "Terhubung" : wsStatus === "connecting" ? "Menghubungkan..." : "Offline") : "Siap", color: source === "camera" ? (wsStatus === "connected" ? "#22C55E" : wsStatus === "connecting" ? "#F97316" : "#EF4444") : "#1E4FD8", bg: source === "camera" ? (wsStatus === "connected" ? "#DCFCE7" : wsStatus === "connecting" ? "#FFF7ED" : "#FEF2F2") : "#EEF2FF" },
    { label: "Frame Rate",         value: isStreaming && source === "camera" ? "10 FPS" : "–",                                                                          color: "#1E4FD8", bg: "#EEF2FF" },
    { label: "Waktu Proses",       value: currentResult?.processing_time_ms ? `${currentResult.processing_time_ms.toFixed(0)} ms` : "–",               color: "#F97316", bg: "#FFF7ED" },
    { label: "Wajah Terdeteksi",   value: (currentResult?.faces_detected ?? 0).toString(),                                                          color: "#8B5CF6", bg: "#F5F3FF" },
  ];

  return (
    <div style={{ minHeight:"100vh", paddingTop:80, paddingBottom:40, background:"#F0F4FF" }}>
      <div className="max-w-6xl mx-auto px-5 space-y-5">

        {/* === Header === */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard size={16} color="#1E4FD8" />
              <span style={{ fontSize:12, fontWeight:700, color:"#94A3B8", letterSpacing:"1px", textTransform:"uppercase" }}>
                Real-Time Analysis
              </span>
            </div>
            <h1 style={{ fontFamily:"Nunito", fontWeight:900, fontSize:26, color:"#1E293B" }}>
              Dashboard <span style={{ color:"#1E4FD8" }}>Deteksi</span>
            </h1>
          </div>

          {/* GPU chip */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-2xl"
            style={{ background:"white", border:"1px solid #E2E8F0", boxShadow:"0 2px 10px rgba(30,79,216,0.08)" }}
          >
            <Cpu size={14} color="#1E4FD8" />
            <span style={{ fontSize:12, fontWeight:700, color:"#475569" }}>RTX 3050 Ti · CUDA 12.1</span>
            <Zap size={12} color="#F97316" />
          </div>
        </div>

        {/* === Status Alert === */}
        {currentResult && (
          <div
            className="flex items-center gap-3 p-4 rounded-2xl"
            style={{
              background  : si.bg,
              border      : `1.5px solid ${si.border}`,
              boxShadow   : "0 2px 12px rgba(0,0,0,0.05)",
              transition  : "all 0.4s ease",
            }}
          >
            <StatusIcon size={22} color={si.color} style={{ flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:15, color:si.color }}>{si.text}</div>
              <div style={{ fontSize:13, color:"#64748B" }}>
                Skor keaslian: <strong>{((currentResult.smoothed_score) * 100).toFixed(1)}%</strong>
                &nbsp;·&nbsp; {currentResult.faces_detected} wajah terdeteksi
              </div>
            </div>
          </div>
        )}

        {/* === Main Grid: Camera | Score + Audio === */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">

          {/* Camera / Upload Panel */}
          <div className="card p-5 flex flex-col gap-4" style={{ minHeight:480 }}>
            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
              <button
                onClick={() => { setSource("camera"); setScoreHistory([]); }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${source === "camera" ? "bg-white text-blue-700 shadow" : "text-slate-500 hover:text-slate-700"}`}
              >
                Live Camera
              </button>
              <button
                onClick={() => { setSource("upload"); setScoreHistory([]); }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${source === "upload" ? "bg-white text-blue-700 shadow" : "text-slate-500 hover:text-slate-700"}`}
              >
                Upload Foto
              </button>
            </div>

            <div className="flex-1">
              {source === "camera" ? (
                <CameraFeed
                  wsStatus      = {wsStatus}
                  lastResult    = {lastResult}
                  onSendFrame   = {handleSendFrame}
                  isStreaming   = {isStreaming}
                  onStartCamera = {handleStartCamera}
                  onStopCamera  = {handleStopCamera}
                />
              ) : (
                <ImageUpload onResult={(res) => setUploadResult(res)} />
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            {/* Score */}
            <div className="card p-5" style={{ flex:1 }}>
              <AuthScore result={currentResult} history={scoreHistory} />
            </div>
            {/* Audio */}
            <div className="card p-5">
              <AudioAnalyzer />
            </div>
          </div>
        </div>

        {/* === Stats Row === */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {infoStats.map(s => (
            <div key={s.label} className="card p-4 text-center">
              <div style={{
                fontFamily:"Nunito", fontWeight:900, fontSize:20, color:s.color,
                marginBottom:4,
              }}>{s.value}</div>
              <div style={{ fontSize:12, color:"#94A3B8", fontWeight:700 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Idle hint */}
        {!isStreaming && source === "camera" && (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <span style={{ color:"#94A3B8", fontSize:14 }}>
              Klik <strong style={{ color:"#1E4FD8" }}>"Mulai Kamera"</strong> untuk memulai deteksi real-time
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
