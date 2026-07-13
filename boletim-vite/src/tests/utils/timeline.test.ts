import { describe, it, expect } from "vitest";
import {
  mergeTimelineEvents,
  hasOpenRectification,
  getOpenRectification,
  RECTIFICATION_ALLOWED_TRANSITIONS,
  currentDocumentStatus,
  getOpenCorrection,
  hasOpenCorrection,
  CORRECTION_ALLOWED_TRANSITIONS,
} from "../../utils/timeline";
import type { Rectification, Status } from "../../domain/documentDetail";
import type { Correction } from "../../domain/documentCorrection";

const status: Status[] = [
  { id: 1, status: "aguardando", comment: null, createdAt: "2026-01-01T10:00:00Z" },
  { id: 2, status: "confirmado", comment: "Aprovado", createdAt: "2026-01-02T10:00:00Z" },
];

function makeRectification(overrides: Partial<Rectification> = {}): Rectification {
  return {
    id: 1,
    document: 10,
    reason: "",
    createdAt: "2026-01-03T10:00:00Z",
    status: [
      { id: 101, status: "solicitada", comment: null, createdAt: "2026-01-03T10:00:00Z" },
    ],
    ...overrides,
  };
}

describe("mergeTimelineEvents", () => {
  it("retorna apenas os eventos de status quando não há retificação", () => {
    const events = mergeTimelineEvents(status, []);

    expect(events).toHaveLength(2);
    expect(events.map((e) => e.kind)).toEqual(["status", "status"]);
    expect(events[0].label).toBe("Aguardando");
    expect(events[1].label).toBe("Confirmado");
  });

  it("mescla status do pedido e da retificação em ordem cronológica", () => {
    const rectification = makeRectification();
    const events = mergeTimelineEvents(status, [rectification]);

    expect(events).toHaveLength(3);
    expect(events.map((e) => e.status)).toEqual(["aguardando", "confirmado", "solicitada"]);
    expect(events[2].kind).toBe("rectification");
    expect(events[2].label).toBe("Retificação Solicitada");
  });

  it("intercala eventos quando a retificação tem data anterior a um status posterior", () => {
    const rectification = makeRectification({
      status: [
        { id: 101, status: "solicitada", comment: null, createdAt: "2026-01-01T15:00:00Z" },
      ],
    });

    // aqui a retificação (dia 01 às 15h) fica entre aguardando (01 às 10h) e confirmado (02 às 10h)
    const events = mergeTimelineEvents(status, [rectification]);

    expect(events.map((e) => e.status)).toEqual(["aguardando", "solicitada", "confirmado"]);
  });

  it("inclui todos os eventos de status de múltiplas retificações", () => {
    const first = makeRectification({
      id: 1,
      status: [
        { id: 101, status: "solicitada", comment: null, createdAt: "2026-01-03T10:00:00Z" },
        { id: 102, status: "cancelada", comment: "Duplicada", createdAt: "2026-01-03T11:00:00Z" },
      ],
    });
    const second = makeRectification({
      id: 2,
      status: [
        { id: 201, status: "solicitada", comment: null, createdAt: "2026-01-04T10:00:00Z" },
      ],
    });

    const events = mergeTimelineEvents(status, [first, second]);

    expect(events).toHaveLength(5);
    expect(events[4].key).toBe("rectification-2-201");
  });

  it("lida com listas vazias", () => {
    expect(mergeTimelineEvents([], [])).toEqual([]);
    expect(mergeTimelineEvents(undefined, undefined)).toEqual([]);
  });
});

describe("hasOpenRectification", () => {
  it("retorna false quando não há retificações", () => {
    expect(hasOpenRectification([])).toBe(false);
  });

  it("retorna true quando a última retificação está solicitada", () => {
    expect(hasOpenRectification([makeRectification()])).toBe(true);
  });

  it("retorna true quando a última retificação está agendada", () => {
    const rectification = makeRectification({
      status: [
        { id: 101, status: "solicitada", comment: null, createdAt: "2026-01-03T10:00:00Z" },
        { id: 102, status: "agendada", comment: null, createdAt: "2026-01-04T10:00:00Z" },
      ],
    });
    expect(hasOpenRectification([rectification])).toBe(true);
  });

  it("retorna false quando a última retificação está concluída", () => {
    const rectification = makeRectification({
      status: [
        { id: 101, status: "solicitada", comment: null, createdAt: "2026-01-03T10:00:00Z" },
        { id: 102, status: "agendada", comment: null, createdAt: "2026-01-04T10:00:00Z" },
        { id: 103, status: "concluida", comment: null, createdAt: "2026-01-05T10:00:00Z" },
      ],
    });
    expect(hasOpenRectification([rectification])).toBe(false);
  });

  it("retorna false quando a última retificação está cancelada", () => {
    const rectification = makeRectification({
      status: [
        { id: 101, status: "solicitada", comment: null, createdAt: "2026-01-03T10:00:00Z" },
        { id: 102, status: "cancelada", comment: null, createdAt: "2026-01-04T10:00:00Z" },
      ],
    });
    expect(hasOpenRectification([rectification])).toBe(false);
  });
});

describe("currentDocumentStatus", () => {
  it("retorna o status mais recente", () => {
    expect(currentDocumentStatus(status)).toBe("confirmado");
  });

  it("retorna undefined para lista vazia", () => {
    expect(currentDocumentStatus([])).toBeUndefined();
  });
});

describe("getOpenRectification", () => {
  it("retorna undefined quando não há retificações", () => {
    expect(getOpenRectification([])).toBeUndefined();
  });

  it("retorna a retificação cujo último status é solicitada", () => {
    const rectification = makeRectification();
    expect(getOpenRectification([rectification])).toBe(rectification);
  });

  it("retorna a retificação cujo último status é agendada", () => {
    const rectification = makeRectification({
      status: [
        { id: 101, status: "solicitada", comment: null, createdAt: "2026-01-03T10:00:00Z" },
        { id: 102, status: "agendada", comment: null, createdAt: "2026-01-04T10:00:00Z" },
      ],
    });
    expect(getOpenRectification([rectification])).toBe(rectification);
  });

  it("ignora retificações concluídas ou canceladas", () => {
    const concluded = makeRectification({
      id: 1,
      status: [
        { id: 101, status: "solicitada", comment: null, createdAt: "2026-01-03T10:00:00Z" },
        { id: 102, status: "concluida", comment: null, createdAt: "2026-01-04T10:00:00Z" },
      ],
    });
    expect(getOpenRectification([concluded])).toBeUndefined();
  });
});

describe("RECTIFICATION_ALLOWED_TRANSITIONS", () => {
  it("permite agendar ou cancelar a partir de solicitada", () => {
    expect(RECTIFICATION_ALLOWED_TRANSITIONS.solicitada).toEqual(["agendada", "cancelada"]);
  });

  it("permite concluir ou cancelar a partir de agendada", () => {
    expect(RECTIFICATION_ALLOWED_TRANSITIONS.agendada).toEqual(["concluida", "cancelada"]);
  });

  it("concluida e cancelada são estados terminais", () => {
    expect(RECTIFICATION_ALLOWED_TRANSITIONS.concluida).toEqual([]);
    expect(RECTIFICATION_ALLOWED_TRANSITIONS.cancelada).toEqual([]);
  });
});

/* =========================
 * CORREÇÃO DE PREENCHIMENTO
 * ========================= */

function makeCorrection(overrides: Partial<Correction> = {}): Correction {
  return {
    id: 1,
    createdAt: "2026-02-01T10:00:00Z",
    fields: [],
    status: [
      { id: 201, status: "pendente", comment: null, createdAt: "2026-02-01T10:00:00Z" },
    ],
    ...overrides,
  };
}

describe("mergeTimelineEvents com corrections", () => {
  it("inclui eventos de correção na timeline com os rótulos corretos", () => {
    const correction = makeCorrection({
      status: [
        { id: 201, status: "pendente", comment: null, createdAt: "2026-01-03T10:00:00Z" },
        { id: 202, status: "enviada",  comment: null, createdAt: "2026-01-04T10:00:00Z" },
        { id: 203, status: "aprovada", comment: null, createdAt: "2026-01-05T10:00:00Z" },
      ],
    });

    const events = mergeTimelineEvents(status, [], [correction]);

    expect(events).toHaveLength(5);
    const correctionEvents = events.filter((e) => e.kind === "correction");
    expect(correctionEvents).toHaveLength(3);
    expect(correctionEvents[0].label).toBe("Correção de Preenchimento");
    expect(correctionEvents[1].label).toBe("Verificando Mudanças");
    expect(correctionEvents[2].label).toBe("Correção Aprovada");
  });

  it("intercala eventos de correção em ordem cronológica com os demais", () => {
    const correction = makeCorrection({
      status: [
        { id: 201, status: "pendente", comment: null, createdAt: "2026-01-01T12:00:00Z" },
      ],
    });

    // pedido: aguardando (01 às 10h), confirmado (02 às 10h)
    // correção: pendente (01 às 12h) → fica entre aguardando e confirmado
    const events = mergeTimelineEvents(status, [], [correction]);

    expect(events.map((e) => e.status)).toEqual(["aguardando", "pendente", "confirmado"]);
  });

  it("mescla status, retificações e correções juntos em ordem cronológica", () => {
    const rectification = makeRectification({
      status: [
        { id: 101, status: "solicitada", comment: null, createdAt: "2026-01-03T08:00:00Z" },
      ],
    });
    const correction = makeCorrection({
      status: [
        { id: 201, status: "pendente", comment: null, createdAt: "2026-01-03T09:00:00Z" },
      ],
    });

    const events = mergeTimelineEvents(status, [rectification], [correction]);

    expect(events).toHaveLength(4);
    expect(events.map((e) => e.kind)).toEqual(["status", "status", "rectification", "correction"]);
  });

  it("key dos eventos de correção segue o padrão correction-{id}-{statusId}", () => {
    const correction = makeCorrection({ id: 5, status: [{ id: 42, status: "pendente", comment: null, createdAt: "2026-02-01T10:00:00Z" }] });
    const events = mergeTimelineEvents([], [], [correction]);

    expect(events[0].key).toBe("correction-5-42");
  });

  it("lida com corrections vazia sem quebrar", () => {
    const events = mergeTimelineEvents(status, [], []);
    expect(events).toHaveLength(2);
  });

  it("mantém compatibilidade com chamadas sem o terceiro argumento", () => {
    const rectification = makeRectification();
    const events = mergeTimelineEvents(status, [rectification]);

    expect(events).toHaveLength(3);
    expect(events.every((e) => e.kind !== "correction")).toBe(true);
  });
});

describe("getOpenCorrection", () => {
  it("retorna undefined quando não há correções", () => {
    expect(getOpenCorrection([])).toBeUndefined();
  });

  it("retorna a correção cujo último status é pendente", () => {
    const correction = makeCorrection();
    expect(getOpenCorrection([correction])).toBe(correction);
  });

  it("retorna a correção cujo último status é enviada", () => {
    const correction = makeCorrection({
      status: [
        { id: 201, status: "pendente", comment: null, createdAt: "2026-02-01T10:00:00Z" },
        { id: 202, status: "enviada",  comment: null, createdAt: "2026-02-02T10:00:00Z" },
      ],
    });
    expect(getOpenCorrection([correction])).toBe(correction);
  });

  it("retorna undefined quando a correção está aprovada", () => {
    const correction = makeCorrection({
      status: [
        { id: 201, status: "pendente", comment: null, createdAt: "2026-02-01T10:00:00Z" },
        { id: 202, status: "enviada",  comment: null, createdAt: "2026-02-02T10:00:00Z" },
        { id: 203, status: "aprovada", comment: null, createdAt: "2026-02-03T10:00:00Z" },
      ],
    });
    expect(getOpenCorrection([correction])).toBeUndefined();
  });

  it("retorna undefined quando a correção está rejeitada", () => {
    const correction = makeCorrection({
      status: [
        { id: 201, status: "pendente",  comment: null, createdAt: "2026-02-01T10:00:00Z" },
        { id: 202, status: "rejeitada", comment: null, createdAt: "2026-02-02T10:00:00Z" },
      ],
    });
    expect(getOpenCorrection([correction])).toBeUndefined();
  });

  it("retorna undefined para lista vazia chamada sem argumento", () => {
    expect(getOpenCorrection()).toBeUndefined();
  });
});

describe("hasOpenCorrection", () => {
  it("retorna false quando não há correções", () => {
    expect(hasOpenCorrection([])).toBe(false);
  });

  it("retorna true quando a última correção está pendente", () => {
    expect(hasOpenCorrection([makeCorrection()])).toBe(true);
  });

  it("retorna true quando a última correção está enviada", () => {
    const correction = makeCorrection({
      status: [
        { id: 201, status: "pendente", comment: null, createdAt: "2026-02-01T10:00:00Z" },
        { id: 202, status: "enviada",  comment: null, createdAt: "2026-02-02T10:00:00Z" },
      ],
    });
    expect(hasOpenCorrection([correction])).toBe(true);
  });

  it("retorna false quando a última correção está aprovada", () => {
    const correction = makeCorrection({
      status: [
        { id: 201, status: "pendente", comment: null, createdAt: "2026-02-01T10:00:00Z" },
        { id: 202, status: "aprovada", comment: null, createdAt: "2026-02-02T10:00:00Z" },
      ],
    });
    expect(hasOpenCorrection([correction])).toBe(false);
  });

  it("retorna false quando a última correção está rejeitada", () => {
    const correction = makeCorrection({
      status: [
        { id: 201, status: "pendente",  comment: null, createdAt: "2026-02-01T10:00:00Z" },
        { id: 202, status: "rejeitada", comment: null, createdAt: "2026-02-02T10:00:00Z" },
      ],
    });
    expect(hasOpenCorrection([correction])).toBe(false);
  });
});

describe("CORRECTION_ALLOWED_TRANSITIONS", () => {
  it("pendente só permite rejeitar diretamente", () => {
    expect(CORRECTION_ALLOWED_TRANSITIONS.pendente).toEqual(["rejeitada"]);
  });

  it("enviada permite aprovar ou rejeitar", () => {
    expect(CORRECTION_ALLOWED_TRANSITIONS.enviada).toEqual(["aprovada", "rejeitada"]);
  });

  it("aprovada e rejeitada são estados terminais", () => {
    expect(CORRECTION_ALLOWED_TRANSITIONS.aprovada).toEqual([]);
    expect(CORRECTION_ALLOWED_TRANSITIONS.rejeitada).toEqual([]);
  });
});
