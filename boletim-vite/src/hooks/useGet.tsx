import { useState, useCallback } from "react";

type UseGetOptions = {
  url: string;
  params?: Record<string, any>;
  autoFetch?: boolean; // se roda automaticamente
  transform?: (data: any) => any;
};

export function useGet<T = any>({ url, params, autoFetch = true, transform }: UseGetOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<any>(null);

  const buildUrl = () => {
    if (!params) return url;
    const query = new URLSearchParams(params).toString();

    return `${url}?${query}`;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildUrl());

      const result = await response.json();

      if (!response.ok) {
        throw {
          message: result?.detail || "Erro na requisição",
          status: response.status,
          data: result,
        };
      }
      setData(transform? transform(result) : result);
      return result;
    } catch (err: any) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(params)]); // 👈 garante atualização quando params mudar

//   useEffect(() => {
//     if (autoFetch) {
//       fetchData();
//     }
//   }, [fetchData, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData, // 🔁 manual
  };
}