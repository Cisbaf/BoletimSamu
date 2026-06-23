import { Box, Flex, Grid, GridItem, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import type { DocumentDetail } from "../../domain/documentDetail";
import BadgeStatusDetail from "./BadgeStatusDetail";
import BadgeDaysAwaiting from "./BadgeDaysAwaiting";
import { daysWaiting } from "../../utils/dates";
import { APPLICANT_TYPE_LABELS, RELATIONSHIP_DEGREE_LABELS } from "../../domain/documentSchemaForm";

interface Props {
  data: DocumentDetail;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Flex align="center" gap={2} mb={3}>
      <Box w="3px" h="16px" bg="#2563EB" borderRadius="full" flexShrink={0} />
      <Text fontSize="13px" fontWeight="700" color="#374151" letterSpacing="0.2px">
        {children}
      </Text>
    </Flex>
  )
}

function LV({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box>
      <Text
        fontSize="10px"
        fontWeight="700"
        color="#9CA3AF"
        textTransform="uppercase"
        letterSpacing="0.6px"
        mb="2px"
      >
        {label}
      </Text>
      <Text fontSize="13px" fontWeight="500" color="#111827">
        {value || <span style={{ color: "#D1D5DB" }}>—</span>}
      </Text>
    </Box>
  )
}

function Section({ children }: { children: ReactNode }) {
  return (
    <Box
      bg="white"
      border="1px solid #E5E7EB"
      borderRadius="12px"
      p={4}
    >
      {children}
    </Box>
  )
}

// ─── DocumentDetailView ───────────────────────────────────────────────────────

export default function DocumentDetailView({ data }: Props) {
  const latestStatus = data.status?.[data.status.length - 1];

  const applicantLabel = [
    APPLICANT_TYPE_LABELS[data.applicant.applicantType],
    data.applicant.relationshipDegree
      ? `› ${RELATIONSHIP_DEGREE_LABELS[data.applicant.relationshipDegree]}`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Flex direction="column" gap={4}>

      {/* ── Header da solicitação ──────────────────────────────────────── */}
      <Box
        bg="#EFF6FF"
        border="1px solid #BFDBFE"
        borderRadius="12px"
        p={4}
      >
        <Flex justify="space-between" align="flex-start" wrap="wrap" gap={3}>
          <Box>
            <Text fontSize="11px" fontWeight="700" color="#60A5FA" textTransform="uppercase" letterSpacing="0.6px" mb={1}>
              Protocolo
            </Text>
            <Text fontSize="20px" fontWeight="800" color="#1D4ED8" letterSpacing="-0.3px" fontFamily="mono">
              #{data.protocol}
            </Text>
            <Text fontSize="12px" color="#6B7280" mt={1}>
              {applicantLabel}
            </Text>
          </Box>

          <Flex direction="column" align="flex-end" gap={2}>
            <BadgeStatusDetail props={latestStatus} />
            {latestStatus.status === "aguardando" && (
              <BadgeDaysAwaiting days={daysWaiting(data.createdAt)} />
            )}
            <Text fontSize="11px" color="#6B7280" mt={1}>
              {new Date(data.createdAt).toLocaleString("pt-BR")}
            </Text>
          </Flex>
        </Flex>
      </Box>

      {/* ── Dados do Requerente ────────────────────────────────────────── */}
      <Section>
        <SectionTitle>Dados do Requerente</SectionTitle>
        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
          <GridItem>
            <Flex direction="column" gap={3}>
              <LV label="Nome Completo" value={data.applicant.fullName} />
              <LV label="RG" value={data.applicant.rg} />
              <LV label="Email" value={data.applicant.email} />
              <LV label="Finalidade" value={data.otherPurpose || data.purpose} />
            </Flex>
          </GridItem>
          <GridItem>
            <Flex direction="column" gap={3}>
              <LV label="CPF" value={data.applicant.cpf} />
              <LV label="Telefone" value={data.applicant.phone} />
              <LV label="Endereço" value={data.applicant.address} />
              <LV label="Motivo da Solicitação" value={data.incident.reason} />
            </Flex>
          </GridItem>
        </Grid>
      </Section>

      {/* ── Dados da Ocorrência ────────────────────────────────────────── */}
      <Section>
        <SectionTitle>Dados da Ocorrência</SectionTitle>
        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
          <GridItem>
            <Flex direction="column" gap={3}>
              <LV label="Nome do Paciente" value={data.incident.patientName} />
              <LV label="Data da Ocorrência" value={data.incident.date} />
              <LV label="Hora da Ocorrência" value={data.incident.time} />
            </Flex>
          </GridItem>
          <GridItem>
            <Flex direction="column" gap={3}>
              <LV label="Município" value={data.incident.city} />
              <LV label="Bairro" value={data.incident.neighborhood} />
              <LV label="Endereço" value={data.incident.address} />
            </Flex>
          </GridItem>
        </Grid>

        {data.incident.attendanceLocation && (
          <Box mt={4} pt={4} borderTop="1px solid #F3F4F6">
            <LV label="Local de Atendimento" value={data.incident.attendanceLocation} />
          </Box>
        )}
      </Section>

      {/* ── Observações ────────────────────────────────────────────────── */}
      {data.incident.notes && (
        <Section>
          <SectionTitle>Observações</SectionTitle>
          <Text fontSize="13px" color="#374151" lineHeight={1.7}>
            {data.incident.notes}
          </Text>
        </Section>
      )}
    </Flex>
  );
}
