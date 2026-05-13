/**
 * app/learn/[slug]/page.tsx — Article reader redesign
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft, Clock, BookOpen, ChevronRight } from "lucide-react";
import { getAllArticles, getArticleBySlug } from "@/lib/mdx";

interface PageProps { params: { slug: string }; }

export async function generateStaticParams() {
  return getAllArticles().map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const a = getArticleBySlug(params.slug);
  if (!a) return { title: "Tidak Ditemukan" };
  return { title: a.meta.title, description: a.meta.description };
}

const chapEmoji: Record<number, string> = { 1:"🧠", 2:"🔍", 3:"⚖️" };

export default function ArticlePage({ params }: PageProps) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();
  const { meta, content } = article;

  return (
    <div style={{ minHeight:"100vh", paddingTop:80, paddingBottom:48, background:"#F0F4FF" }}>
      <div className="max-w-3xl mx-auto px-5">

        {/* Back button */}
        <Link href="/learn"
          style={{
            display:"inline-flex", alignItems:"center", gap:6,
            color:"#1E4FD8", fontWeight:700, fontSize:14,
            textDecoration:"none", marginBottom:24,
            padding:"8px 16px", background:"white",
            borderRadius:12, border:"1px solid #E2E8F0",
            boxShadow:"0 2px 8px rgba(30,79,216,0.06)",
            transition:"all 0.2s",
          }}
        >
          <ArrowLeft size={15} /> Kembali ke Modul
        </Link>

        {/* Article Header Card */}
        <div
          style={{
            background   : `linear-gradient(135deg, ${meta.coverColor} 0%, ${meta.coverColor}CC 100%)`,
            borderRadius : 24,
            padding      : "36px 32px",
            marginBottom : 24,
            position     : "relative",
            overflow     : "hidden",
            color        : "white",
          }}
        >
          <div style={{ position:"absolute", top:-50, right:-50, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }} />

          <div style={{ position:"relative" }}>
            <div style={{ fontSize:52, marginBottom:14 }}>{chapEmoji[meta.chapter] ?? "📖"}</div>

            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <span style={{
                display:"inline-flex", alignItems:"center", gap:6,
                padding:"4px 14px", borderRadius:100,
                background:"rgba(255,255,255,0.2)",
                border:"1px solid rgba(255,255,255,0.3)",
                fontSize:12, fontWeight:800, letterSpacing:"0.5px",
              }}>
                <BookOpen size={11} /> BAB {meta.chapter}
              </span>
              <span style={{
                display:"flex", alignItems:"center", gap:4,
                background:"rgba(255,255,255,0.2)",
                padding:"4px 12px", borderRadius:100,
                fontSize:12, fontWeight:700,
              }}>
                <Clock size={11} /> {meta.readTime}
              </span>
            </div>

            <h1 style={{
              fontFamily:"Nunito", fontWeight:900,
              fontSize:"clamp(1.5rem,3vw,2rem)",
              color:"white", marginBottom:10, lineHeight:1.2,
            }}>
              {meta.title}
            </h1>

            <p style={{ color:"rgba(255,255,255,0.80)", fontSize:15, lineHeight:1.7 }}>
              {meta.description}
            </p>

            {/* Tags */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:16 }}>
              {meta.tags.map(t => (
                <span key={t} style={{
                  padding:"3px 12px", borderRadius:100,
                  background:"rgba(255,255,255,0.18)",
                  border:"1px solid rgba(255,255,255,0.25)",
                  color:"white", fontSize:11, fontWeight:700,
                }}>
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Article Content Card */}
        <div className="card p-8 md:p-10 mb-6">
          <article className="mdx-content">
            <MDXRemote source={content} />
          </article>
        </div>

        {/* Bottom nav */}
        <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
          <Link href="/learn"
            style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"11px 22px", borderRadius:14,
              background:"white", color:"#1E4FD8",
              border:"2px solid #1E4FD8",
              fontFamily:"Nunito", fontWeight:800, fontSize:14,
              textDecoration:"none", transition:"all 0.2s",
            }}
          >
            <ArrowLeft size={15} /> Semua Bab
          </Link>
          <Link href="/dashboard"
            style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"11px 22px", borderRadius:14,
              background:"linear-gradient(135deg, #1E4FD8, #3B6EFF)",
              color:"white", border:"none",
              fontFamily:"Nunito", fontWeight:800, fontSize:14,
              textDecoration:"none",
              boxShadow:"0 4px 14px rgba(30,79,216,0.3)",
              transition:"all 0.2s",
            }}
          >
            Coba Dashboard <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
