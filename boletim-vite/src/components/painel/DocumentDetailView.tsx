import {
  Box,
  Heading,
  Text,
  Grid,
  GridItem,
  VStack,
  Flex,
} from "@chakra-ui/react";
import type { DocumentDetail } from "../../domain/documentDetail";
import BadgeStatusDetail from "./BadgeStatusDetail";
import BadgeDaysAwaiting from "./BadgeDaysAwaiting";
import { daysWaiting } from "../../utils/dates";
import { APPLICANT_TYPE_LABELS, RELATIONSHIP_DEGREE_LABELS } from "../../domain/documentSchemaForm";

interface Props {
  data: DocumentDetail;
}

export default function DocumentDetailView({ data }: Props) {
  const latestStatus = data.status?.[data.status.length - 1];

  return (
    <Flex
      p={1}
      bg="gray.50"
      direction={"column"}
      gap={5}
      borderRadius="lg">
      {/* HEADER */}
      <VStack align="stretch" gap={2}>
        <Heading size="md" color="blue.600">
          Solicitação Nº {data.protocol}
        </Heading>

          <Text>
            <strong>Solicitante:</strong>{" "}
            {APPLICANT_TYPE_LABELS[data.applicant.applicantType]}
            {" "}{data.applicant.relationshipDegree && `> ${RELATIONSHIP_DEGREE_LABELS[data.applicant.relationshipDegree]}`}
          </Text>
        <Grid templateColumns="repeat(3, 1fr)" gap={4}>
          <Text>
            <strong>Data de Criação:</strong>{" "}
            {new Date(data.createdAt).toLocaleString()}
          </Text>

          <Text textAlign="right">
            <strong>Status: </strong>
            <BadgeStatusDetail props={latestStatus}/>
            { latestStatus.status == "aguardando" &&
            <BadgeDaysAwaiting
              days={daysWaiting(data.createdAt)}/>
            }
          </Text>
        </Grid>
      </VStack>

      {/* <Divider my={4} /> */}

      {/* DADOS DO REQUERENTE */}
      <Heading size="md" color="blue.600" mb={-2}>
        Dados do Requerente
      </Heading>

      <Grid templateColumns="repeat(2, 1fr)" gap={3}>
        <GridItem>
          <Text>
            <strong>Nome Completo:</strong> {data.applicant.fullName}
          </Text>
          <Text>
            <strong>RG:</strong> {data.applicant.rg}
          </Text>
          <Text>
            <strong>Email:</strong> {data.applicant.email}
          </Text>
          <Text>
            <strong>Finalidade:</strong>{" "}
            {data.otherPurpose || data.purpose}
          </Text>
        </GridItem>

        <GridItem>
          <Text>
            <strong>CPF:</strong> {data.applicant.cpf}
          </Text>
          <Text>
            <strong>Telefone:</strong> {data.applicant.phone}
          </Text>
          <Text>
            <strong>Endereço:</strong> {data.applicant.address}
          </Text>
          <Text>
            <strong>Motivo da Solicitação:</strong>{" "}
            {data.incident.reason}
          </Text>
        </GridItem>
      </Grid>

      {/* <Divider my={4} /> */}

      {/* DADOS DA OCORRÊNCIA */}
      <Heading size="md" color="blue.600" mb={-2}>
        Dados da Ocorrência
      </Heading>

      <Grid templateColumns="repeat(2, 1fr)" gap={3}>
        <GridItem>
          <Text>
            <strong>Paciente:</strong> {data.incident.patientName}
          </Text>
          <Text>
            <strong>Hora da Ocorrência:</strong> {data.incident.time}
          </Text>
          <Text>
            <strong>Bairro:</strong> {data.incident.neighborhood}
          </Text>
          <Text>
            <strong>Local Atendimento:</strong>{" "}
            {data.incident.attendanceLocation}
          </Text>
        </GridItem>

        <GridItem>
          <Text>
            <strong>Data da Ocorrência:</strong>{" "}
            {data.incident.date}
          </Text>
          <Text>
            <strong>Endereço:</strong> {data.incident.address}
          </Text>
          <Text>
            <strong>Município:</strong> {data.incident.city}
          </Text>
        </GridItem>
      </Grid>

      {/* OBSERVAÇÕES */}
      {data.incident.notes && (
        <>
          {/* <Divider my={4} /> */}
          <Heading size="sm" mb={2}>
            Observações
          </Heading>
          <Box
            p={3}
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            bg="white"
          >
            <Text>{data.incident.notes}</Text>
          </Box>
        </>
      )}
    </Flex>
  );
}