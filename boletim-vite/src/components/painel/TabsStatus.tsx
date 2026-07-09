import { Box, Text, Tabs } from "@chakra-ui/react"
import { FilterProvider } from "../../context/FilterContext"
import PendingDocuments from "./PendingDocuments"
import RectifyingDocuments from "./RectifyingDocuments"
import { BsClockHistory, BsPencilSquare } from "react-icons/bs"
import { LuFileSearch } from "react-icons/lu"
import SearchDocuments from "./SearchDocuments"
import type { ReactNode } from "react"
import useTabCounts from "../../hooks/useTabCounts"

// ─── Styled Tab Trigger ──────────────────────────────────────────────────────

interface TabTriggerProps {
  value: string
  icon: ReactNode
  label: string
}

function TabTrigger({ value, icon, label }: TabTriggerProps) {
  return (
    <Tabs.Trigger
      value={value}
      px={5}
      py="14px"
      fontWeight="600"
      fontSize="14px"
      color="#6B7280"
      borderBottom="2px solid transparent"
      borderRadius="0"
      mb="-1px"
      gap={2}
      display="flex"
      alignItems="center"
      transition="color 0.15s, border-color 0.15s"
      _selected={{ color: "#2563EB", borderBottomColor: "#2563EB" }}
      _hover={{ color: "#374151", bg: "transparent" }}
    >
      {icon}
      {label}
    </Tabs.Trigger>
  )
}

// ─── TabsStatus ──────────────────────────────────────────────────────────────

export default function TabsStatus() {
  const counts = useTabCounts();

  return (
    <Box>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <Box mb={6}>
        <Text
          fontSize="22px"
          fontWeight="800"
          color="#111827"
          letterSpacing="-0.4px"
        >
          Painel Administrativo
        </Text>
        <Text fontSize="13px" color="#6B7280" mt="4px">
          Gerencie e acompanhe as solicitações de cópia de boletim
        </Text>
      </Box>

      {/* ── White card ──────────────────────────────────────────────────── */}
      <Box
        bg="white"
        borderRadius="2xl"
        boxShadow="0 1px 3px rgba(0,0,0,0.05), 0 4px 24px rgba(0,0,0,0.07)"
        overflow="hidden"
      >
        <Tabs.Root defaultValue="aguardando" lazyMount onValueChange={() => counts.refetch()}>

          {/* Tab nav */}
          <Box borderBottom="1px solid #F3F4F6" px={6}>
            <Tabs.List gap={0} borderBottom="none" bg="transparent">
              <TabTrigger
                value="aguardando"
                icon={<BsClockHistory size={15} />}
                label={`Aguardando (${counts.aguardando})`}
              />
              <TabTrigger
                value="retificacoes"
                icon={<BsPencilSquare size={15} />}
                label={`Retificações (${counts.retificando})`}
              />
              <TabTrigger
                value="search"
                icon={<LuFileSearch size={15} />}
                label="Buscar"
              />
            </Tabs.List>
          </Box>

          {/* Content */}
          <Box p={6}>
            <Tabs.Content value="aguardando" pt={0}>
              <FilterProvider>
                <PendingDocuments onChanged={counts.refetch} />
              </FilterProvider>
            </Tabs.Content>
            <Tabs.Content value="retificacoes" pt={0}>
              <FilterProvider>
                <RectifyingDocuments onChanged={counts.refetch} />
              </FilterProvider>
            </Tabs.Content>
            <Tabs.Content value="search" pt={0}>
              <FilterProvider>
                <SearchDocuments />
              </FilterProvider>
            </Tabs.Content>
          </Box>

        </Tabs.Root>
      </Box>
    </Box>
  )
}
