"use client";
import { useEffect, useState } from "react";
import { api } from "../lib/api/client";

export function useDatabaseStatus() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        await api<{ status: string; database: string }>("/health");
        if (active) { setConnected(true); setError(""); }
      } catch (cause) {
        if (active) { setConnected(false); setError(cause instanceof Error ? cause.message : "Database health check failed."); }
      } finally { if (active) setLoading(false); }
    };
    void check();
    const timer = window.setInterval(() => void check(), 10_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  return { connected, loading, error };
}
