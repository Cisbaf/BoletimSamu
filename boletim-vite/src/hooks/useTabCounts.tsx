import { useCallback } from "react";
import { useGetAuth } from "./useGetAuth";
import { ApiBaseUrl } from "../settings";

/**
 * Contagens usadas nos rótulos das abas do painel (ex.: "Aguardando (10)",
 * "Retificações (1)"). Reaproveita o endpoint de listagem já existente —
 * só nos interessa o `count` retornado pela paginação do DRF, então o
 * corpo da resposta em si não é usado.
 */
export default function useTabCounts() {
  const { data: aguardandoData, refetch: refetchAguardando } = useGetAuth({
    url: `${ApiBaseUrl}/document/requests/`,
    params: { status: "aguardando", page: 1 },
  });

  const { data: retificandoData, refetch: refetchRetificando } = useGetAuth({
    url: `${ApiBaseUrl}/document/requests/`,
    params: { status: "retificando", page: 1 },
  });

  const refetch = useCallback(() => {
    refetchAguardando();
    refetchRetificando();
  }, [refetchAguardando, refetchRetificando]);

  return {
    aguardando: aguardandoData?.count ?? 0,
    retificando: retificandoData?.count ?? 0,
    refetch,
  };
}
