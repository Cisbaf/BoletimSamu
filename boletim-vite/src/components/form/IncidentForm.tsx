import {
  Box,
  Field,
  Flex,
  Grid,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useDocumentFormContext } from "../../context/DocumentFormContext";
import {
  ATTENDANCE_LOCATIONS,
  CITIES,
  LOCATION_LABELS,
  PURPOSE_LABELS,
  PURPOSES,
} from "../../domain/documentSchemaForm";
import { Controller } from "react-hook-form";

// ─── Radio pill reutilizável ─────────────────────────────────────────────────

interface PillProps {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function Pill({ label, selected, disabled = false, onClick }: PillProps) {
  return (
    <Box
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) onClick();
      }}
      px={4}
      py="8px"
      border="1.5px solid"
      borderColor={selected ? "#2563EB" : disabled ? "#E5E7EB" : "#E5E7EB"}
      borderRadius="8px"
      bg={selected ? "#EFF6FF" : disabled ? "#F9FAFB" : "white"}
      color={selected ? "#1D4ED8" : disabled ? "#C4C9D4" : "#374151"}
      fontWeight={selected ? "600" : "500"}
      fontSize="13px"
      cursor={disabled ? "not-allowed" : "pointer"}
      userSelect="none"
      transition="all 0.15s"
      opacity={disabled ? 0.6 : 1}
      _hover={disabled ? {} : {
        borderColor: selected ? "#2563EB" : "#C7D2FE",
        bg: selected ? "#EFF6FF" : "#F8FAFC",
      }}
    >
      {label}
    </Box>
  );
}

// ─── Form ────────────────────────────────────────────────────────────────────

const LABEL_STYLE = {
  fontWeight: "600" as const,
  fontSize: "13px",
  color: "#374151",
};

export default function IncidentForm() {
  const { form } = useDocumentFormContext();
  const { formState: { errors }, register, control, watch } = form;

  const location      = watch("incident.attendance_location");
  const purpose       = watch("purpose");
  const applicantType = watch("applicant.applicant_type");

  const isPurposeDisabled = (p: string) =>
    applicantType === "PATIENT" && p === "OBITO";

  return (
    <Stack gap={5} w="100%">

      {/* ── Linha 1: Nome | Data | Hora ── */}
      <Grid templateColumns={{ base: "1fr", md: "2fr 1fr 1fr" }} gap={4}>

        <Field.Root invalid={!!errors.incident?.patient_name}>
          <Field.Label {...LABEL_STYLE}>Nome completo do paciente *</Field.Label>
          <Input placeholder="Nome completo" {...register("incident.patient_name")} />
          <Field.ErrorText>{errors.incident?.patient_name?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.incident?.date}>
          <Field.Label {...LABEL_STYLE}>Data da ocorrência *</Field.Label>
          <Input type="date" {...register("incident.date")} />
          <Field.ErrorText>{errors.incident?.date?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.incident?.time}>
          <Field.Label {...LABEL_STYLE}>Hora *</Field.Label>
          <Input type="time" {...register("incident.time")} />
          <Field.ErrorText>{errors.incident?.time?.message}</Field.ErrorText>
        </Field.Root>

      </Grid>

      {/* ── Linha 2: Município | Bairro | Endereço ── */}
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 2fr" }} gap={4}>

        <Field.Root invalid={!!errors.incident?.city}>
          <Field.Label {...LABEL_STYLE}>Município *</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              placeholder="Selecione..."
              style={{ borderRadius: "10px", background: "#F9FAFB", borderColor: "#E5E7EB", fontSize: "14px", height: "42px" }}
              {...register("incident.city")}
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
          <Field.ErrorText>{errors.incident?.city?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.incident?.neighborhood}>
          <Field.Label {...LABEL_STYLE}>Bairro *</Field.Label>
          <Input placeholder="Bairro" {...register("incident.neighborhood")} />
          <Field.ErrorText>{errors.incident?.neighborhood?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.incident?.address}>
          <Field.Label {...LABEL_STYLE}>Endereço *</Field.Label>
          <Input placeholder="Rua, número, referência" {...register("incident.address")} />
          <Field.ErrorText>{errors.incident?.address?.message}</Field.ErrorText>
        </Field.Root>

      </Grid>

      {/* ── Motivo ── */}
      <Field.Root invalid={!!errors.incident?.reason}>
        <Field.Label {...LABEL_STYLE}>
          Motivo da solicitação *
          <Text as="span" fontWeight="400" color="#9CA3AF" ml={1}>(máx. 50 caracteres)</Text>
        </Field.Label>
        <Input maxLength={50} placeholder="Ex: Trauma / Acidente de trânsito" {...register("incident.reason")} />
        <Field.ErrorText>{errors.incident?.reason?.message}</Field.ErrorText>
      </Field.Root>

      {/* ── Local + Finalidade ── */}
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>

        {/* Local do atendimento */}
        <Field.Root invalid={!!errors.incident?.attendance_location}>
          <Field.Label {...LABEL_STYLE} mb={2}>Local do atendimento *</Field.Label>
          <Controller
            control={control}
            name="incident.attendance_location"
            render={({ field }) => (
              <Flex gap={2} flexWrap="wrap">
                {ATTENDANCE_LOCATIONS.map((loc) => (
                  <Pill
                    key={loc}
                    label={LOCATION_LABELS[loc]}
                    selected={field.value === loc}
                    onClick={() => field.onChange(loc)}
                  />
                ))}
              </Flex>
            )}
          />
          {/* Campo extra quando "Outro" */}
          {location === "OTH" && (
            <Box mt={3}>
              <Field.Root invalid={!!errors.incident?.other_location_description}>
                <Input
                  placeholder="Descreva o local..."
                  {...register("incident.other_location_description")}
                />
                <Field.ErrorText>{errors.incident?.other_location_description?.message}</Field.ErrorText>
              </Field.Root>
            </Box>
          )}
          <Field.ErrorText>{errors.incident?.attendance_location?.message}</Field.ErrorText>
        </Field.Root>

        {/* Finalidade */}
        <Field.Root invalid={!!errors.purpose}>
          <Field.Label {...LABEL_STYLE} mb={2}>Finalidade da documentação *</Field.Label>
          <Controller
            control={control}
            name="purpose"
            render={({ field }) => (
              <Flex gap={2} flexWrap="wrap">
                {PURPOSES.map((p) => (
                  <Pill
                    key={p}
                    label={PURPOSE_LABELS[p]}
                    selected={field.value === p}
                    disabled={isPurposeDisabled(p)}
                    onClick={() => field.onChange(p)}
                  />
                ))}
              </Flex>
            )}
          />
          {/* Campo extra quando "Outros" */}
          {purpose === "OUTROS" && (
            <Box mt={3}>
              <Field.Root invalid={!!errors.other_purpose}>
                <Input
                  placeholder="Descreva a finalidade..."
                  {...register("other_purpose")}
                />
                <Field.ErrorText>{errors.other_purpose?.message}</Field.ErrorText>
              </Field.Root>
            </Box>
          )}
          <Field.ErrorText>{errors.purpose?.message}</Field.ErrorText>
        </Field.Root>

      </Grid>

      {/* ── Nº Ocorrência + Observações ── */}
      <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} gap={4}>

        <Field.Root invalid={!!errors.incident?.occurrence_number}>
          <Field.Label {...LABEL_STYLE}>
            Nº da ocorrência
            <Text as="span" fontWeight="400" color="#9CA3AF" ml={1}>(opcional)</Text>
          </Field.Label>
          <Input placeholder="Ex: 2024-001" {...register("incident.occurrence_number")} />
          <Field.ErrorText>{errors.incident?.occurrence_number?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.incident?.notes}>
          <Field.Label {...LABEL_STYLE}>
            Observações
            <Text as="span" fontWeight="400" color="#9CA3AF" ml={1}>(opcional · máx. 150 caracteres)</Text>
          </Field.Label>
          <Textarea
            maxLength={150}
            placeholder="Informações adicionais relevantes..."
            resize="none"
            h="42px"
            {...register("incident.notes")}
          />
          <Field.ErrorText>{errors.incident?.notes?.message}</Field.ErrorText>
        </Field.Root>

      </Grid>

    </Stack>
  );
}
