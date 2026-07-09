import { Box, Flex, Skeleton, Stack, Table } from "@chakra-ui/react";
import React from "react";
import { useFilters } from "../../context/FilterContext";
import { useGetAuth } from "../../hooks/useGetAuth";
import { ToCamelCase } from "../../utils/camelCase";
import { PaginationForDocs } from "./Pagination";
import DocumentTable from "./DocumentTable";
import useDocumentList from "../../hooks/useDocumentList";
import BadgeDaysAwaiting from "./BadgeDaysAwaiting";
import BadgeRectificationStatus from "./BadgeRectificationStatus";
import { daysWaiting } from "../../utils/dates";
import { DocumentDetailProvider } from "../../context/DocumentDetail";
import { DocumentShowDetail, type DocumentShowDetailType } from "./DocumentShowDetail";
import { getOpenRectification } from "../../utils/timeline";
import { ApiBaseUrl } from "../../settings";

interface RectifyingDocumentsProps {
  /** Chamado após uma retificação (ou o pedido) mudar de status — usado para atualizar os contadores das abas. */
  onChanged?: () => void;
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <Stack gap={0}>
      {[1, 2, 3, 4].map((i) => (
        <Flex
          key={i}
          gap={4}
          px={4}
          py="14px"
          borderBottom="1px solid #F3F4F6"
          align="center"
        >
          <Skeleton h="22px" w="72px" borderRadius="6px" />
          <Skeleton h="16px" flex={1} borderRadius="6px" />
          <Skeleton h="16px" w="90px" borderRadius="6px" />
          <Skeleton h="22px" w="110px" borderRadius="full" />
          <Skeleton h="32px" w="34px" borderRadius="8px" />
        </Flex>
      ))}
    </Stack>
  )
}

// ─── RectifyingDocuments ────────────────────────────────────────────────────────
//
// Aba "Retificações": lista pedidos com uma retificação em andamento
// (solicitada ou agendada), reaproveitando `?status=retificando` no mesmo
// endpoint de listagem usado pela aba "Aguardando".

export default function RectifyingDocuments({ onChanged }: RectifyingDocumentsProps) {
  const documentDetailRef = React.useRef<DocumentShowDetailType | null>(null);
  const { queryParams, setFiltersBatch, filters } = useFilters();
  const hookUseDocumentList = useDocumentList();
  const { documents, setAll } = hookUseDocumentList;
  const { data, refetch, loading } = useGetAuth({
    url: `${ApiBaseUrl}/document/requests/`,
    params: queryParams,
    autoFetch: false,
    transform: ToCamelCase,
  });

  React.useEffect(() => {
    setFiltersBatch({ status: "retificando", page: 1 });
  }, []);

  React.useEffect(() => {
    if (!filters.status) return;
    refetch();
  }, [queryParams]);

  React.useEffect(() => {
    if (data && data.results) setAll(data.results);
  }, [data]);

  return (
    <>
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <DocumentTable
          documents={documents}
          showDetail={documentDetailRef.current?.showDocument}
          renderExtraCols={["Retificação", "Aberta há"]}
          renderRow={(item) => {
            const openRectification = getOpenRectification(item.rectifications);
            const lastStatus = openRectification?.status[openRectification.status.length - 1];

            return (
              <>
                <Table.Cell px={4} py={4}>
                  {lastStatus && <BadgeRectificationStatus props={lastStatus} />}
                </Table.Cell>
                <Table.Cell px={4} py={4}>
                  {openRectification && (
                    <BadgeDaysAwaiting days={daysWaiting(openRectification.createdAt)} />
                  )}
                </Table.Cell>
              </>
            );
          }}
        />
      )}

      <Box mt={4}>
        <PaginationForDocs count={data?.count} pageSize={5} />
      </Box>

      <DocumentDetailProvider
        useDocumentList={hookUseDocumentList}
        removedForNewStatus
        onChanged={onChanged}
      >
        <DocumentShowDetail ref={documentDetailRef} />
      </DocumentDetailProvider>
    </>
  );
}
