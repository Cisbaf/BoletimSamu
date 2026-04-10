// src/context/FilterContext.tsx
import React, { createContext, useContext, useState } from "react";

type Filters = {
  status?: string;
  protocol?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  dynamicField?: string;
  dynamicValue?: string;
};

interface FilterContextType {
  filters: Filters;
  setFilter: (key: keyof Filters, value: any) => void;
  setFiltersBatch: (filters: Partial<Filters>) => void; // 👈 novo
  resetFilters: () => void;
  queryParams: Record<string, any>;
  fieldLabelMap: Record<string, string>;
}

const FilterContext = createContext<FilterContextType | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Filters>({});

  const fieldMap: Record<string, string> = {
    applicant_name: "applicant__full_name__icontains",
    applicant_cpf: "applicant__cpf__icontains",
    patient_name: "incident__patient_name__icontains",
  };

  const fieldLabelMap: Record<string, string> = {
    applicant_name: "Nome do solicitante",
    applicant_cpf: "CPF do solicitante",
    patient_name: "Nome do paciente",
  };

  function setFilter(key: keyof Filters, value: any) {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined, // remove vazio
    }));
  }

  function resetFilters() {
    setFilters({});
  }

  function setFiltersBatch(newFilters: Partial<Filters>) {
  setFilters((prev) => {
    const cleaned = Object.fromEntries(
      Object.entries(newFilters).map(([key, value]) => [
        key,
        value || undefined, // mantém tua regra de limpar vazio
      ])
    );

    return {
      ...prev,
      ...cleaned,
    };
  });
}

  // 🔥 transforma automaticamente em params da API
  const queryParams = Object.fromEntries(
    Object.entries({
      status: filters.status,
      protocol: filters.protocol,
      start_date: filters.startDate,
      end_date: filters.endDate,
      page: filters.page,

      ...(filters.dynamicField &&
        filters.dynamicValue && {
          [fieldMap[filters.dynamicField]]: filters.dynamicValue,
        }),
    }).filter(([_, value]) => value !== undefined && value !== "")
  );
  
  return (
    <FilterContext.Provider
      value={{ filters, setFilter, setFiltersBatch, resetFilters, queryParams, fieldLabelMap }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used inside FilterProvider");
  return ctx;
}