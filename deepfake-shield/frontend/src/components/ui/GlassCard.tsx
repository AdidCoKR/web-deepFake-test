/**
 * GlassCard.tsx
 * =============
 * Reusable glassmorphism card component dengan glow variants.
 */
import { ReactNode } from "react";
import clsx from "clsx";

interface GlassCardProps {
  children  : ReactNode;
  className?: string;
  glowColor?: "cyan" | "green" | "red" | "purple" | "none";
  padding?  : "sm" | "md" | "lg";
}

// Map warna glow ke CSS values
const glowColors = {
  cyan  : "rgba(0, 255, 255, 0.12)",
  green : "rgba(57, 255, 20, 0.12)",
  red   : "rgba(255, 49, 49, 0.12)",
  purple: "rgba(168, 85, 247, 0.12)",
  none  : "transparent",
};

const borderColors = {
  cyan  : "rgba(0, 255, 255, 0.25)",
  green : "rgba(57, 255, 20, 0.25)",
  red   : "rgba(255, 49, 49, 0.25)",
  purple: "rgba(168, 85, 247, 0.25)",
  none  : "rgba(0, 168, 255, 0.15)",
};

const paddingSizes = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function GlassCard({
  children,
  className,
  glowColor = "none",
  padding   = "md",
}: GlassCardProps) {
  return (
    <div
      className={clsx("glass-card", paddingSizes[padding], className)}
      style={{
        boxShadow  : `0 0 30px ${glowColors[glowColor]}, inset 0 1px 0 rgba(255,255,255,0.05)`,
        borderColor: borderColors[glowColor],
      }}
    >
      {children}
    </div>
  );
}
