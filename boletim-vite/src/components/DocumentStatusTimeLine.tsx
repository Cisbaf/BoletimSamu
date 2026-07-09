import { Box, Flex, Text } from "@chakra-ui/react";
import type { Rectification, Status } from "../domain/documentDetail";
import { Tooltip } from "./ui/tooltip";
import { truncateText } from "../utils/truncateText";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  STATUS_STYLE,
  mergeTimelineEvents,
  type TimelineEvent,
} from "../utils/timeline";

interface TimeLineProps {
  status: Status[];
  rectifications?: Rectification[];
  showAllMessage?: boolean;
}

// ─── Mapeamentos exportados (usados em DocumentStatusDetail) ──────────────────
// Reexportados de utils/timeline.ts, que também cobre os status de
// retificação — mantém uma única fonte de verdade para rótulos/cores.

export const statusColor = STATUS_COLOR;
export const statusLabel = STATUS_LABEL;

// ─── Vertical timeline (página do usuário) ────────────────────────────────────

function VerticalTimeLine({ events }: { events: TimelineEvent[] }) {
  return (
    <Box>
      <Text fontWeight="700" fontSize="13px" color="#374151" mb={5}>
        Linha do Tempo
      </Text>

      <Flex direction="column">
        {events.map((item, index) => {
          const isLast = index === events.length - 1;
          const style = STATUS_STYLE[item.status] ?? STATUS_STYLE.aguardando;

          return (
            <Flex key={item.key} gap={4}>
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
                    {item.label}
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

function HorizontalTimeLine({ events }: { events: TimelineEvent[] }) {
  const finalEvent = events[events.length - 1];

  if (!finalEvent) return null;

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
          bg={`${statusColor[finalEvent.status] ?? "gray"}.400`}
          width="100%"
          zIndex={0}
        />

        {events.map((item, index) => {
          const isLast = index === events.length - 1;
          const isCompleted = index <= events.length - 1;
          const color = statusColor[item.status] ?? "gray";

          return (
            <Flex
              key={item.key}
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
                    ? `${color}.500`
                    : isCompleted
                    ? `${color}.300`
                    : "gray.300"
                }
                border="3px solid white"
                boxShadow="md"
              />

              <Text mt={2} fontSize="sm" fontWeight="medium" textAlign="center">
                {item.label}
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

export default function DocumentStatusTimeLine({ status, rectifications, showAllMessage }: TimeLineProps) {
  const events = mergeTimelineEvents(status, rectifications);

  if (showAllMessage) {
    return <VerticalTimeLine events={events} />;
  }
  return <HorizontalTimeLine events={events} />;
}
