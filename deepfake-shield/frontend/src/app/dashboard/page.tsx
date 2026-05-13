/**
 * app/dashboard/page.tsx
 * Halaman Dashboard - merender komponen Dashboard utama.
 */
import type { Metadata } from "next";
import Dashboard from "@/components/dashboard/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard — Real-Time Deepfake Detection",
};

export default function DashboardPage() {
  return <Dashboard />;
}
