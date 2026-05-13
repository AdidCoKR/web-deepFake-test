/**
 * useWebSocket.ts
 * ===============
 * Custom hook untuk koneksi ke backend.
 *
 * Mode operasi (dipilih otomatis):
 *  1. WebSocket   → jika backend lokal tersedia (development)
 *  2. HTTP Polling → jika WebSocket gagal (production / HF Spaces)
 *
 * Ini memungkinkan kamera real-time berjalan di Vercel + HF Spaces
 * tanpa perlu WebSocket permanen.
 */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type WsStatus = "connecting" | "connected" | "disconnected" | "error";

export interface DetectionResult {
  authenticity_score : number;
  smoothed_score     : number;
  faces_detected     : number;
  face_boxes         : number[][];
  label              : "REAL" | "FAKE" | "UNCERTAIN" | "NO_FACE";
  confidence         : number;
  processing_time_ms : number;
  error?             : string;
}

interface UseWebSocketReturn {
  status      : WsStatus;
  lastResult  : DetectionResult | null;
  sendFrame   : (frameDataUrl: string) => void;
  connect     : () => void;
  disconnect  : () => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const WS_URL      = process.env.NEXT_PUBLIC_WS_URL      || "ws://localhost:8000";

// ─── HTTP Polling Mode ────────────────────────────────────────────────────────
// Digunakan saat WebSocket tidak tersedia (HF Spaces / production)

function useHttpPolling(endpoint: string): UseWebSocketReturn {
  const [status, setStatus]         = useState<WsStatus>("disconnected");
  const [lastResult, setLastResult] = useState<DetectionResult | null>(null);
  const isActiveRef                  = useRef(false);
  const pendingRef                   = useRef(false);

  const connect = useCallback(() => {
    isActiveRef.current = true;
    setStatus("connected");
  }, []);

  const disconnect = useCallback(() => {
    isActiveRef.current = false;
    setStatus("disconnected");
  }, []);

  const sendFrame = useCallback(async (frameDataUrl: string) => {
    if (!isActiveRef.current || pendingRef.current) return;

    // Rate-limit: skip frame jika request sebelumnya belum selesai
    pendingRef.current = true;

    try {
      const res = await fetch(`${BACKEND_URL}/api/analyze/frame`, {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ frame: frameDataUrl }),
        signal : AbortSignal.timeout(5000), // 5 detik timeout
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as DetectionResult;
      setLastResult(data);
      setStatus("connected");
    } catch (e) {
      // Jangan ubah status ke error saat satu request gagal
      // hanya log ke console agar tidak mengganggu UX
      console.warn("[HTTP Polling] Frame request failed:", e);
    } finally {
      pendingRef.current = false;
    }
  }, []);

  useEffect(() => {
    return () => { isActiveRef.current = false; };
  }, []);

  return { status, lastResult, sendFrame, connect, disconnect };
}


// ─── WebSocket Mode ───────────────────────────────────────────────────────────

function useWebSocketMode(endpoint: string): UseWebSocketReturn {
  const [status, setStatus]         = useState<WsStatus>("disconnected");
  const [lastResult, setLastResult] = useState<DetectionResult | null>(null);

  const wsRef              = useRef<WebSocket | null>(null);
  const reconnectTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef       = useRef(true);

  const connect = useCallback(() => {
    if (wsRef.current) wsRef.current.close();

    setStatus("connecting");
    const url = `${WS_URL}${endpoint}`;
    const ws  = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      setStatus("connected");
    };

    ws.onmessage = (event) => {
      if (!isMountedRef.current) return;
      try {
        setLastResult(JSON.parse(event.data) as DetectionResult);
      } catch { /* ignore parse errors */ }
    };

    ws.onerror = () => {
      if (!isMountedRef.current) return;
      setStatus("error");
    };

    ws.onclose = (event) => {
      if (!isMountedRef.current) return;
      setStatus("disconnected");
      if (event.code !== 1000) {
        reconnectTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) connect();
        }, 3000);
      }
    };
  }, [endpoint]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    wsRef.current?.close(1000, "Manual disconnect");
    wsRef.current = null;
    setStatus("disconnected");
  }, []);

  const sendFrame = useCallback((frameDataUrl: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ frame: frameDataUrl }));
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close(1000);
    };
  }, []);

  return { status, lastResult, sendFrame, connect, disconnect };
}


// ─── Auto-Switch Hook (WebSocket → HTTP Polling fallback) ────────────────────

export function useWebSocket(endpoint: string = "/ws/video"): UseWebSocketReturn {
  // Di production (Vercel), gunakan HTTP Polling langsung
  // Di development, coba WebSocket dulu lalu fallback ke HTTP
  const isProduction = typeof window !== "undefined"
    && !window.location.hostname.includes("localhost");

  const httpHook = useHttpPolling(endpoint);
  const wsHook   = useWebSocketMode(endpoint);

  // Kalau di production atau WS URL sama dengan backend URL (HF Spaces tidak support WS)
  // langsung pakai HTTP polling
  if (isProduction || WS_URL === BACKEND_URL) {
    return httpHook;
  }

  return wsHook;
}
