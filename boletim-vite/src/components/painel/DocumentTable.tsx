
import { Flex, Show, Table, Text } from "@chakra-ui/react"
import type { DocumentSimpleDetail } from "../../domain/documentSimpleDetail";
import { formatToBRDate } from "../../utils/dates";
import React from "react";
import { HiOutlineDocumentSearch } from "react-icons/hi";

interface DocumentTable {
    documents: DocumentSimpleDetail[];
    renderExtraCols?: React.ReactNode[];
    renderRow?: (item: DocumentSimpleDetail, index: number) => React.ReactNode;
    showDetail?: (protocol: string) => void;
}

export default function DocumentTable({documents, renderExtraCols, renderRow, showDetail}: DocumentTable) {
    return (
       <Show when={(documents.length > 0)} fallback={
        <Text color="gray.600">Nenhuma solicitação para listar no momento.</Text>
       }>
        <Table.Root size="sm" striped>
                <Table.Header>
                    <Table.Row>
                    <Table.ColumnHeader>Protocolo</Table.ColumnHeader>
                    <Table.ColumnHeader>Nome Solicitante</Table.ColumnHeader>
                    <Table.ColumnHeader>Solicitado em</Table.ColumnHeader>
                    {renderExtraCols?.map((col, index)=> (
                        <Table.ColumnHeader key={`col-${index}`}>{col}</Table.ColumnHeader>
                    ))}
                    {showDetail && <Table.ColumnHeader textAlign="end">Detalhes</Table.ColumnHeader>}
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {documents.map((item, index) => (
                      <Show when={item.view}>
                        <Table.Row key={item.id}>
                            <Table.Cell>{item.protocol}</Table.Cell>
                            <Table.Cell>{item.applicantName}</Table.Cell>
                            <Table.Cell>{formatToBRDate(item.createdAt)}</Table.Cell>
                            {renderRow && renderRow(item, index)}
                            {showDetail && (
                            <Table.Cell textAlign="end">
                                <Flex justifyContent={"flex-end"}>
                                    <HiOutlineDocumentSearch 
                                        cursor={"pointer"}
                                        onClick={()=>showDetail(item.protocol)}
                                        size={26} />
                                </Flex>
                            </Table.Cell>
                            )}
                        </Table.Row>
                      </Show>
                    ))}
                </Table.Body>
            </Table.Root>
       </Show>
    )

}