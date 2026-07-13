import { Box, Flex, Skeleton, Stack, Table } from "@chakra-ui/react";
import React from "react";
import { useFilters } from "../../context/FilterContext";
import { useGetAuth } from "../../hooks/useGetAuth";
import { ToCamelCase } from "../../utils/camelCase";
import { PaginationForDocs } from "./Pagination";
import DocumentTable from "./DocumentTable";
import useDocumentList from "../../hooks/useDocumentList";
import BadgeDaysAwaiting from "./BadgeDaysAwaiting";
import { daysWaiting } from "../../utils/dates";
import { DocumentDetailProvider } from "../../context/DocumentDetail";
import { DocumentShowDetail, type DocumentShowDetailType } from "./DocumentShowDetail";
import { ApiBaseUrl } from "../../settings";
import { hasOpenCorrection } from "../../utils/timeline";
import { STATUS_STYLE } from "../../utils/timeline";

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

interface PendingDocumentsProps {
  /** Chamado após uma solicitação mudar de status — usado para atualizar os contadores das abas. */
  onChanged?: () => void;
}

// ─── PendingDocuments ─────────────────────────────────────────────────────────

export default function PendingDocuments({ onChanged }: PendingDocumentsProps) {
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
    setFiltersBatch({ status: "aguardando", page: 1 });
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
          renderExtraCols={["Tempo de Espera", "Situação"]}
          renderRow={(item) => (
            <>
              <Table.Cell px={4} py={4}>
                <BadgeDaysAwaiting days={daysWaiting(item.createdAt)} />
              </Table.Cell>
              <Table.Cell px={4} py={4}>
                {/* Badge "Aguardando Correção" — exibido apenas se o payload
                    da listagem trouxer corrections preenchido.
                    Se o backend não expuser esse campo no serializer resumido,
                    a checagem defensiva abaixo garante que nada quebre. */}
                {Array.isArray(item.corrections) && hasOpenCorrection(item.corrections) && (
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "3px 10px",
                    background: STATUS_STYLE.pendente.badge,
                    color: STATUS_STYLE.pendente.badgeColor,
                    border: `1px solid ${STATUS_STYLE.pendente.badgeBorder}`,
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: "600",
                    whiteSpace: "nowrap",
                    lineHeight: 1.5,
                  }}>
                    <span style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: STATUS_STYLE.pendente.badgeColor,
                      flexShrink: 0,
                      display: "inline-block",
                    }} />
                    Aguardando Correção
                  </span>
                )}
              </Table.Cell>
            </>
          )}
        />
      )}

      <Box mt={4}>
        <PaginationForDocs count={data?.count} pageSize={5} />
      </Box>

      <DocumentDetailProvider useDocumentList={hookUseDocumentList} removedForNewStatus onChanged={onChanged}>
        <DocumentShowDetail ref={documentDetailRef} />
      </DocumentDetailProvider>
    </>
  );
}
