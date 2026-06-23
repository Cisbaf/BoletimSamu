import { Box, Flex, Table, Tabs, Text } from "@chakra-ui/react";
import React from "react";
import { useFilters } from "../../context/FilterContext";
import { useGetAuth } from "../../hooks/useGetAuth";
import { ToCamelCase } from "../../utils/camelCase";
import { PaginationForDocs } from "./Pagination";
import useDocumentList from "../../hooks/useDocumentList";
import DocumentFilters from "./DocumentFilters";
import { DynamicFilter } from "./DinamicFilter";
import { FaSearch, FaSearchengin } from "react-icons/fa";
import DocumentTable from "./DocumentTable";
import { Tooltip } from "../ui/tooltip";
import { formatToBRDate } from "../../utils/dates";
import BadgeStatusDetail from "./BadgeStatusDetail";
import { DocumentShowDetail, type DocumentShowDetailType } from "./DocumentShowDetail";
import { DocumentDetailProvider } from "../../context/DocumentDetail";
import { ApiBaseUrl } from "../../settings"

export default function SearchDocuments() {
  const documentDetailRef = React.useRef<DocumentShowDetailType | null>(null);
  const currentPage = React.useRef<number>(1);
  const { queryParams, filters } = useFilters();
  const hookUseDocumentList = useDocumentList();
  const { documents, setAll } = hookUseDocumentList;
  const { data, refetch, loading } = useGetAuth({
    url: `${ApiBaseUrl}/document/requests/`,
    params: queryParams,
    autoFetch: false,
    transform: ToCamelCase,
  });
  const [tab, setTab] = React.useState("simples");

  React.useEffect(() => {
    if (data && data.results) setAll(data.results);
  }, [data]);

  React.useEffect(() => {
    if (filters.page && filters.page !== currentPage.current) {
      refetch();
      currentPage.current = filters.page;
    }
  }, [filters]);

  return (
    <Flex direction="column" gap={5}>

      {/* ── Painel de filtros ──────────────────────────────────────────── */}
      <Tabs.Root value={tab} onValueChange={(e) => setTab(e.value)} lazyMount>

        {/* Pill tabs secundárias + botão buscar na mesma linha */}
        <Flex align="center" justify="space-between" mb={3} gap={3} wrap="wrap">
          <Tabs.List
            bg="#F3F4F6"
            borderRadius="10px"
            p="3px"
            gap={0}
            border="none"
          >
            <Tabs.Trigger
              value="simples"
              px={4}
              py="6px"
              fontWeight="600"
              fontSize="13px"
              color="#6B7280"
              borderRadius="8px"
              gap={2}
              _selected={{
                bg: "white",
                color: "#111827",
                boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
              }}
              _hover={{ color: "#374151" }}
            >
              <FaSearch size={11} />
              Filtro Simples
            </Tabs.Trigger>

            <Tabs.Trigger
              value="avancados"
              px={4}
              py="6px"
              fontWeight="600"
              fontSize="13px"
              color="#6B7280"
              borderRadius="8px"
              gap={2}
              _selected={{
                bg: "white",
                color: "#111827",
                boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
              }}
              _hover={{ color: "#374151" }}
            >
              <FaSearchengin size={11} />
              Filtro Avançado
            </Tabs.Trigger>
          </Tabs.List>

          {/* Botão buscar */}
          <Box
            role="button"
            tabIndex={0}
            onClick={refetch}
            onKeyDown={(e) => { if (e.key === "Enter") refetch() }}
            display="flex"
            alignItems="center"
            gap={2}
            px={5}
            h="36px"
            bg={loading ? "#3B82F6" : "#2563EB"}
            color="white"
            borderRadius="10px"
            fontWeight="700"
            fontSize="13px"
            cursor={loading ? "not-allowed" : "pointer"}
            boxShadow="0 2px 6px rgba(37,99,235,0.25)"
            transition="all 0.15s"
            _hover={{ bg: "#1D4ED8" }}
            flexShrink={0}
          >
            <FaSearch size={12} />
            {loading ? "Buscando..." : "Buscar"}
          </Box>
        </Flex>

        <Tabs.Content value="simples" pt={0}>
          <DocumentFilters />
        </Tabs.Content>
        <Tabs.Content value="avancados" pt={0}>
          <DynamicFilter />
        </Tabs.Content>
      </Tabs.Root>

      {/* ── Tabela de resultados ───────────────────────────────────────── */}
      <DocumentTable
        documents={documents}
        showDetail={documentDetailRef.current?.showDocument}
        renderExtraCols={["Status"]}
        renderRow={(item) => {
          const sortedStatus = [...item.status].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          const lastStatus = sortedStatus[sortedStatus.length - 1];
          const hasHistory = sortedStatus.length > 1;
          return (
            <Table.Cell px={4} py={4}>
              <Tooltip
                disabled={!hasHistory}
                showArrow
                content={
                  <Flex direction="column" gap={1}>
                    {sortedStatus.map((s, index) => (
                      <Text key={index} fontSize="xs">
                        • {formatToBRDate(s.createdAt)} — {s.status}
                      </Text>
                    ))}
                  </Flex>
                }
              >
                <span><BadgeStatusDetail props={lastStatus} /></span>
              </Tooltip>
            </Table.Cell>
          );
        }}
      />

      <Box mt={1}>
        <PaginationForDocs count={data?.count} pageSize={5} />
      </Box>

      <DocumentDetailProvider useDocumentList={hookUseDocumentList}>
        <DocumentShowDetail ref={documentDetailRef} />
      </DocumentDetailProvider>

    </Flex>
  );
}
