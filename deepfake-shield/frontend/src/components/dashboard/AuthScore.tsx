/**
 * AuthScore.tsx — Gauge fix menggunakan stroke-dasharray
 * Pendekatan ini jauh lebih reliable daripada arc path manual.
 */
"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus, ShieldCheck } from "lucide-react";
import { DetectionResult } from "@/hooks/useWebSocket";

interface AuthScoreProps {
  result  : DetectionResult | null;
  history : number[];
}

function getColor(score: number) {
  if (score >= 0.75) return { color: "#16A34A", bg: "#DCFCE7", label: "ASLI"  };
  if (score >= 0.50) return { color: "#EA580C", bg: "#FFF7ED", label: "RAGU"  };
  return                    { color: "#DC2626", bg: "#FEF2F2", label: "PALSU" };
}

export default function AuthScore({ result, history }: AuthScoreProps) {
  const score = result?.smoothed_score ?? 0;
  const conf  = result?.confidence     ?? 0;
  const faces = result?.faces_detected ?? 0;
  const { color, bg, label } = getColor(score);
  const displayPct = Math.round(score * 100);

  const TrendIcon = useMemo(() => {
    if (history.length < 2) return Minus;
    const d = history[history.length - 1] - history[history.length - 2];
    return d > 0.02 ? TrendingUp : d < -0.02 ? TrendingDown : Minus;
  }, [history]);

  const chartData = history.map((v, i) => ({ i, score: +(v * 100).toFixed(1) }));

  // --- Gauge via stroke-dasharray (paling reliable) ---
  // Circle: cx=110, cy=110, r=88 dalam viewBox 220x220
  const cx = 110, cy = 110, r = 88;
  const circumference    = 2 * Math.PI * r;       // ~553
  const GAUGE_ANGLE      = 270;                    // gauge 270°
  const gaugeDash        = (GAUGE_ANGLE / 360) * circumference; // ~415
  const progressDash     = gaugeDash * score;      // panjang arc progress

  // Gauge dimulai dari 135° (bawah-kiri / 7-o'clock) searah jarum jam
  // → track berakhir di 45° (bawah-kanan / 5-o'clock)
  // rotate() pada SVG circle = putar titik awal stroke
  const startAngle = 135;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ShieldCheck size={16} color="#1E4FD8" />
          <span style={{ fontWeight: 800, fontSize: 15, color: "#1E293B" }}>Skor Keaslian</span>
        </div>
        <TrendIcon size={16} color={color} />
      </div>

      {/* Gauge SVG — responsive width */}
      <div style={{ width: "100%", maxWidth: 220, margin: "0 auto" }}>
        <svg viewBox="0 0 220 220" width="100%" style={{ display: "block" }}>

          {/* Track (abu-abu) — hanya 270° terlihat, 90° gap di bawah */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#E8ECF4"
            strokeWidth={18}
            strokeDasharray={`${gaugeDash} ${circumference - gaugeDash}`}
            strokeLinecap="round"
            transform={`rotate(${startAngle}, ${cx}, ${cy})`}
          />

          {/* Progress arc (berwarna) */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={18}
            strokeDasharray={`${progressDash} ${circumference - progressDash}`}
            strokeLinecap="round"
            transform={`rotate(${startAngle}, ${cx}, ${cy})`}
            style={{
              transition : "stroke-dasharray 0.5s ease, stroke 0.4s ease",
              filter     : `drop-shadow(0 0 6px ${color}55)`,
            }}
          />

          {/* Persentase di tengah */}
          <text
            x={cx} y={cy - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontFamily: "Nunito, sans-serif", fontSize: 36, fontWeight: 900, fill: color }}
          >
            {displayPct}%
          </text>

          {/* Label status */}
          <text
            x={cx} y={cy + 24}
            textAnchor="middle"
            style={{ fontFamily: "Nunito, sans-serif", fontSize: 14, fontWeight: 800, fill: color, letterSpacing: "3px" }}
          >
            {label}
          </text>

          {/* Label ujung kiri (PALSU) */}
          <text x={24} y={184} textAnchor="middle"
            style={{ fill: "#94A3B8", fontSize: 10, fontFamily: "sans-serif", fontWeight: 700 }}
          >
            PALSU
          </text>

          {/* Label ujung kanan (ASLI) */}
          <text x={196} y={184} textAnchor="middle"
            style={{ fill: "#94A3B8", fontSize: 10, fontFamily: "sans-serif", fontWeight: 700 }}
          >
            ASLI
          </text>
        </svg>
      </div>

      {/* Stat chips */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: bg, borderRadius: 14, padding: "10px 8px", textAlign: "center", border: `1px solid ${color}25` }}>
          <div style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 22, color }}>{(conf * 100).toFixed(0)}%</div>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Confidence</div>
        </div>
        <div style={{ background: "#EEF2FF", borderRadius: 14, padding: "10px 8px", textAlign: "center", border: "1px solid rgba(30,79,216,0.15)" }}>
          <div style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 22, color: "#1E4FD8" }}>{faces}</div>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Wajah</div>
        </div>
      </div>

      {/* History chart */}
      {chartData.length > 1 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>
            Riwayat 30 Frame Terakhir
          </div>
          <ResponsiveContainer width="100%" height={65}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="i" hide />
              <YAxis domain={[0, 100]} hide />
              <Tooltip
                contentStyle={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 11 }}
                formatter={(v: number) => [`${v}%`, "Skor"]}
                labelFormatter={() => ""}
              />
              <Area type="monotone" dataKey="score" stroke={color} strokeWidth={2}
                fill="url(#scoreGrad)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
