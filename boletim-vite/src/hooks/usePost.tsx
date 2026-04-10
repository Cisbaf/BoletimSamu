import { useState } from "react";

type UsePostOptions<T> = {
  url: string;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  multiPart?: boolean;
};


export function usePost<T = any>({ url, onSuccess, onError, multiPart }: UsePostOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const post = async (body: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, multiPart? GetMultiPart(body) : GetPostJson(body));

      const result = await response.json();

      if (!response.ok) {
        throw result;
      }

      setData(result);

      onSuccess?.(result);
      return result;
    } catch (err) {
      setError(err);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return { post, data, loading, error };
}

function GetPostJson(body: any) {
    return {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    }
}

function GetMultiPart(body: any) {
    return {
        method: "POST",
        body: body
    }
}
