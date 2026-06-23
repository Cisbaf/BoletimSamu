import { Box, Flex, Text } from "@chakra-ui/react";
import type { Status } from "../domain/documentDetail";
import { Tooltip } from "./ui/tooltip";
import { truncateText } from "../utils/truncateText";

interface TimeLineProps {
  status: Status[];
  showAllMessage?: boolean;
}

// ─── Mapeamentos exportados (usados em DocumentStatusDetail) ──────────────────

export const statusColor = {
  aguardando: "yellow",
  confirmado: "green",
  cancelado:  "red",
};

export const statusLabel = {
  aguardando: "Aguardando",
  confirmado: "Confirmado",
  cancelado:  "Cancelado",
};

// ─── Config de cores para timeline vertical ───────────────────────────────────

const STATUS_STYLE: Record<string, {
  dot: string; line: string; badge: string; badgeColor: string; badgeBorder: string; commentBorder: string
}> = {
  aguardando: {
    dot:           "#F59E0B",
    line:          "#FDE68A",
    badge:         "#FEF9C3",
    badgeColor:    "#854D0E",
    badgeBorder:   "#FDE68A",
    commentBorder: "#F59E0B",
  },
  confirmado: {
    dot:           "#22C55E",
    line:          "#BBF7D0",
    badge:         "#DCFCE7",
    badgeColor:    "#166534",
    badgeBorder:   "#BBF7D0",
    commentBorder: "#22C55E",
  },
  cancelado: {
    dot:           "#EF4444",
    line:          "#FECACA",
    badge:         "#FEE2E2",
    badgeColor:    "#991B1B",
    badgeBorder:   "#FECACA",
    commentBorder: "#EF4444",
  },
}

// ─── Vertical timeline (página do usuário) ────────────────────────────────────

function VerticalTimeLine({ status }: { status: Status[] }) {
  return (
    <Box>
      <Text fontWeight="700" fontSize="13px" color="#374151" mb={5}>
        Linha do Tempo
      </Text>

      <Flex direction="column">
        {status.map((item, index) => {
          const isLast = index === status.length - 1;
          const style = STATUS_STYLE[item.status] ?? STATUS_STYLE.aguardando;

          return (
            <Flex key={item.id} gap={4}>
              {/* Coluna esquerda: dot + linha vertical */}
              <Flex direction="column" align="center" flexShrink={0} pt="2px">
                {/* Dot */}
                <Box
                  w="14px"
                  h="14px"
                  borderRadius="full"
                  bg={style.dot}
                  border="2.5px solid white"
                  boxShadow={`0 0 0 2px ${style.dot}`}
                  flexShrink={0}
                />
                {/* Linha vertical de conexão */}
                {!isLast && (
                  <Box
                    w="2px"
                    flex={1}
                    minH="32px"
                    bg={style.line}
                    mt="4px"
                    mb="4px"
                  />
                )}
              </Flex>

              {/* Coluna direita: conteúdo */}
              <Box pb={isLast ? 0 : 4} flex={1} minW={0}>
                {/* Badge de status + data */}
                <Flex align="center" gap={2} flexWrap="wrap" mb={item.comment ? 2 : 0}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "2px 10px",
                    background: style.badge,
                    color: style.badgeColor,
                    border: `1px solid ${style.badgeBorder}`,
                    borderRadius: "9999px",
                    fontSize: "12px",
                    fontWeight: "700",
                    whiteSpace: "nowrap",
                  }}>
                    <span style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: style.badgeColor, flexShrink: 0, display: "inline-block",
                    }} />
                    {statusLabel[item.status] ?? item.status}
                  </span>

                  <Text fontSize="12px" color="#9CA3AF" whiteSpace="nowrap">
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                    {item.userName && ` · ${item.userName}`}
                  </Text>
                </Flex>

                {/* Card de comentário */}
                {item.comment && (
                  <Box
                    mt={2}
                    p={4}
                    bg="#F9FAFB"
                    border="1px solid #E5E7EB"
                    borderLeft={`3px solid ${style.commentBorder}`}
                    borderRadius="10px"
                  >
                    <Text
                      fontSize="13px"
                      color="#374151"
                      lineHeight={1.75}
                      whiteSpace="pre-wrap"
                    >
                      {item.comment}
                    </Text>
                  </Box>
                )}
              </Box>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
}

// ─── Horizontal timeline (painel admin) ──────────────────────────────────────

function HorizontalTimeLine({ status }: { status: Status[] }) {
  const finalStatus = status[status.length - 1];

  return (
    <Box mb={8}>
      <Text fontWeight="bold" mb={6}>
        Linha do Tempo
      </Text>

      <Flex position="relative" align="center">
        {/* Linha base */}
        <Box
          position="absolute"
          top="10px"
          left="0"
          right="0"
          height="2px"
          bg="gray.200"
          zIndex={0}
        />

        {/* Linha progresso */}
        <Box
          position="absolute"
          top="10px"
          left="0"
          height="2px"
          bg={`${statusColor[finalStatus.status]}.400`}
          width="100%"
          zIndex={0}
        />

        {status.map((item, index) => {
          const isLast = index === status.length - 1;
          const isCompleted = index <= status.length - 1;

          return (
            <Flex
              key={item.id}
              direction="column"
              align="center"
              flex={1}
              zIndex={1}
            >
              {/* Bolinha */}
              <Box
                w="20px"
                h="20px"
                borderRadius="full"
                bg={
                  isLast
                    ? `${statusColor[item.status]}.500`
                    : isCompleted
                    ? `${statusColor[item.status]}.300`
                    : "gray.300"
                }
                border="3px solid white"
                boxShadow="md"
              />

              <Text mt={2} fontSize="sm" fontWeight="medium">
                {statusLabel[item.status]}
              </Text>

              <Text fontSize="xs" color="gray.500">
                {new Date(item.createdAt).toLocaleString()}
                {item.userName && ` - ${item.userName}`}
              </Text>

              {item.comment && (
                <Tooltip content={item.comment} showArrow>
                  <Text
                    fontSize="xs"
                    color="gray.600"
                    mt={2}
                    textAlign="center"
                    maxW="120px"
                    cursor="pointer"
                  >
                    {truncateText(item.comment)}
                  </Text>
                </Tooltip>
              )}
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function DocumentStatusTimeLine({ status, showAllMessage }: TimeLineProps) {
  if (showAllMessage) {
    return <VerticalTimeLine status={status} />;
  }
  return <HorizontalTimeLine status={status} />;
}
