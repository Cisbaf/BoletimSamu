// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import { isTokenExpired, tryRefreshToken } from "../helpers/jwtUtils";

interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  login: (access: string, refresh: string) => void;
  logout: () => void;
  updateAccess: (access: string) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedAccess = localStorage.getItem("token");
    const savedRefresh = localStorage.getItem("refreshToken");

    async function init() {
      if (!savedAccess) {
        setLoading(false);
        return;
      }

      if (!isTokenExpired(savedAccess)) {
        // Access token ainda válido
        setToken(savedAccess);
        setRefreshToken(savedRefresh);
      } else if (savedRefresh) {
        // Access expirado mas refresh disponível — tenta renovar silenciosamente
        const newAccess = await tryRefreshToken(savedRefresh);
        if (newAccess) {
          localStorage.setItem("token", newAccess);
          setToken(newAccess);
          setRefreshToken(savedRefresh);
        } else {
          // Refresh inválido ou expirado — limpa tudo
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
        }
      } else {
        // Access expirado sem refresh — limpa
        localStorage.removeItem("token");
      }

      setLoading(false);
    }

    init();
  }, []);

  function login(access: string, refresh: string) {
    localStorage.setItem("token", access);
    localStorage.setItem("refreshToken", refresh);
    setToken(access);
    setRefreshToken(refresh);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setToken(null);
    setRefreshToken(null);
  }

  function updateAccess(access: string) {
    localStorage.setItem("token", access);
    setToken(access);
  }

  return (
    <AuthContext.Provider
      value={{ token, refreshToken, login, logout, updateAccess, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve estar dentro do AuthProvider");
  return context;
}
