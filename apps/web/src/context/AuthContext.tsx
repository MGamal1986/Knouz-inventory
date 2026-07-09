import { createContext, useContext, useState, ReactNode } from "react";
import { api } from "../api/client";

interface Admin {
  id: number;
  username: string;
  fullName?: string | null;
}

interface AuthContextValue {
  admin: Admin | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(() => {
    const stored = localStorage.getItem("knouz_admin");
    return stored ? JSON.parse(stored) : null;
  });

  async function login(username: string, password: string) {
    const res = await api.post("/api/auth/login", { username, password });
    localStorage.setItem("knouz_token", res.data.token);
    localStorage.setItem("knouz_admin", JSON.stringify(res.data.admin));
    setAdmin(res.data.admin);
  }

  function logout() {
    localStorage.removeItem("knouz_token");
    localStorage.removeItem("knouz_admin");
    setAdmin(null);
  }

  return <AuthContext.Provider value={{ admin, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
