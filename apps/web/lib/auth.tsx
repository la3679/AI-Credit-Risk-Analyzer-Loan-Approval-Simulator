"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "./api";

export type SessionUser = { id: string; name: string; email: string; role: "user" | "admin" | "guest"; isGuest: boolean };
type AuthState = { user?: SessionUser; loading: boolean; refresh: () => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser>();
  const [loading, setLoading] = useState(true);
  async function refresh() {
    try { const response = await apiFetch<{ user: SessionUser }>("/api/auth/me"); setUser(response.user); }
    catch { setUser(undefined); }
    finally { setLoading(false); }
  }
  async function signOut() { await apiFetch<void>("/api/auth/logout", { method: "POST" }); setUser(undefined); }
  useEffect(() => { void refresh(); }, []);
  return <AuthContext.Provider value={{ user, loading, refresh, signOut }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used inside AuthProvider"); return context; }
