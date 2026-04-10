import type { DocumentSimpleDetail } from "../domain/documentSimpleDetail";
import {
  Box,
  Flex,
  Text,
  Badge,
  HStack,
} from "@chakra-ui/react";
import DocumentStatusTimeLine, { statusColor, statusLabel } from "./DocumentStatusTimeLine";
interface DocumentDetailProps {
  data: DocumentSimpleDetail;
}

export default function DocumentStatusDetail({ data }: DocumentDetailProps) {

  const finalStatus = data.status[data.status.length - 1];

 return (
    <Box bg="white" p={6} borderRadius="xl" boxShadow="lg">
      {/* HEADER */}
      <Flex justify="space-between" align="center" mb={4}>
        <HStack gap={3}>
          <Text fontSize="xl" fontWeight="bold">
            Solicitação Nº
          </Text>

          <Badge fontSize="md" px={3} py={1} borderRadius="md">
            {data.protocol}
          </Badge>
        </HStack>

        <Badge
          colorScheme={statusColor[finalStatus.status]}
          fontSize="md"
          px={3}
          py={1}
        >
          {statusLabel[finalStatus.status]}
        </Badge>
      </Flex>

      {/* INFO */}
      <Flex justify="space-between" gap={5}mb={4}>
        <Text color="gray.600">
          <b>Data:</b> {new Date(data.createdAt).toLocaleString()}
        </Text>

        <Text color="gray.600">
          <b>Requerente:</b> {data.applicantName}
        </Text>
      </Flex>

      {/* TimeLine */}
      <DocumentStatusTimeLine status={data.status} showAllMessage/>

    </Box>
  );
}