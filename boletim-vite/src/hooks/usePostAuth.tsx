import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "./useToast";

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
  const { token, logout } = useAuth();
  const [data, setData] = useState<TResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const { info } = useToast();
  const navigate = useNavigate();

  const postData = useCallback(
    async (body: TBody) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(body),
        });

        if (response.status === 401) {
          info({
            title: "Sessão expirada!",
            description: "Necessário realizar o login novamente!",
          });
          logout();
          navigate("/login");
          return null;
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
    [url, token]
  );

  return {
    data,
    loading,
    error,
    post: postData,
  };
}