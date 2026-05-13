/**
 * app/learn/page.tsx — Education Hub redesign (gamified style)
 */
import type { Metadata } from "next";
import { BookOpen, Trophy, Target, ChevronRight, Clock, Star } from "lucide-react";
import { getAllArticles } from "@/lib/mdx";
import ArticleCard from "@/components/learn/ArticleCard";

export const metadata: Metadata = {
  title      : "Modul Ajar — Deepfake Literacy Hub",
  description: "Pelajari cara kerja deepfake, cara mendeteksinya secara manual, dan etika AI.",
};

export default function LearnPage() {
  const articles = getAllArticles();

  return (
    <div style={{ minHeight:"100vh", paddingTop:80, paddingBottom:40, background:"#F0F4FF" }}>
      <div className="max-w-3xl mx-auto px-5">

        {/* === Hero Header === */}
        <div
          style={{
            background   : "linear-gradient(135deg, #1E4FD8 0%, #0F2D8A 100%)",
            borderRadius : 24,
            padding      : "40px 32px",
            marginBottom : 28,
            position     : "relative",
            overflow     : "hidden",
          }}
        >
          {/* Decorative circles */}
          <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.07)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:-20, left:120, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }} />

          <div style={{ position:"relative" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🦉</div>
            <h1 style={{
              fontFamily:"Nunito", fontWeight:900,
              fontSize:"clamp(1.6rem,3.5vw,2.2rem)",
              color:"white", marginBottom:10, lineHeight:1.2,
            }}>
              Modul Edukasi<br />
              <span style={{ color:"#93C5FD" }}>Deepfake Literacy</span>
            </h1>
            <p style={{ color:"rgba(255,255,255,0.75)", fontSize:15, lineHeight:1.7, maxWidth:460 }}>
              Tingkatkan literasi digitalmu! Pelajari cara kerja, cara mendeteksi, dan etika deepfake dalam 3 bab terstruktur.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-3 mt-6">
              {[
                { icon:"📚", label:`${articles.length} Bab Tersedia` },
                { icon:"🎯", label:"Pemula hingga Mahir" },
              ].map(s => (
                <div key={s.label}
                  style={{
                    display:"flex", alignItems:"center", gap:6,
                    background:"rgba(255,255,255,0.12)",
                    border:"1px solid rgba(255,255,255,0.2)",
                    borderRadius:100, padding:"5px 14px",
                    color:"white", fontSize:12, fontWeight:700,
                    backdropFilter:"blur(10px)",
                  }}
                >
                  <span>{s.icon}</span> {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === Progress bar card === */}
        <div className="card p-5 mb-6 flex items-center gap-4">
          <div style={{
            width:48, height:48, borderRadius:14,
            background:"#EEF2FF", display:"flex",
            alignItems:"center", justifyContent:"center", flexShrink:0,
          }}>
            <Trophy size={22} color="#1E4FD8" />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontWeight:800, fontSize:14, color:"#1E293B" }}>Progres Belajar</span>
              <span style={{ fontSize:13, fontWeight:700, color:"#1E4FD8" }}>0/{articles.length} selesai</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width:"5%" }} />
            </div>
          </div>
        </div>

        {/* === Section header === */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <h2 style={{ fontFamily:"Nunito", fontWeight:900, fontSize:20, color:"#1E293B" }}>
            Daftar Bab
          </h2>
          <div className="stat-chip stat-chip-blue">
            <Target size={12} /> {articles.length} Bab
          </div>
        </div>

        {/* === Article Cards === */}
        <div className="flex flex-col gap-4">
          {articles.map(a => <ArticleCard key={a.slug} article={a} />)}
        </div>

        {/* Footer hint */}
        <div style={{ textAlign:"center", marginTop:32 }}>
          <p style={{ color:"#94A3B8", fontSize:14 }}>
            Sudah siap? Langsung coba di{" "}
            <a href="/dashboard" style={{ color:"#1E4FD8", fontWeight:700, textDecoration:"underline" }}>
              Dashboard Deteksi →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
