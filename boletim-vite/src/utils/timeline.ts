import type { Rectification, RectificationStatusValue, Status } from "../domain/documentDetail";

/**
 * Rótulos e cores de todos os status exibidos na linha do tempo de um
 * pedido — tanto os do próprio DocumentRequest (aguardando/confirmado/
 * cancelado) quanto os de uma retificação eventualmente aberta sobre ele
 * (solicitada/agendada/concluida/cancelada).
 *
 * As chaves não colidem entre os dois domínios, então um único mapa cobre
 * ambos e simplifica a renderização de uma timeline unificada.
 */

export const STATUS_LABEL: Record<string, string> = {
  aguardando: "Aguardando",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  solicitada: "Retificação Solicitada",
  agendada: "Retificação Agendada",
  concluida: "Retificação Concluída",
  cancelada: "Retificação Cancelada",
};

// Nome do color scheme do Chakra usado na timeline horizontal (painel).
export const STATUS_COLOR: Record<string, string> = {
  aguardando: "yellow",
  confirmado: "green",
  cancelado: "red",
  solicitada: "purple",
  agendada: "blue",
  concluida: "green",
  cancelada: "red",
};

export const STATUS_STYLE: Record<string, {
  dot: string; line: string; badge: string; badgeColor: string; badgeBorder: string; commentBorder: string
}> = {
  aguardando: {
    dot: "#F59E0B", line: "#FDE68A", badge: "#FEF9C3",
    badgeColor: "#854D0E", badgeBorder: "#FDE68A", commentBorder: "#F59E0B",
  },
  confirmado: {
    dot: "#22C55E", line: "#BBF7D0", badge: "#DCFCE7",
    badgeColor: "#166534", badgeBorder: "#BBF7D0", commentBorder: "#22C55E",
  },
  cancelado: {
    dot: "#EF4444", line: "#FECACA", badge: "#FEE2E2",
    badgeColor: "#991B1B", badgeBorder: "#FECACA", commentBorder: "#EF4444",
  },
  solicitada: {
    dot: "#A855F7", line: "#E9D5FF", badge: "#F3E8FF",
    badgeColor: "#6B21A8", badgeBorder: "#E9D5FF", commentBorder: "#A855F7",
  },
  agendada: {
    dot: "#3B82F6", line: "#BFDBFE", badge: "#DBEAFE",
    badgeColor: "#1D4ED8", badgeBorder: "#BFDBFE", commentBorder: "#3B82F6",
  },
  concluida: {
    dot: "#22C55E", line: "#BBF7D0", badge: "#DCFCE7",
    badgeColor: "#166534", badgeBorder: "#BBF7D0", commentBorder: "#22C55E",
  },
  cancelada: {
    dot: "#EF4444", line: "#FECACA", badge: "#FEE2E2",
    badgeColor: "#991B1B", badgeBorder: "#FECACA", commentBorder: "#EF4444",
  },
};

export type TimelineEventKind = "status" | "rectification";

export interface TimelineEvent {
  key: string;
  kind: TimelineEventKind;
  status: string;
  label: string;
  comment: string | null;
  userName?: string;
  createdAt: string;
}

/**
 * Une o histórico de status do pedido com o(s) histórico(s) de retificação
 * em uma única linha do tempo, ordenada cronologicamente, para que o
 * solicitante acompanhe tudo em um só lugar.
 */
export function mergeTimelineEvents(
  status: Status[] = [],
  rectifications: Rectification[] = []
): TimelineEvent[] {
  const statusEvents: TimelineEvent[] = status.map((item) => ({
    key: `status-${item.id}`,
    kind: "status" as const,
    status: item.status,
    label: STATUS_LABEL[item.status] ?? item.status,
    comment: item.comment,
    userName: item.userName,
    createdAt: item.createdAt,
  }));

  const rectificationEvents: TimelineEvent[] = rectifications.flatMap((rectification) =>
    (rectification.status ?? []).map((item) => ({
      key: `rectification-${rectification.id}-${item.id}`,
      kind: "rectification" as const,
      status: item.status,
      label: STATUS_LABEL[item.status] ?? item.status,
      comment: item.comment,
      userName: item.userName,
      createdAt: item.createdAt,
    }))
  );

  return [...statusEvents, ...rectificationEvents].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

const OPEN_RECTIFICATION_STATUSES = new Set(["solicitada", "agendada"]);

/**
 * Transições permitidas para o status de uma retificação (espelha
 * DocumentRectificationStatus.ALLOWED_TRANSITIONS no backend). Usado para
 * decidir quais ações mostrar ao admin ao responder uma retificação —
 * a validação de fato acontece no backend.
 */
export const RECTIFICATION_ALLOWED_TRANSITIONS: Record<RectificationStatusValue, RectificationStatusValue[]> = {
  solicitada: ["agendada", "cancelada"],
  agendada: ["concluida", "cancelada"],
  concluida: [],
  cancelada: [],
};

/** Retorna a retificação em andamento (solicitada/agendada), se houver. */
export function getOpenRectification(rectifications: Rectification[] = []): Rectification | undefined {
  return rectifications.find((rectification) => {
    const last = rectification.status?.[rectification.status.length - 1];
    return !!last && OPEN_RECTIFICATION_STATUSES.has(last.status);
  });
}

/** Indica se há uma retificação em andamento (ainda não concluída/cancelada). */
export function hasOpenRectification(rectifications: Rectification[] = []): boolean {
  return !!getOpenRectification(rectifications);
}

/** Status atual (mais recente) do pedido, a partir do histórico de status. */
export function currentDocumentStatus(status: Status[] = []): string | undefined {
  return status[status.length - 1]?.status;
}
