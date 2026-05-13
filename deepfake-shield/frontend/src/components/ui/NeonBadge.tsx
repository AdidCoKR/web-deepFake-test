/**
 * NeonBadge.tsx
 * =============
 * Badge status dengan efek neon glow untuk menampilkan label deteksi.
 */
import clsx from "clsx";

type BadgeVariant = "real" | "fake" | "uncertain" | "no-face" | "offline";

interface NeonBadgeProps {
  variant  : BadgeVariant;
  label?   : string;
  size?    : "sm" | "md" | "lg";
  pulse?   : boolean;   // Animasi pulsing dot
}

// Konfigurasi warna per variant
const variantConfig = {
  "real"     : { bg: "rgba(57, 255, 20, 0.10)",  border: "rgba(57, 255, 20, 0.40)",  text: "#39FF14", dot: "#39FF14",  defaultLabel: "REAL"     },
  "fake"     : { bg: "rgba(255, 49, 49, 0.10)",  border: "rgba(255, 49, 49, 0.40)",  text: "#FF3131", dot: "#FF3131",  defaultLabel: "FAKE"     },
  "uncertain": { bg: "rgba(255, 215, 0, 0.10)",  border: "rgba(255, 215, 0, 0.40)",  text: "#FFD700", dot: "#FFD700",  defaultLabel: "UNCERTAIN"},
  "no-face"  : { bg: "rgba(100, 116, 139, 0.10)",border: "rgba(100, 116, 139, 0.40)",text: "#64748B", dot: "#64748B", defaultLabel: "NO FACE"  },
  "offline"  : { bg: "rgba(255, 49, 49, 0.10)",  border: "rgba(255, 49, 49, 0.30)",  text: "#FF3131", dot: "#FF3131",  defaultLabel: "OFFLINE"  },
};

const sizeConfig = {
  sm: { padding: "px-2 py-0.5", fontSize: "text-[10px]", dotSize: "w-1.5 h-1.5" },
  md: { padding: "px-3 py-1",   fontSize: "text-xs",      dotSize: "w-2 h-2"     },
  lg: { padding: "px-4 py-1.5", fontSize: "text-sm",      dotSize: "w-2.5 h-2.5" },
};

export default function NeonBadge({ variant, label, size = "md", pulse = false }: NeonBadgeProps) {
  const config    = variantConfig[variant];
  const sizeStyle = sizeConfig[size];

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-mono font-bold tracking-wider",
        sizeStyle.padding,
        sizeStyle.fontSize
      )}
      style={{
        background : config.bg,
        border     : `1px solid ${config.border}`,
        color      : config.text,
      }}
    >
      {/* Status dot */}
      <span
        className={clsx(sizeStyle.dotSize, "rounded-full flex-shrink-0", pulse && "animate-pulse")}
        style={{
          background: config.dot,
          boxShadow : `0 0 6px ${config.dot}`,
        }}
      />
      {label ?? config.defaultLabel}
    </span>
  );
}
