import { useState } from "react";
import { ApiError } from "../helpers/apiError";

type UsePostOptions<T> = {
  url: string;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  multiPart?: boolean;
};

/**
 * Lê o corpo da resposta sem assumir que ele é JSON.
 *
 * Erros de infraestrutura (413 do nginx, 500/502 do Django/gunicorn) chegam
 * como HTML: fazer response.json() direto estourava um SyntaxError e a causa
 * real da falha se perdia.
 */
async function readBody(response: Response): Promise<{ data: unknown; raw: string }> {
  const raw = await response.text();

  if (!raw) return { data: null, raw };

  try {
    return { data: JSON.parse(raw), raw };
  } catch {
    return { data: null, raw };
  }
}

export function usePost<T = any>({ url, onSuccess, onError, multiPart }: UsePostOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const post = async (body: any) => {
    setLoading(true);
    setError(null);

    try {
      let response: Response;

      try {
        response = await fetch(url, multiPart ? GetMultiPart(body) : GetPostJson(body));
      } catch (networkError: any) {
        // fetch só rejeita quando a requisição não chegou a ser concluída:
        // sem conexão, envio interrompido ou arquivo que o navegador não
        // conseguiu ler (comum em anexos escolhidos direto do Google Drive,
        // iCloud ou WhatsApp, que não estão baixados no aparelho).
        throw new ApiError(
          0,
          null,
          "",
          "Não foi possível concluir o envio: a conexão caiu ou um dos arquivos anexados não pôde ser lido pelo navegador. " +
            "Verifique sua internet e, se o anexo veio de um app de nuvem (Google Drive, iCloud, WhatsApp), baixe-o para o aparelho antes de anexar. " +
            `(${networkError?.message ?? "falha de rede"})`
        );
      }

      const { data: result, raw } = await readBody(response);

      if (!response.ok) {
        throw new ApiError(
          response.status,
          result,
          raw,
          `Requisição falhou com status ${response.status}.`
        );
      }

      setData(result as T);

      onSuccess?.(result as T);
      return result as T;
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
    credentials: "omit" as RequestCredentials,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

function GetMultiPart(body: any) {
  return {
    method: "POST",
    credentials: "omit" as RequestCredentials,
    body: body,
  };
}
