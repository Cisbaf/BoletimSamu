import React from "react";
import { Box, Flex, Text, Textarea } from "@chakra-ui/react";
import type { Rectification, RectificationStatusValue } from "../../domain/documentDetail";
import { RECTIFICATION_ALLOWED_TRANSITIONS, STATUS_LABEL } from "../../utils/timeline";

interface RectificationResponseProps {
  rectification: Rectification;
  onSubmit: (status: RectificationStatusValue, comment: string) => Promise<unknown>;
}

const ACTION_LABEL: Record<RectificationStatusValue, string> = {
  solicitada: "Solicitada",
  agendada: "Agendar",
  concluida: "Concluir",
  cancelada: "Cancelar",
};

const ACTION_STYLE: Record<RectificationStatusValue, { color: string; activeBg: string; activeBorder: string }> = {
  solicitada: { color: "#6B21A8", activeBg: "#F3E8FF", activeBorder: "#A855F7" },
  agendada:   { color: "#1D4ED8", activeBg: "#DBEAFE", activeBorder: "#3B82F6" },
  concluida:  { color: "#166534", activeBg: "#DCFCE7", activeBorder: "#22C55E" },
  cancelada:  { color: "#991B1B", activeBg: "#FEE2E2", activeBorder: "#EF4444" },
};

// ─── RectificationResponse ─────────────────────────────────────────────────────
//
// Bloco exibido dentro do drawer "Novo Status" (DocumentResponse) quando o
// pedido tem uma retificação em aberto. Fecha o ciclo:
// solicitar retificação (público) → responder retificação (painel).

export default function RectificationResponse({ rectification, onSubmit }: RectificationResponseProps) {
  const lastStatus = rectification.status[rectification.status.length - 1];
  const allowed = RECTIFICATION_ALLOWED_TRANSITIONS[lastStatus.status] ?? [];

  const [selected, setSelected] = React.useState<RectificationStatusValue | null>(allowed[0] ?? null);
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setSelected(allowed[0] ?? null);
    setComment("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rectification.id, lastStatus.status]);

  // Estado terminal (concluída/cancelada) — nada a responder, só o histórico já visível na timeline.
  if (allowed.length === 0) return null;

  const handleSubmit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(selected, comment);
      setComment("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box border="1px solid #E9D5FF" bg="#FAF5FF" borderRadius="12px" p={4} mb={5}>
      <Flex align="center" gap={2} mb={3}>
        <Box w="8px" h="8px" borderRadius="full" bg="#A855F7" flexShrink={0} />
        <Text fontSize="13px" fontWeight="700" color="#6B21A8">
          Retificação em aberto — {STATUS_LABEL[lastStatus.status]}
        </Text>
      </Flex>

      {lastStatus.comment && (
        <Text fontSize="12px" color="#7E22CE" mb={3} lineHeight={1.6}>
          "{lastStatus.comment}"
        </Text>
      )}

      <Flex gap={3} mb={3}>
        {allowed.map((status) => {
          const style = ACTION_STYLE[status];
          const active = selected === status;
          return (
            <Box
              key={status}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(status)}
              onKeyDown={(e) => { if (e.key === "Enter") setSelected(status); }}
              flex={1}
              textAlign="center"
              py="9px"
              borderRadius="10px"
              fontSize="13px"
              fontWeight="700"
              cursor="pointer"
              border="2px solid"
              transition="all 0.15s"
              bg={active ? style.activeBg : "white"}
              borderColor={active ? style.activeBorder : "#E5E7EB"}
              color={active ? style.color : "#9CA3AF"}
            >
              {ACTION_LABEL[status]}
            </Box>
          );
        })}
      </Flex>

      <Textarea
        placeholder="Observação sobre a retificação (opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        bg="white"
        border="1px solid #E5E7EB"
        borderRadius="10px"
        fontSize="13px"
        minH="80px"
        _focus={{ borderColor: "#A855F7", boxShadow: "0 0 0 3px rgba(168,85,247,0.12)" }}
      />

      <Box
        role="button"
        tabIndex={0}
        onClick={submitting ? undefined : handleSubmit}
        onKeyDown={(e) => { if (e.key === "Enter" && !submitting) handleSubmit(); }}
        mt={3}
        textAlign="center"
        py="10px"
        bg={submitting ? "#C4B5FD" : "#A855F7"}
        color="white"
        borderRadius="10px"
        fontWeight="700"
        fontSize="13px"
        cursor={submitting ? "not-allowed" : "pointer"}
        transition="all 0.15s"
        _hover={submitting ? undefined : { bg: "#9333EA" }}
      >
        {submitting ? "Enviando..." : "Atualizar Retificação"}
      </Box>
    </Box>
  );
}
