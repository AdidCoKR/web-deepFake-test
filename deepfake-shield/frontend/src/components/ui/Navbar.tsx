/**
 * Navbar.tsx — Educational style navigation
 * Tema terang (light) dengan Nunito font dan warna biru cerah
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Shield, LayoutDashboard, BookOpen, Activity, Menu, X, Wifi, WifiOff } from "lucide-react";

const navItems = [
  { href: "/",          label: "Beranda",    icon: Shield },
  { href: "/dashboard", label: "Deteksi",    icon: LayoutDashboard },
  { href: "/learn",     label: "Belajar",    icon: BookOpen },
];

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function Navbar() {
  const pathname = usePathname();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/health`, {
          signal: AbortSignal.timeout(3000),
        });
        setBackendOnline(res.ok);
      } catch { setBackendOnline(false); }
    };
    check();
    const t = setInterval(check, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <nav
      style={{
        background  : "white",
        borderBottom: "2px solid #EEF2FF",
        boxShadow   : "0 2px 16px rgba(30,79,216,0.08)",
        position    : "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
      }}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group" style={{ textDecoration: "none" }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background : "linear-gradient(135deg, #1E4FD8, #3B6EFF)",
              boxShadow  : "0 4px 14px rgba(30,79,216,0.35)",
              transition : "transform 0.2s",
            }}
          >
            <Shield size={20} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 16, color: "#1E293B", lineHeight: 1 }}>
              Deepfake<span style={{ color: "#1E4FD8" }}>Shield</span>
            </div>
            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, letterSpacing: "0.5px" }}>
              DETECTION &amp; EDUCATION
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display       : "flex",
                  alignItems    : "center",
                  gap           : 6,
                  padding       : "8px 18px",
                  borderRadius  : "12px",
                  textDecoration: "none",
                  fontFamily    : "Nunito",
                  fontWeight    : 700,
                  fontSize      : 14,
                  color         : active ? "#1E4FD8" : "#64748B",
                  background    : active ? "#EEF2FF" : "transparent",
                  transition    : "all 0.2s",
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Backend status pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            background : backendOnline ? "#DCFCE7" : "#FEF2F2",
            border     : `1px solid ${backendOnline ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
          }}
        >
          {backendOnline ? <Wifi size={13} color="#16A34A" /> : <WifiOff size={13} color="#EF4444" />}
          <span style={{
            fontSize  : 12,
            fontWeight: 700,
            color     : backendOnline ? "#16A34A" : "#EF4444",
            fontFamily: "Nunito",
          }}>
            {backendOnline === null ? "Checking..." : backendOnline ? "AI Online" : "AI Offline"}
          </span>
          {backendOnline && (
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22C55E" }} />
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl"
          style={{ color: "#64748B", background: "#F8FAFC" }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden px-5 pb-4 pt-2 flex flex-col gap-1"
          style={{ borderTop: "1px solid #EEF2FF", background: "white" }}
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                style={{
                  display       : "flex",
                  alignItems    : "center",
                  gap           : 8,
                  padding       : "12px 16px",
                  borderRadius  : "12px",
                  textDecoration: "none",
                  fontWeight    : 700,
                  color         : active ? "#1E4FD8" : "#64748B",
                  background    : active ? "#EEF2FF" : "transparent",
                }}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
