/**
 * AudioAnalyzer.tsx — Light educational theme
 */
"use client";

import { useState, useRef } from "react";
import { Mic, Upload, Loader2, Volume2, Music } from "lucide-react";

interface AudioResult {
  authenticity_score: number;
  label             : "REAL" | "FAKE" | "UNCERTAIN";
  confidence        : number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const labelConfig = {
  REAL     : { color:"#16A34A", bg:"#DCFCE7", text:"Suara Asli"     },
  FAKE     : { color:"#DC2626", bg:"#FEF2F2", text:"Suara Palsu!"   },
  UNCERTAIN: { color:"#EA580C", bg:"#FFF7ED", text:"Tidak Pasti"    },
};

export default function AudioAnalyzer() {
  const [result, setResult]       = useState<AudioResult | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [fileName, setFileName]   = useState<string | null>(null);
  const fileRef                   = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true); setError(null); setFileName(file.name);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/analyze/audio`, { method:"POST", body:fd });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setResult(await res.json());
    } catch (e: unknown) {
      setError((e as Error).message || "Gagal menganalisis");
    } finally { setLoading(false); }
  };

  const lc = result ? labelConfig[result.label] : null;
  const heights = [4,10,16,8,20,12,6,18,10,8,16,22,10,6,12,18,8,14,20,10];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <Volume2 size={16} color="#8B5CF6" />
          <span style={{ fontWeight:800, fontSize:15, color:"#1E293B" }}>Analisis Audio</span>
        </div>
        {result && lc && (
          <span style={{
            padding:"3px 12px", borderRadius:100,
            background:lc.bg, color:lc.color,
            fontSize:11, fontWeight:800,
          }}>{lc.text}</span>
        )}
      </div>

      {/* Waveform */}
      <div style={{
        background:"#F5F3FF", borderRadius:14,
        border:"1px solid rgba(139,92,246,0.2)",
        padding:"12px 16px",
        display:"flex", alignItems:"center", justifyContent:"center", gap:3,
        minHeight:72, position:"relative",
      }}>
        {heights.map((h, i) => (
          <div key={i} style={{
            width:3, height:h, borderRadius:2,
            background: lc ? lc.color : "#8B5CF6",
            opacity: loading ? 0.9 : 0.55,
            transition:"height 0.3s ease",
          }} />
        ))}
        {loading && (
          <div style={{
            position:"absolute", inset:0,
            background:"rgba(255,255,255,0.7)",
            display:"flex", alignItems:"center", justifyContent:"center",
            borderRadius:14,
          }}>
            <Loader2 size={20} color="#8B5CF6" style={{ animation:"spin 1s linear infinite" }} />
          </div>
        )}
      </div>

      {/* Result */}
      {result && lc && !loading && (
        <div style={{
          background:lc.bg, borderRadius:14, padding:"12px 16px", textAlign:"center",
          border:`1.5px solid ${lc.color}25`,
        }}>
          <div style={{ fontFamily:"Nunito", fontWeight:900, fontSize:26, color:lc.color }}>
            {(result.authenticity_score * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize:12, color:"#64748B" }}>
            Keaslian Suara · Confidence {(result.confidence * 100).toFixed(0)}%
          </div>
          {fileName && (
            <div style={{ marginTop:6, fontSize:11, color:"#94A3B8", fontWeight:600 }} className="truncate">{fileName}</div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background:"#FEF2F2", borderRadius:12, padding:"10px 14px",
          color:"#DC2626", fontSize:13, fontWeight:600,
          border:"1px solid rgba(239,68,68,0.2)",
        }}>{error}</div>
      )}

      {/* Upload button */}
      <input ref={fileRef} type="file" accept="audio/*" style={{ display:"none" }}
        onChange={e => { const f = e.target.files?.[0]; if(f) handleFile(f); }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        style={{
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          padding:"11px", borderRadius:14, cursor:loading?"wait":"pointer",
          fontFamily:"Nunito", fontWeight:800, fontSize:14,
          background:"linear-gradient(135deg, #8B5CF6, #7C3AED)",
          color:"white", border:"none",
          boxShadow:"0 4px 14px rgba(139,92,246,0.3)",
          transition:"all 0.2s",
        }}
      >
        {loading
          ? <><Loader2 size={15} style={{ animation:"spin 1s linear infinite" }} /> Menganalisis...</>
          : <><Upload size={15} /> Upload File Audio</>
        }
      </button>

      <p style={{ textAlign:"center", fontSize:11, color:"#94A3B8" }}>
        WAV · MP3 · OGG · FLAC — Analisis per 2 detik
      </p>
    </div>
  );
}
