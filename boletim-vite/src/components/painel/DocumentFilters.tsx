"use client";

import type { ReactNode } from "react";
import {
  Box,
  Button,
  Flex,
  Input,
  Stack,
  Text,
  HStack,
  Portal,
  Select,
  createListCollection,
} from "@chakra-ui/react";
import { useFilters } from "../../context/FilterContext";
import { HiFunnel, HiXMark } from "react-icons/hi2";

// ─── Coleção de status ───────────────────────────────────────────────────────

const statusCollection = createListCollection({
  items: [
    { label: "Todos", value: "" },
    { label: "Aguardando", value: "aguardando" },
    { label: "Confirmado", value: "confirmado" },
    { label: "Cancelado", value: "cancelado" },
    { label: "Retificações em aberto", value: "retificando" },
  ],
});

// ─── Estilos reutilizáveis ───────────────────────────────────────────────────

const inputStyle = {
  bg: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  fontSize: "13px",
  color: "#111827",
  h: "38px",
  px: 3,
  _focus: { borderColor: "#2563EB", boxShadow: "0 0 0 3px rgba(37,99,235,0.12)" },
  _placeholder: { color: "#9CA3AF" },
}

// ─── FilterLabel ─────────────────────────────────────────────────────────────

function FilterLabel({ children }: { children: ReactNode }) {
  return (
    <Text fontSize="12px" fontWeight="600" color="#374151" mb={1}>
      {children}
    </Text>
  )
}

// ─── FilterTag ───────────────────────────────────────────────────────────────

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <HStack
      px={3}
      py="4px"
      borderRadius="full"
      bg="#EFF6FF"
      border="1px solid #BFDBFE"
      gap={1}
    >
      <Text fontSize="12px" fontWeight="500" color="#2563EB">
        {label}
      </Text>
      <Box
        role="button"
        tabIndex={0}
        cursor="pointer"
        color="#60A5FA"
        _hover={{ color: "#2563EB" }}
        onClick={onRemove}
        onKeyDown={(e) => { if (e.key === "Enter") onRemove() }}
        display="flex"
        alignItems="center"
      >
        <HiXMark size={13} />
      </Box>
    </HStack>
  )
}

// ─── DocumentFilters ─────────────────────────────────────────────────────────

export default function DocumentFilters() {
  const { filters, setFilter, setFiltersBatch, resetFilters, fieldLabelMap } = useFilters();

  return (
    <Box
      p={4}
      border="1px solid #E5E7EB"
      borderRadius="12px"
      bg="#FAFAFA"
    >
      <Stack gap={4}>
        {/* Header */}
        <Flex justify="space-between" align="center">
          <HStack gap={2}>
            <Box color="#6B7280"><HiFunnel size={15} /></Box>
            <Text fontWeight="700" fontSize="13px" color="#374151">
              Filtros
            </Text>
          </HStack>

          <Box
            role="button"
            tabIndex={0}
            onClick={resetFilters}
            onKeyDown={(e) => { if (e.key === "Enter") resetFilters() }}
            cursor="pointer"
            display="flex"
            alignItems="center"
            gap={1}
            px={2}
            py={1}
            borderRadius="6px"
            color="#6B7280"
            fontSize="12px"
            fontWeight="600"
            _hover={{ bg: "#F3F4F6", color: "#374151" }}
            transition="all 0.15s"
          >
            <HiXMark size={14} />
            Limpar
          </Box>
        </Flex>

        {/* Protocolo + Status */}
        <Flex gap={3} wrap="wrap">
          <Box flex="1" minW="140px">
            <FilterLabel>Protocolo</FilterLabel>
            <Input
              placeholder="Ex: 123456"
              value={filters.protocol || ""}
              onChange={(e) => setFilter("protocol", e.target.value)}
              {...inputStyle}
            />
          </Box>

          <Box flex="1" minW="140px">
            <Select.Root
              collection={statusCollection}
              value={filters.status ? [filters.status] : [""]}
              onValueChange={(e) => setFilter("status", e.value[0] || "")}
            >
              <Select.HiddenSelect />

              <Select.Label
                fontSize="12px"
                fontWeight="600"
                color="#374151"
                mb={1}
              >
                Status
              </Select.Label>

              <Select.Control>
                <Select.Trigger
                  bg="#F9FAFB"
                  border="1px solid #E5E7EB"
                  borderRadius="10px"
                  fontSize="13px"
                  h="38px"
                  px={3}
                  _focus={{ borderColor: "#2563EB", boxShadow: "0 0 0 3px rgba(37,99,235,0.12)" }}
                >
                  <Select.ValueText placeholder="Todos" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>

              <Portal>
                <Select.Positioner>
                  <Select.Content
                    borderRadius="10px"
                    border="1px solid #E5E7EB"
                    boxShadow="0 4px 16px rgba(0,0,0,0.1)"
                    fontSize="13px"
                  >
                    {statusCollection.items.map((item) => (
                      <Select.Item item={item} key={item.value}>
                        {item.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Box>
        </Flex>

        {/* Datas */}
        <Flex gap={3} wrap="wrap">
          <Box flex="1" minW="140px">
            <FilterLabel>Data inicial</FilterLabel>
            <Input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) => setFilter("startDate", e.target.value)}
              {...inputStyle}
            />
          </Box>

          <Box flex="1" minW="140px">
            <FilterLabel>Data final</FilterLabel>
            <Input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) => setFilter("endDate", e.target.value)}
              {...inputStyle}
            />
          </Box>
        </Flex>

        {/* Ações rápidas */}
        <Flex gap={2} wrap="wrap">
          <Button
            size="sm"
            variant="outline"
            border="1px solid #E5E7EB"
            borderRadius="8px"
            fontSize="12px"
            fontWeight="600"
            color="#374151"
            h="30px"
            px={3}
            _hover={{ bg: "#F3F4F6", borderColor: "#D1D5DB" }}
            onClick={() => {
              const today = new Date().toISOString().slice(0, 10)
              setFiltersBatch({ startDate: today, endDate: today })
            }}
          >
            Hoje
          </Button>

          <Button
            size="sm"
            variant="outline"
            border="1px solid #E5E7EB"
            borderRadius="8px"
            fontSize="12px"
            fontWeight="600"
            color="#374151"
            h="30px"
            px={3}
            _hover={{ bg: "#F3F4F6", borderColor: "#D1D5DB" }}
            onClick={() => {
              const today = new Date()
              const past = new Date()
              past.setDate(today.getDate() - 7)
              setFiltersBatch({
                startDate: past.toISOString().slice(0, 10),
                endDate: today.toISOString().slice(0, 10),
              })
            }}
          >
            Últimos 7 dias
          </Button>
        </Flex>

        {/* Tags ativas */}
        {(filters.status || filters.protocol || filters.startDate || filters.endDate ||
          (filters.dynamicField && filters.dynamicValue)) && (
          <HStack wrap="wrap" gap={2}>
            {filters.status && (
              <FilterTag
                label={`Status: ${filters.status}`}
                onRemove={() => setFilter("status", "")}
              />
            )}
            {filters.protocol && (
              <FilterTag
                label={`Prot: ${filters.protocol}`}
                onRemove={() => setFilter("protocol", "")}
              />
            )}
            {filters.startDate && (
              <FilterTag
                label={`De: ${filters.startDate}`}
                onRemove={() => setFilter("startDate", "")}
              />
            )}
            {filters.endDate && (
              <FilterTag
                label={`Até: ${filters.endDate}`}
                onRemove={() => setFilter("endDate", "")}
              />
            )}
            {filters.dynamicField && filters.dynamicValue && (
              <FilterTag
                label={`${fieldLabelMap[filters.dynamicField]}: ${filters.dynamicValue}`}
                onRemove={() => setFiltersBatch({ dynamicField: "", dynamicValue: "" })}
              />
            )}
          </HStack>
        )}
      </Stack>
    </Box>
  )
}
