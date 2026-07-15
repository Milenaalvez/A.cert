"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

interface User {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string | null;
  phone?: string;
  role?: string;
  position?: string;
  registration_number?: string;
  last_access_at?: string;
  created_at?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      let token = typeof window !== "undefined" ? localStorage.getItem("acert_token") : null;
      if (!token && typeof window !== "undefined") {
        const match = document.cookie.match(/acert_token=([^;]+)/);
        if (match) token = match[1];
      }
      if (!token) { setLoading(false); return; }
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const r = await fetch("/api/auth/me", { headers });
      if (r.status === 401) {
        localStorage.removeItem("acert_token");
        document.cookie = "acert_token=; path=/; max-age=0";
        setLoading(false);
        return;
      }
      const data = await r.json();
      if (data.user) {
        setUser(data.user);
        if (typeof window !== "undefined") (window as any).__acertUser = data.user.name;
      }
    } catch (err) {
      console.error("[UserContext] Erro ao validar sessao:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
