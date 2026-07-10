import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../api/client";

interface Admin {
  id: number;
  username: string;
  fullName?: string | null;
}

interface AuthContextValue {
  admin: Admin | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/auth/me")
      .then((res) => setAdmin(res.data.admin))
      .catch(() => setAdmin(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(username: string, password: string) {
    const res = await api.post("/api/auth/login", { username, password });
    setAdmin(res.data.admin);
  }

  async function logout() {
    try {
      await api.post("/api/auth/logout");
    } finally {
      setAdmin(null);
    }
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
