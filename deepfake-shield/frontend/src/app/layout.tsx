/**
 * layout.tsx — Root Layout
 * Tema: Educational Gamified (Nunito + Inter)
 */
import type { Metadata } from "next";
import { Nunito, Inter } from "next/font/google";
import Navbar from "@/components/ui/Navbar";
import "./globals.css";

const nunito = Nunito({
  subsets : ["latin"],
  weight  : ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display : "swap",
});

const inter = Inter({
  subsets : ["latin"],
  variable: "--font-inter",
  display : "swap",
});

export const metadata: Metadata = {
  title: {
    default : "Deepfake Shield — Deteksi & Edukasi Deepfake",
    template: "%s | Deepfake Shield",
  },
  description:
    "Platform edukasi dan deteksi deepfake real-time berbasis AI. Tingkatkan literasi digital dan lindungi diri dari manipulasi konten.",
  keywords: ["deepfake", "deteksi AI", "literasi digital", "keamanan siber", "edukasi"],
  authors : [{ name: "Deepfake Shield Team" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${nunito.variable} ${inter.variable}`}>
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}

