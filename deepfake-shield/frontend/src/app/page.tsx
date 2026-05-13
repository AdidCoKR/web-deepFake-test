/**
 * page.tsx — Landing Page (Educational Hub Style)
 * Tema: Gamified education seperti referensi desain
 */
import Link from "next/link";
import type { Metadata } from "next";
import { Shield, Zap, BookOpen, Camera, Radio, Brain, Award, Users, Star, ChevronRight, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Deepfake Shield — Deteksi & Edukasi Deepfake",
};

const features = [
  {
    icon    : Camera,
    title   : "Deteksi Wajah Real-Time",
    desc    : "Analisis wajah dari kamera secara langsung menggunakan EfficientNet-B4 dengan akurasi tinggi.",
    color   : "#1E4FD8",
    bg      : "#EEF2FF",
    badge   : "LIVE",
    badgeBg : "#DCFCE7",
    badgeCol: "#16A34A",
  },
  {
    icon    : Radio,
    title   : "Analisis Suara AI",
    desc    : "Deteksi voice cloning dengan Mel-Spectrogram dan CNN classifier berbasis Librosa.",
    color   : "#F97316",
    bg      : "#FFF7ED",
    badge   : "AUDIO",
    badgeBg : "#FFF7ED",
    badgeCol: "#EA580C",
  },
  {
    icon    : Brain,
    title   : "AI Engine CUDA",
    desc    : "Diakselerasi GPU RTX 3050 Ti dengan Mixed Precision FP16 untuk inferensi ultra-cepat.",
    color   : "#22C55E",
    bg      : "#DCFCE7",
    badge   : "GPU",
    badgeBg : "#EEF2FF",
    badgeCol: "#1E4FD8",
  },
  {
    icon    : BookOpen,
    title   : "3 Bab Edukasi",
    desc    : "Pelajari cara kerja deepfake, cara mendeteksinya, dan etika AI secara mendalam.",
    color   : "#8B5CF6",
    bg      : "#F5F3FF",
    badge   : "EDU",
    badgeBg : "#F5F3FF",
    badgeCol: "#7C3AED",
  },
];

const stats = [
  { icon: Zap,   label: "Latency", value: "<50ms",        color: "#1E4FD8" },
  { icon: Star,  label: "Model",   value: "EfficientNet", color: "#F97316" },
  { icon: Shield,label: "Mode",    value: "100% Lokal",   color: "#22C55E" },
  { icon: Award, label: "Bab",     value: "3 Modul",      color: "#8B5CF6" },
];

const steps = [
  { num: "01", title: "Aktifkan Kamera",    desc: "Klik tombol mulai dan izinkan akses webcam" },
  { num: "02", title: "AI Analisis Wajah",  desc: "Model EfficientNet memproses setiap frame secara real-time" },
  { num: "03", title: "Lihat Hasil",         desc: "Skor keaslian muncul instan dengan indikator visual" },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", paddingTop: "64px" }}>

      {/* ====== Hero Section ====== */}
      <section
        style={{
          background   : "linear-gradient(160deg, #1E4FD8 0%, #0F2D8A 60%, #1a3a9a 100%)",
          padding      : "80px 24px 100px",
          position     : "relative",
          overflow     : "hidden",
        }}
      >
        {/* Decorative circles */}
        <div style={{ position:"absolute", top:-80, right:-80, width:300, height:300, borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-60, left:-60, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", top:"30%", right:"15%", width:120, height:120, borderRadius:"50%", border:"2px dashed rgba(255,255,255,0.15)", pointerEvents:"none" }} />

        <div className="max-w-4xl mx-auto text-center" style={{ position:"relative" }}>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6"
            style={{
              background  : "rgba(255,255,255,0.15)",
              border      : "1px solid rgba(255,255,255,0.3)",
              borderRadius: "100px",
              padding     : "6px 18px",
              backdropFilter: "blur(10px)",
            }}
          >
            <span style={{ fontSize:18 }}>🛡️</span>
            <span style={{ color:"white", fontSize:13, fontWeight:700, letterSpacing:"0.5px" }}>
              Platform Deteksi Deepfake #1
            </span>
          </div>

          {/* Title */}
          <h1 style={{ fontFamily:"Nunito", fontWeight:900, fontSize:"clamp(2.2rem, 5vw, 3.8rem)", color:"white", lineHeight:1.1, marginBottom:20 }}>
            Lindungi Dirimu dari
            <br/>
            <span style={{ color:"#93C5FD" }}>Manipulasi Digital</span>
          </h1>

          <p style={{ color:"rgba(255,255,255,0.80)", fontSize:18, lineHeight:1.7, maxWidth:560, margin:"0 auto 40px", fontWeight:500 }}>
            Deteksi deepfake secara real-time langsung di browser menggunakan AI yang berjalan 100% lokal di GPU kamu.
          </p>

          {/* CTA */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/dashboard"
              style={{
                display:"inline-flex", alignItems:"center", gap:8,
                padding:"14px 32px", borderRadius:16,
                background:"white", color:"#1E4FD8",
                fontWeight:900, fontSize:16, textDecoration:"none",
                boxShadow:"0 4px 20px rgba(0,0,0,0.2)",
                transition:"all 0.2s",
              }}
            >
              <Camera size={20} />
              Coba Sekarang — Gratis
            </Link>
            <Link href="/learn"
              style={{
                display:"inline-flex", alignItems:"center", gap:8,
                padding:"14px 32px", borderRadius:16,
                background:"rgba(255,255,255,0.12)", color:"white",
                border:"2px solid rgba(255,255,255,0.35)",
                fontWeight:900, fontSize:16, textDecoration:"none",
                backdropFilter:"blur(10px)",
                transition:"all 0.2s",
              }}
            >
              <BookOpen size={20} />
              Pelajari Deepfake
            </Link>
          </div>

          {/* Floating stats */}
          <div className="flex flex-wrap justify-center gap-4 mt-14">
            {stats.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label}
                  style={{
                    background    : "rgba(255,255,255,0.12)",
                    border        : "1px solid rgba(255,255,255,0.2)",
                    borderRadius  : 16,
                    padding       : "14px 20px",
                    backdropFilter: "blur(10px)",
                    textAlign     : "center",
                    minWidth      : 110,
                  }}
                >
                  <Icon size={20} color="rgba(255,255,255,0.7)" style={{ margin:"0 auto 6px" }} />
                  <div style={{ color:"white", fontWeight:900, fontSize:18, fontFamily:"Nunito" }}>{s.value}</div>
                  <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11, fontWeight:700 }}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Wave divider */}
      <div style={{ marginTop:-2, lineHeight:0 }}>
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" style={{ display:"block", width:"100%" }}>
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,0 L0,0 Z" fill="#0F2D8A"/>
        </svg>
      </div>

      {/* ====== How It Works ====== */}
      <section style={{ padding:"64px 24px", background:"white" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="stat-chip stat-chip-blue inline-flex mb-4">⚡ Cara Kerja</div>
            <h2 className="section-title">Deteksi dalam 3 Langkah Mudah</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={s.num} className="card p-6 text-center" style={{ position:"relative" }}>
                <div style={{
                  width:56, height:56, borderRadius:"50%",
                  background:"linear-gradient(135deg, #1E4FD8, #3B6EFF)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  margin:"0 auto 16px",
                  fontFamily:"Nunito", fontWeight:900, fontSize:20, color:"white",
                  boxShadow:"0 4px 14px rgba(30,79,216,0.35)",
                }}>
                  {s.num}
                </div>
                <h3 style={{ fontWeight:800, fontSize:17, color:"#1E293B", marginBottom:8 }}>{s.title}</h3>
                <p style={{ color:"#64748B", fontSize:14, lineHeight:1.6 }}>{s.desc}</p>
                {i < steps.length - 1 && (
                  <ChevronRight size={20} color="#CBD5E1"
                    style={{ position:"absolute", right:-14, top:"50%", transform:"translateY(-50%)", display:"none" }}
                    className="md:block"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Features ====== */}
      <section style={{ padding:"64px 24px", background:"#F0F4FF" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="stat-chip stat-chip-green inline-flex mb-4">🚀 Fitur Unggulan</div>
            <h2 className="section-title">Teknologi AI Terdepan</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card p-6 flex gap-5 group" style={{ transition:"all 0.25s" }}>
                  <div style={{
                    width:56, height:56, borderRadius:16, flexShrink:0,
                    background:f.bg, display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    <Icon size={26} color={f.color} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ fontWeight:800, fontSize:16, color:"#1E293B" }}>{f.title}</span>
                      <span style={{
                        fontSize:10, fontWeight:800, padding:"2px 8px",
                        borderRadius:"100px", background:f.badgeBg, color:f.badgeCol,
                        letterSpacing:"0.5px",
                      }}>{f.badge}</span>
                    </div>
                    <p style={{ color:"#64748B", fontSize:14, lineHeight:1.6 }}>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====== CTA Bottom ====== */}
      <section style={{ padding:"64px 24px", background:"white", textAlign:"center" }}>
        <div className="max-w-xl mx-auto">
          <div className="animate-float" style={{ fontSize:64, marginBottom:16 }}>🦉</div>
          <h2 className="section-title mb-4">Siap Jadi Detektif Deepfake?</h2>
          <p style={{ color:"#64748B", marginBottom:32, fontSize:16, lineHeight:1.6 }}>
            Mulai deteksi real-time atau pelajari 3 bab panduan lengkap tentang deepfake literacy.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/dashboard" className="btn-blue">
              <Camera size={18} /> Mulai Deteksi
            </Link>
            <Link href="/learn" className="btn-outline">
              <BookOpen size={18} /> Baca Modul
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
