import React from "react";
import { Box, Flex, Text, Textarea, Link } from "@chakra-ui/react";
import type { Correction, CorrectionStatusValue } from "../../domain/documentCorrection";
import type { DocumentDetail } from "../../domain/documentDetail";
import { CORRECTION_ALLOWED_TRANSITIONS, STATUS_LABEL } from "../../utils/timeline";

interface CorrectionReviewResponseProps {
  correction: Correction;
  detail: DocumentDetail;
  onSubmit: (status: CorrectionStatusValue, comment: string) => Promise<unknown>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolve o valor antigo de um campo a partir do detail do pedido,
 * usando a chave estruturada (ex.: "applicant.cpf" → detail.applicant.cpf).
 * Para campos "attachment.*" retorna null (tratado separadamente).
 */
function resolveOldValue(fieldKey: string, detail: DocumentDetail): string | null {
  const [ns, ...rest] = fieldKey.split(".");
  const key = rest.join(".");

  if (ns === "applicant") {
    const map: Record<string, string | null> = {
      full_name: detail.applicant.fullName,
      cpf: detail.applicant.cpf,
      rg: detail.applicant.rg,
      email: detail.applicant.email,
      address: detail.applicant.address,
      phone: detail.applicant.phone,
    };
    return map[key] ?? null;
  }

  if (ns === "incident") {
    const map: Record<string, string | null | undefined> = {
      date: detail.incident.date,
      time: detail.incident.time,
      patient_name: detail.incident.patientName,
      city: detail.incident.city,
      neighborhood: detail.incident.neighborhood,
      address: detail.incident.address,
      reason: detail.incident.reason,
      attendance_location: detail.incident.attendanceLocation,
      other_location_description: detail.incident.otherLocationDescription,
      occurrence_number: detail.incident.occurrenceNumber,
      notes: detail.incident.notes,
    };
    return map[key] ?? null;
  }

  if (ns === "document") {
    if (key === "other_purpose") return detail.otherPurpose;
  }

  return null;
}

const ACTION_LABEL: Partial<Record<CorrectionStatusValue, string>> = {
  aprovada: "✓ Aprovar Correções",
  rejeitada: "✕ Rejeitar Resposta",
};

const ACTION_STYLE: Partial<Record<CorrectionStatusValue, { color: string; activeBg: string; activeBorder: string }>> = {
  aprovada: { color: "#166534", activeBg: "#DCFCE7", activeBorder: "#22C55E" },
  rejeitada: { color: "#991B1B", activeBg: "#FEE2E2", activeBorder: "#EF4444" },
};

// ─── CorrectionReviewResponse ─────────────────────────────────────────────────

export default function CorrectionReviewResponse({
  correction,
  detail,
  onSubmit,
}: CorrectionReviewResponseProps) {
  const lastStatus = correction.status[correction.status.length - 1];
  const allowed = CORRECTION_ALLOWED_TRANSITIONS[lastStatus.status] ?? [];

  const [selected, setSelected] = React.useState<CorrectionStatusValue | null>(
    allowed.length > 0 ? (allowed.includes("aprovada") ? "aprovada" : allowed[0]) : null
  );
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const def = allowed.includes("aprovada") ? "aprovada" : (allowed[0] ?? null);
    setSelected(def);
    setComment("");
    setSubmitError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correction.id, lastStatus.status]);

  if (allowed.length === 0) return null;

  const handleSubmit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await onSubmit(selected, comment);
      if (result) {
        setComment("");
      } else {
        // onSubmit retornou null/undefined → erro já foi tratado pelo hook
        // (toast genérico + loading oculto). Aqui exibimos mensagem inline
        // para o caso de aprovação com validação 400.
        setSubmitError("Não foi possível processar a decisão. Verifique se todos os campos foram preenchidos pelo cidadão e tente novamente.");
      }
    } catch (err: any) {
      // Trata erro 400 do backend (validação na aprovação)
      const message =
        err?.data?.detail ||
        err?.data?.non_field_errors?.[0] ||
        err?.message ||
        "Erro ao processar a solicitação.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box border="1px solid #A5F3FC" bg="#ECFEFF" borderRadius="12px" p={4} mb={5}>
      {/* Cabeçalho */}
      <Flex align="center" gap={2} mb={4}>
        <Box w="8px" h="8px" borderRadius="full" bg="#06B6D4" flexShrink={0} />
        <Text fontSize="13px" fontWeight="700" color="#0E7490">
          Correção enviada pelo cidadão — {STATUS_LABEL[lastStatus.status]}
        </Text>
      </Flex>

      {/* Campos da correção */}
      <Flex direction="column" gap={4} mb={4}>
        {correction.fields.map((field) => {
          const isAttachment = field.fieldKey.startsWith("attachment.");
          const docType = isAttachment ? field.fieldKey.replace("attachment.", "") : null;
          const currentDoc = docType
            ? detail.documents.find((d) => d.documentType === docType)
            : null;

          const oldValue = isAttachment ? null : resolveOldValue(field.fieldKey, detail);

          return (
            <Box
              key={field.id}
              border="1px solid #E5E7EB"
              borderRadius="10px"
              p={3}
              bg="white"
            >
              {/* Label + comentário do admin */}
              <Text fontSize="12px" fontWeight="700" color="#111827" mb={1}>
                {field.fieldLabel}
              </Text>
              <Box
                p={2}
                bg="#FFF7ED"
                border="1px solid #FED7AA"
                borderRadius="8px"
                mb={3}
              >
                <Text fontSize="11px" fontWeight="600" color="#9A3412" mb={0.5}>
                  Comentário do admin:
                </Text>
                <Text fontSize="12px" color="#7C2D12">
                  {field.adminComment}
                </Text>
              </Box>

              {/* Valor antigo vs novo */}
              <Flex gap={3} direction={{ base: "column", md: "row" }}>
                {/* Valor antigo */}
                <Box flex={1}>
                  <Text fontSize="10px" fontWeight="700" color="#9CA3AF" textTransform="uppercase" letterSpacing="0.5px" mb={1}>
                    Valor atual (antes)
                  </Text>
                  {isAttachment ? (
                    currentDoc ? (
                      <Link
                        href={currentDoc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        fontSize="12px"
                        color="#2563EB"
                        fontWeight="500"
                        textDecoration="underline"
                      >
                        Ver arquivo atual
                      </Link>
                    ) : (
                      <Text fontSize="12px" color="#D1D5DB">Nenhum arquivo anexado</Text>
                    )
                  ) : (
                    <Text fontSize="12px" color={oldValue ? "#374151" : "#D1D5DB"} fontWeight="500">
                      {oldValue ?? "—"}
                    </Text>
                  )}
                </Box>

                {/* Seta */}
                <Flex align="center" justify="center" flexShrink={0}>
                  <Text fontSize="16px" color="#9CA3AF">→</Text>
                </Flex>

                {/* Valor novo */}
                <Box flex={1}>
                  <Text fontSize="10px" fontWeight="700" color="#9CA3AF" textTransform="uppercase" letterSpacing="0.5px" mb={1}>
                    Novo valor (cidadão)
                  </Text>
                  {field.submittedAt === null ? (
                    <Text fontSize="12px" color="#D1D5DB">Aguardando envio</Text>
                  ) : isAttachment ? (
                    field.newFile ? (
                      <Link
                        href={field.newFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        fontSize="12px"
                        color="#2563EB"
                        fontWeight="500"
                        textDecoration="underline"
                      >
                        Ver novo arquivo
                      </Link>
                    ) : (
                      <Text fontSize="12px" color="#D1D5DB">Sem arquivo enviado</Text>
                    )
                  ) : (
                    <Text fontSize="12px" color={field.newValue ? "#166534" : "#D1D5DB"} fontWeight="600">
                      {field.newValue ?? "—"}
                    </Text>
                  )}
                </Box>
              </Flex>
            </Box>
          );
        })}
      </Flex>

      {/* Seletor de decisão */}
      <Flex gap={3} mb={3}>
        {(allowed as CorrectionStatusValue[]).filter((s) => ACTION_LABEL[s]).map((status) => {
          const style = ACTION_STYLE[status];
          if (!style) return null;
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

      {/* Comentário opcional */}
      <Textarea
        placeholder="Comentário sobre a decisão (opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        bg="white"
        border="1px solid #E5E7EB"
        borderRadius="10px"
        fontSize="13px"
        minH="70px"
        _focus={{ borderColor: "#06B6D4", boxShadow: "0 0 0 3px rgba(6,182,212,0.12)" }}
      />

      {/* Erro de validação do backend */}
      {submitError && (
        <Box mt={2} p={3} bg="#FEE2E2" border="1px solid #FECACA" borderRadius="8px">
          <Text fontSize="12px" color="#991B1B">
            {submitError}
          </Text>
        </Box>
      )}

      {/* Botão de envio */}
      <Box
        role="button"
        tabIndex={0}
        onClick={submitting ? undefined : handleSubmit}
        onKeyDown={(e) => { if (e.key === "Enter" && !submitting) handleSubmit(); }}
        mt={3}
        textAlign="center"
        py="10px"
        bg={submitting ? "#A5F3FC" : "#06B6D4"}
        color="white"
        borderRadius="10px"
        fontWeight="700"
        fontSize="13px"
        cursor={submitting ? "not-allowed" : "pointer"}
        transition="all 0.15s"
        _hover={submitting ? undefined : { bg: "#0891B2" }}
      >
        {submitting ? "Enviando..." : "Confirmar Decisão"}
      </Box>
    </Box>
  );
}
