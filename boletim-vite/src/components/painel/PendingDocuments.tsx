import { Table, Text } from "@chakra-ui/react";
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


export default function PendingDocuments() {
    const documentDetailRef = React.useRef<DocumentShowDetailType | null>(null);
    const { queryParams, setFiltersBatch, filters } = useFilters();
    const hookUseDocumentList = useDocumentList();
    const {documents, setAll } = hookUseDocumentList;
    const { data, refetch, loading } = useGetAuth({
        url: "/document/requests/",
        params: queryParams,
        autoFetch: false,
        transform: ToCamelCase,
    });

    // ✅ define status inicial
    React.useEffect(() => {
        setFiltersBatch({
            status: "aguardando",
            page: 1
        })
    }, []);

    // ✅ refetch quando filtros mudam
    React.useEffect(() => {
        if (!filters.status) return;
        refetch();
    }, [queryParams]);

    React.useEffect(()=>{
        if (data && data.results) setAll(data.results);
    }, [data]);

    if (loading) return <Text>Carregando...</Text>;

    return (
        <>
            <DocumentTable
                documents={documents}
                showDetail={documentDetailRef.current?.showDocument}
                renderExtraCols={["Tempo de Espera"]}
                renderRow={(item)=> (
                    <Table.Cell>
                        <BadgeDaysAwaiting
                            days={daysWaiting(item.createdAt)}/>
                    </Table.Cell>
                )}
                />

            {/* 📄 PAGINAÇÃO */}
            <PaginationForDocs count={data?.count} pageSize={5}/>
            <DocumentDetailProvider useDocumentList={hookUseDocumentList} removedForNewStatus>
                <DocumentShowDetail ref={documentDetailRef}/>
            </DocumentDetailProvider>
        </>
    );
}