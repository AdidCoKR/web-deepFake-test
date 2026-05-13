/**
 * ArticleCard.tsx — Educational gamified style
 */
import Link from "next/link";
import { Clock, ChevronRight, BookOpen, CheckCircle } from "lucide-react";
import { ArticleMeta } from "@/lib/mdx";

interface ArticleCardProps { article: ArticleMeta; }

// Map chapter to emoji
const chapEmoji: Record<number, string> = { 1:"🧠", 2:"🔍", 3:"⚖️" };

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link href={`/learn/${article.slug}`} style={{ textDecoration:"none" }}>
      <div
        className="mission-card"
        style={{
          padding:"20px 22px",
          display:"flex", alignItems:"flex-start", gap:18,
          cursor:"pointer",
        }}
      >
        {/* Chapter Icon */}
        <div style={{
          width:60, height:60, flexShrink:0, borderRadius:18,
          background: article.coverColor + "18",
          border    : `2px solid ${article.coverColor}35`,
          display   : "flex", alignItems:"center", justifyContent:"center",
          fontSize  : 28,
          transition: "transform 0.2s",
        }}>
          {chapEmoji[article.chapter] ?? "📖"}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          {/* Top row */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
            <span style={{
              display:"inline-flex", alignItems:"center", gap:4,
              padding:"2px 10px", borderRadius:100,
              background: article.coverColor + "18",
              border    : `1px solid ${article.coverColor}35`,
              color     : article.coverColor,
              fontSize  : 11, fontWeight:800,
              fontFamily: "Nunito",
            }}>
              <BookOpen size={10} /> BAB {article.chapter}
            </span>
            <div style={{ display:"flex", alignItems:"center", gap:4, color:"#94A3B8", fontSize:12 }}>
              <Clock size={11} /> {article.readTime}
            </div>
          </div>

          {/* Title */}
          <h3 style={{
            fontFamily:"Nunito", fontWeight:900, fontSize:16,
            color:"#1E293B", marginBottom:6, lineHeight:1.3,
          }}>
            {article.title}
          </h3>

          {/* Desc */}
          <p style={{
            color:"#64748B", fontSize:13, lineHeight:1.6, marginBottom:10,
            display:"-webkit-box", WebkitLineClamp:2,
            WebkitBoxOrient:"vertical", overflow:"hidden",
          }}>
            {article.description}
          </p>

          {/* Tags */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {article.tags.slice(0, 3).map(t => (
              <span key={t} style={{
                padding:"2px 9px", borderRadius:6,
                background:"#F0F4FF", color:"#1E4FD8",
                fontSize:10, fontWeight:700,
                border:"1px solid rgba(30,79,216,0.12)",
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight size={20} color="#CBD5E1" style={{ flexShrink:0, marginTop:4 }} />
      </div>
    </Link>
  );
}
