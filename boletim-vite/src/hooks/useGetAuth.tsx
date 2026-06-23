import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "./useToast";
import { tryRefreshToken } from "../helpers/jwtUtils";

type UseGetOptions = {
  url: string;
  params?: Record<string, any>;
  autoFetch?: boolean;
  transform?: (data: any) => any;
};

export function useGetAuth<T = any>({ url, params, autoFetch = true, transform }: UseGetOptions) {
  const { token, refreshToken, logout, updateAccess } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const { info } = useToast();
  const navigate = useNavigate();

  // Refs para sempre ter os valores mais recentes sem invalidar fetchData
  const tokenRef = useRef(token);
  const refreshTokenRef = useRef(refreshToken);

  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { refreshTokenRef.current = refreshToken; }, [refreshToken]);

  const buildUrl = useCallback(() => {
    if (!params) return url;
    const query = new URLSearchParams(params).toString();
    return `${url}?${query}`;
  }, [url, JSON.stringify(params)]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const doFetch = async (accessToken: string | null) => {
      return fetch(buildUrl(), {
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });
    };

    try {
      let response = await doFetch(tokenRef.current);

      if (response.status === 401) {
        const refresh = refreshTokenRef.current;
        if (refresh) {
          const newAccess = await tryRefreshToken(refresh);
          if (newAccess) {
            updateAccess(newAccess);
            tokenRef.current = newAccess;
            response = await doFetch(newAccess);
          }
        }

        if (response.status === 401) {
          info({ title: "Sessão expirada!", description: "Necessário realizar o login novamente!" });
          logout();
          navigate("/login");
          return;
        }
      }

      const result = await response.json();

      if (!response.ok) {
        throw {
          message: result?.detail || "Erro na requisição",
          status: response.status,
          data: result,
        };
      }

      setData(transform ? transform(result) : result);
      return result;
    } catch (err: any) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(params)]); // 👈 token via ref — não invalida o callback

  useEffect(() => {
    if (autoFetch) fetchData();
  }, [fetchData, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
