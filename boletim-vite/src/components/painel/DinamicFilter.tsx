"use client";

import {
  Box,
  Flex,
  Input,
  Select,
  Portal,
  createListCollection,
} from "@chakra-ui/react";

import { useFilters } from "../../context/FilterContext";

/* 🔹 opções */
const fieldCollection = createListCollection({
  items: [
    { label: "Nome do solicitante", value: "applicant_name" },
    { label: "CPF do solicitante", value: "applicant_cpf" },
    { label: "Nome do paciente", value: "patient_name" },
  ],
});

export function DynamicFilter() {
  const { filters, setFiltersBatch } = useFilters();

  return (
    <Flex gap="3" align="end" wrap="wrap">
      {/* SELECT */}
      <Box minW="220px">
        <Select.Root
          collection={fieldCollection}
          value={filters.dynamicField ? [filters.dynamicField] : []}
          onValueChange={(e) =>
            setFiltersBatch({
              dynamicField: e.value[0],
              dynamicValue: "", // limpa ao trocar campo
            })
          }
        >
          <Select.HiddenSelect />

          <Select.Label>Filtrar por</Select.Label>

          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="Selecione um campo" />
            </Select.Trigger>

            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>

          <Portal>
            <Select.Positioner>
              <Select.Content>
                {fieldCollection.items.map((item) => (
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

      {/* INPUT */}
      <Box flex="1">
        <Input
          placeholder="Digite o valor..."
          value={filters.dynamicValue || ""}
          onChange={(e) =>
            setFiltersBatch({
              dynamicValue: e.target.value,
              page: 1, // reset paginação
            })
          }
          disabled={!filters.dynamicField}
        />
      </Box>
    </Flex>
  );
}