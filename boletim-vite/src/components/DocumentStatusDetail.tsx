import React from "react";
import type { DocumentSimpleDetail } from "../domain/documentSimpleDetail";
import { Box, Flex, Text } from "@chakra-ui/react";
import DocumentStatusTimeLine, { statusLabel } from "./DocumentStatusTimeLine";
import RectificationModal from "./RectificationModal";
import { hasOpenRectification } from "../utils/timeline";

interface DocumentDetailProps {
  data: DocumentSimpleDetail;
  /** Chamado após a retificação ser aberta com sucesso (ex.: refetch). */
  onRectificationCreated?: () => void;
}

// ─── Config de status ─────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { bg: string; color: string; border: string }> = {
  confirmado: { bg: "#DCFCE7", color: "#166534", border: "#BBF7D0" },
  aguardando: { bg: "#FEF9C3", color: "#854D0E", border: "#FDE68A" },
  cancelado:  { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" },
}

// ─── DocumentStatusDetail ─────────────────────────────────────────────────────

export default function DocumentStatusDetail({ data, onRectificationCreated }: DocumentDetailProps) {
  const [rectificationOpen, setRectificationOpen] = React.useState(false);
  const finalStatus = data.status[data.status.length - 1];
  const badge = STATUS_BADGE[finalStatus.status] ?? { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };

  const canRequestRectification =
    finalStatus.status === "confirmado" && !hasOpenRectification(data.rectifications);

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      boxShadow="0 1px 3px rgba(0,0,0,0.05), 0 4px 24px rgba(0,0,0,0.07)"
      overflow="hidden"
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <Box px={6} pt={6} pb={5} borderBottom="1px solid #F3F4F6">
        <Flex justify="space-between" align="flex-start" wrap="wrap" gap={3}>
          {/* Protocolo */}
          <Flex align="center" gap={3}>
            <Box
              w="36px"
              h="36px"
              bg="#EFF6FF"
              borderRadius="10px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path
                  d="M9 12h6M9 16h6M7 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M9 4a2 2 0 0 1 4 0H9z"
                  stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </Box>
            <Box>
              <Text fontSize="11px" fontWeight="700" color="#9CA3AF" textTransform="uppercase" letterSpacing="0.5px" mb="2px">
                Solicitação
              </Text>
              <Text fontSize="20px" fontWeight="800" color="#111827" letterSpacing="-0.3px" fontFamily="mono">
                {data.protocol}
              </Text>
            </Box>
          </Flex>

          {/* Badge de status */}
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 14px",
            background: badge.bg,
            color: badge.color,
            border: `1px solid ${badge.border}`,
            borderRadius: "9999px",
            fontSize: "13px",
            fontWeight: "700",
          }}>
            <span style={{
              width: "7px", height: "7px", borderRadius: "50%",
              background: badge.color, flexShrink: 0, display: "inline-block",
            }} />
            {statusLabel[finalStatus.status] ?? finalStatus.status}
          </span>
        </Flex>

        {/* Meta info */}
        <Flex mt={4} gap={6} wrap="wrap">
          <Box>
            <Text fontSize="10px" fontWeight="700" color="#9CA3AF" textTransform="uppercase" letterSpacing="0.5px" mb="2px">
              Data da Solicitação
            </Text>
            <Text fontSize="13px" fontWeight="500" color="#374151">
              {new Date(data.createdAt).toLocaleString("pt-BR")}
            </Text>
          </Box>
          <Box>
            <Text fontSize="10px" fontWeight="700" color="#9CA3AF" textTransform="uppercase" letterSpacing="0.5px" mb="2px">
              Requerente
            </Text>
            <Text fontSize="13px" fontWeight="500" color="#374151">
              {data.applicantName}
            </Text>
          </Box>
        </Flex>
        {/* ── Ação de retificação ─────────────────────────────────── */}
        {canRequestRectification && (
          <Box
            role="button"
            tabIndex={0}
            onClick={() => setRectificationOpen(true)}
            onKeyDown={(e) => { if (e.key === "Enter") setRectificationOpen(true); }}
            mt={4}
            display="inline-flex"
            alignItems="center"
            gap={2}
            px={4}
            py="9px"
            bg="#F3E8FF"
            color="#7C3AED"
            border="1px solid #E9D5FF"
            borderRadius="10px"
            fontSize="13px"
            fontWeight="700"
            cursor="pointer"
            transition="all 0.15s"
            _hover={{ bg: "#E9D5FF" }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
                stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
            Solicitar Retificação
          </Box>
        )}
      </Box>

      {/* ── Timeline ───────────────────────────────────────────────── */}
      <Box px={6} py={6}>
        <DocumentStatusTimeLine
          status={data.status}
          rectifications={data.rectifications}
          showAllMessage
        />
      </Box>

      <RectificationModal
        protocol={data.protocol}
        open={rectificationOpen}
        onOpenChange={setRectificationOpen}
        onSuccess={onRectificationCreated}
      />
    </Box>
  );
}
