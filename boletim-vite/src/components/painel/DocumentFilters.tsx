"use client";

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
import {
  HiFunnel,
  HiXMark,
} from "react-icons/hi2";

/* 🔹 coleção de status */
const statusCollection = createListCollection({
  items: [
    { label: "Todos", value: "" },
    { label: "Aguardando", value: "aguardando" },
    { label: "Confirmado", value: "confirmado" },
    { label: "Cancelado", value: "cancelado" },
  ],
});



export default function DocumentFilters() {
  const { filters, setFilter, setFiltersBatch, resetFilters, fieldLabelMap } = useFilters();

  return (
    <Box p="4" borderWidth="1px" borderRadius="xl" bg="bg.panel">
      <Stack gap="4">
        {/* HEADER */}
        <Flex justify="space-between" align="center">
          <HStack>
            <HiFunnel />
            <Text fontWeight="semibold">Filtros</Text>
          </HStack>

          <Button size="sm" variant="ghost" onClick={resetFilters}>
            <HiXMark />
            Limpar
          </Button>
        </Flex>

        {/* PROTOCOLO + STATUS */}
        <Flex gap="3" wrap="wrap">
          {/* PROTOCOLO */}
          <Box flex="1">
            <Text fontSize="sm" mb="1">
              Protocolo
            </Text>
            <Input
              placeholder="Ex: 123456"
              value={filters.protocol || ""}
              onChange={(e) => setFilter("protocol", e.target.value)}
            />
          </Box>

          {/* STATUS (PADRÃO NOVO) */}
          <Box flex="1">
            <Select.Root
              collection={statusCollection}
              value={filters.status ? [filters.status] : [""]}
              onValueChange={(e) =>
                setFilter("status", e.value[0] || "")
              }
            >
              <Select.HiddenSelect />

              <Select.Label>Status</Select.Label>

              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Todos" />
                </Select.Trigger>

                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>

              <Portal>
                <Select.Positioner>
                  <Select.Content>
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

        {/* DATAS */}
        <Flex gap="3" wrap="wrap">
          <Box flex="1">
            <Text fontSize="sm" mb="1">
              Data inicial
            </Text>
            <Input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) => setFilter("startDate", e.target.value)}
            />
          </Box>

          <Box flex="1">
            <Text fontSize="sm" mb="1">
              Data final
            </Text>
            <Input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) => setFilter("endDate", e.target.value)}
            />
          </Box>
        </Flex>

        {/* AÇÕES RÁPIDAS */}
        <Flex gap="2" wrap="wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const today = new Date().toISOString().slice(0, 10);

              setFiltersBatch({
                startDate: today,
                endDate: today,
              });
            }}
          >
            Hoje
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const today = new Date();
              const past = new Date();
              past.setDate(today.getDate() - 7);

              setFiltersBatch({
                startDate: past.toISOString().slice(0, 10),
                endDate: today.toISOString().slice(0, 10),
              });
            }}
          >
            Últimos 7 dias
          </Button>
        </Flex>

        {/* TAGS */}
        <HStack wrap="wrap">
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
              onRemove={() => {
                setFiltersBatch({
                  dynamicField: "",
                  dynamicValue: "",
                });
              }}
            />
          )}
        </HStack>
      </Stack>
    </Box>
  );
}

/* TAG */
function FilterTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <HStack px="3" py="1" borderRadius="full" bg="gray.100">
      <Text fontSize="sm">{label}</Text>
      <HiXMark style={{ cursor: "pointer" }} onClick={onRemove} />
    </HStack>
  );
}