"use client";
import { useCallback, useEffect, useState } from "react";
import { api, type User } from "../lib/api/client";

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { const result = await api<{ user: User }>("/auth/session"); setUser(result.user); }
    catch { setUser(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const login = async (email: string, password: string, admin = false) => { const result = await api<{ user: User }>(admin ? "/auth/admin-login" : "/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); setUser(result.user); return result.user; };
  const register = (email: string, password: string) => api<{ user: User }>("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
  const logout = async () => { await api<void>("/auth/logout", { method: "POST" }); setUser(null); };
  return { user, loading, login, register, logout, refresh };
}
