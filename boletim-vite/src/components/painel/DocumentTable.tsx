import { Box, Flex, Show, Table, Text } from "@chakra-ui/react"
import type { DocumentSimpleDetail } from "../../domain/documentSimpleDetail"
import { formatToBRDate } from "../../utils/dates"
import type { ReactNode } from "react"
import { HiOutlineDocumentSearch } from "react-icons/hi"
import { LuFileX } from "react-icons/lu"

interface DocumentTableProps {
  documents: DocumentSimpleDetail[]
  renderExtraCols?: ReactNode[]
  renderRow?: (item: DocumentSimpleDetail, index: number) => ReactNode
  showDetail?: (protocol: string) => void
}

// ─── Header cell ─────────────────────────────────────────────────────────────

function TH({ children, textAlign }: { children: ReactNode; textAlign?: "end" }) {
  return (
    <Table.ColumnHeader
      fontSize="11px"
      fontWeight="700"
      color="#6B7280"
      letterSpacing="0.5px"
      textTransform="uppercase"
      py={3}
      px={4}
      bg="#F9FAFB"
      borderBottom="1px solid #E5E7EB"
      textAlign={textAlign}
    >
      {children}
    </Table.ColumnHeader>
  )
}

// ─── DocumentTable ───────────────────────────────────────────────────────────

export default function DocumentTable({
  documents,
  renderExtraCols,
  renderRow,
  showDetail,
}: DocumentTableProps) {

  if (documents.length === 0) {
    return (
      <Flex direction="column" align="center" py={12} gap={3}>
        <Box color="#D1D5DB">
          <LuFileX size={40} />
        </Box>
        <Text fontSize="14px" fontWeight="600" color="#6B7280">
          Nenhuma solicitação para exibir
        </Text>
        <Text fontSize="12px" color="#9CA3AF">
          Tente ajustar os filtros ou aguarde novas solicitações.
        </Text>
      </Flex>
    )
  }

  return (
    <Box overflowX="auto" borderRadius="12px" border="1px solid #E5E7EB">
      <Table.Root size="md">
        <Table.Header>
          <Table.Row>
            <TH>Protocolo</TH>
            <TH>Nome Paciente</TH>
            <TH>Nome Solicitante</TH>
            <TH>Solicitado em</TH>
            {renderExtraCols?.map((col, index) => (
              <TH key={`col-${index}`}>{col}</TH>
            ))}
            {showDetail && <TH textAlign="end">Ações</TH>}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {documents.map((item, index) => (
            <Show when={item.view} key={item.id}>
              <Table.Row
                _hover={{ bg: "#F8FAFF" }}
                transition="background 0.12s"
                borderBottom="1px solid #F3F4F6"
              >
                {/* Protocolo */}
                <Table.Cell py={4} px={4}>
                  <Box
                    display="inline-block"
                    px={2}
                    py="3px"
                    bg="#EFF6FF"
                    color="#2563EB"
                    borderRadius="6px"
                    fontSize="12px"
                    fontWeight="700"
                    fontFamily="mono"
                    letterSpacing="0.3px"
                  >
                    #{item.protocol}
                  </Box>
                </Table.Cell>

                {/* Paciente */}
                <Table.Cell py={4} px={4} fontSize="13px" fontWeight="500" color="#374151">
                  {item.patientName}
                </Table.Cell>

                {/* Solicitante */}
                <Table.Cell py={4} px={4} fontSize="13px" fontWeight="500" color="#374151">
                  {item.applicantName}
                </Table.Cell>

                {/* Data */}
                <Table.Cell py={4} px={4} fontSize="13px" color="#6B7280">
                  {formatToBRDate(item.createdAt)}
                </Table.Cell>

                {/* Extra cols */}
                {renderRow && renderRow(item, index)}

                {/* Ação detalhe */}
                {showDetail && (
                  <Table.Cell textAlign="end" py={4} px={4}>
                    <Flex justifyContent="flex-end">
                      <Box
                        role="button"
                        tabIndex={0}
                        onClick={() => showDetail(item.protocol)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") showDetail(item.protocol)
                        }}
                        w="34px"
                        h="34px"
                        borderRadius="8px"
                        bg="#EFF6FF"
                        color="#2563EB"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        cursor="pointer"
                        transition="all 0.15s"
                        _hover={{ bg: "#DBEAFE" }}
                        title="Ver detalhes"
                      >
                        <HiOutlineDocumentSearch size={18} />
                      </Box>
                    </Flex>
                  </Table.Cell>
                )}
              </Table.Row>
            </Show>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  )
}
