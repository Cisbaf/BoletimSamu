import { Button, Flex, Table, Tabs, Text, VStack } from "@chakra-ui/react";
import React from "react";
import { useFilters } from "../../context/FilterContext";
import { useGetAuth } from "../../hooks/useGetAuth";
import { ToCamelCase } from "../../utils/camelCase";
import { PaginationForDocs } from "./Pagination";
import useDocumentList from "../../hooks/useDocumentList";
import DocumentFilters from "./DocumentFilters";
import { DynamicFilter } from "./DinamicFilter";
import { FaSearch } from "react-icons/fa";
import { FaSearchengin } from "react-icons/fa";
import DocumentTable from "./DocumentTable";
import { Tooltip } from "../ui/tooltip";
import { formatToBRDate } from "../../utils/dates";
import BadgeStatusDetail from "./BadgeStatusDetail";
import { DocumentShowDetail, type DocumentShowDetailType } from "./DocumentShowDetail";
import { DocumentDetailProvider } from "../../context/DocumentDetail";


export default function SearchDocuments() {
    const documentDetailRef = React.useRef<DocumentShowDetailType | null>(null);
    const currentPage = React.useRef<number>(1);
    const { queryParams, filters } = useFilters();
    const hookUseDocumentList = useDocumentList();
    const { documents, setAll } = hookUseDocumentList;
    const { data, refetch, loading } = useGetAuth({
        url: "/document/requests/",
        params: queryParams,
        autoFetch: false,
        transform: ToCamelCase,
    });
    const [tab, setTab] = React.useState("simples");

    React.useEffect(()=>{
        if (data && data.results) setAll(data.results);
    }, [data]);

    React.useEffect(()=>{
        if (filters.page && filters.page != currentPage.current) {
            refetch();
            currentPage.current = filters.page;
        }
    }, [filters]);

    if (loading) return <Text>Carregando...</Text>;

    return (
    <Flex direction={"column"} gap={3}>

        <Tabs.Root value={tab} onValueChange={(e) => setTab(e.value)} lazyMount>
            <Tabs.List>
                <Tabs.Trigger value="simples">
                    <FaSearch/>
                    Filtro Simples
                </Tabs.Trigger>
                <Tabs.Trigger value="avancados">
                    <FaSearchengin/>
                    Filtro Avançado
                </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="simples">
                <DocumentFilters/>
            </Tabs.Content>

            <Tabs.Content value="avancados">
                <DynamicFilter/>
            </Tabs.Content>
        </Tabs.Root>

        <Button onClick={refetch}>Buscar</Button>
        
        <DocumentTable 
            documents={documents}
            showDetail={documentDetailRef.current?.showDocument}
            renderExtraCols={["Status"]}
            renderRow={(item) => {
                const sortedStatus = [...item.status].sort(
                    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                )
                const lastStatus = sortedStatus[sortedStatus.length - 1];
                const hasHistory = sortedStatus.length > 1;
                return (
                    <Table.Cell>
                        <Tooltip
                            disabled={!hasHistory}
                            showArrow
                            content={
                                <VStack align="start" gap={1}>
                                    {sortedStatus.map((item, index) => (
                                        <Text key={index} fontSize="xs">
                                            • {formatToBRDate(item.createdAt)} — {item.status}
                                        </Text>
                                    ))}
                                </VStack>
                            }>
                            <span><BadgeStatusDetail props={lastStatus} /></span>
                        </Tooltip>
                    </Table.Cell>
                )
            }}
            />
        <PaginationForDocs count={data?.count} pageSize={5}/>
        <DocumentDetailProvider useDocumentList={hookUseDocumentList}>
            <DocumentShowDetail ref={documentDetailRef}/>
        </DocumentDetailProvider>
    </Flex>
    );
}