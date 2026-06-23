import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "./useToast";
import { tryRefreshToken } from "../helpers/jwtUtils";

type UsePostOptions<TResponse = any> = {
  url: string;
  transform?: (data: any) => TResponse;
  onSuccess?: (data: TResponse) => void;
  onError?: (error: any) => void;
};

export function usePostAuth<TResponse = any, TBody = any>({
  url,
  transform,
  onSuccess,
  onError,
}: UsePostOptions<TBody>) {
  const { token, refreshToken, logout, updateAccess } = useAuth();
  const [data, setData] = useState<TResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const { info } = useToast();
  const navigate = useNavigate();

  // Refs para sempre ter os valores mais recentes sem invalidar postData
  const tokenRef = useRef(token);
  const refreshTokenRef = useRef(refreshToken);

  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { refreshTokenRef.current = refreshToken; }, [refreshToken]);

  const postData = useCallback(
    async (body: TBody) => {
      setLoading(true);
      setError(null);

      const doPost = async (accessToken: string | null) => {
        return fetch(url, {
          method: "POST",
          credentials: "omit",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          },
          body: JSON.stringify(body),
        });
      };

      try {
        let response = await doPost(tokenRef.current);

        if (response.status === 401) {
          const refresh = refreshTokenRef.current;
          if (refresh) {
            const newAccess = await tryRefreshToken(refresh);
            if (newAccess) {
              updateAccess(newAccess);
              tokenRef.current = newAccess;
              response = await doPost(newAccess);
            }
          }

          if (response.status === 401) {
            info({
              title: "Sessão expirada!",
              description: "Necessário realizar o login novamente!",
            });
            logout();
            navigate("/login");
            return null;
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

        const finalData = transform ? transform(result) : result;

        setData(finalData);
        onSuccess?.(finalData);

        return finalData;
      } catch (err: any) {
        setError(err);
        onError?.(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [url] // token via ref — não invalida o callback
  );

  return {
    data,
    loading,
    error,
    post: postData,
  };
}
