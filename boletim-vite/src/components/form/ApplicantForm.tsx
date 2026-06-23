import {
  Box,
  Field,
  Stack,
  Input,
  Grid,
  Text,
} from "@chakra-ui/react";
import { useDocumentFormContext } from "../../context/DocumentFormContext";
import { useWatch } from "react-hook-form";

// ─── Opções de tipo de solicitante ──────────────────────────────────────────

const APPLICANT_OPTIONS = [
  {
    applicantType: "PATIENT" as const,
    relationship: undefined,
    emoji: "🧑‍⚕️",
    label: "Próprio Paciente",
    sub: "Eu fui o paciente atendido",
  },
  {
    applicantType: "REPRESENTATIVE" as const,
    relationship: "FAMILY" as const,
    emoji: "👨‍👩‍👧",
    label: "Familiar",
    sub: "Pai, mãe, filho, irmão...",
  },
  {
    applicantType: "REPRESENTATIVE" as const,
    relationship: "SPOUSE" as const,
    emoji: "💍",
    label: "Cônjuge",
    sub: "Esposo(a) ou companheiro(a)",
  },
  {
    applicantType: "REPRESENTATIVE" as const,
    relationship: "ATTORNEY" as const,
    emoji: "📋",
    label: "Procurador",
    sub: "Com procuração específica",
  },
] as const;

// ─── Componente ──────────────────────────────────────────────────────────────

export default function ApplicantForm() {
  const { form } = useDocumentFormContext();
  const { formState: { errors }, register, setValue } = form;

  const applicantType = useWatch({ control: form.control, name: "applicant.applicant_type" });
  const relationship  = useWatch({ control: form.control, name: "applicant.relationship_degree" });

  function selectOption(opt: typeof APPLICANT_OPTIONS[number]) {
    setValue("applicant.applicant_type", opt.applicantType, { shouldValidate: true, shouldDirty: true });
    if (opt.relationship) {
      setValue("applicant.relationship_degree", opt.relationship, { shouldValidate: true, shouldDirty: true });
    } else {
      setValue("applicant.relationship_degree", undefined);
    }
  }

  function isActive(opt: typeof APPLICANT_OPTIONS[number]) {
    if (opt.applicantType === "PATIENT") return applicantType === "PATIENT";
    return applicantType === "REPRESENTATIVE" && relationship === opt.relationship;
  }

  return (
    <Stack gap={6}>

      {/* ── Tipo de Solicitante ── */}
      <Field.Root invalid={!!errors.applicant?.applicant_type}>
        <Field.Label fontWeight="600" fontSize="13px" color="#374151" mb={3}>
          Você é o paciente ou solicita em nome de alguém? *
        </Field.Label>

        <Grid templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }} gap={3}>
          {APPLICANT_OPTIONS.map((opt) => {
            const active = isActive(opt);
            return (
              <Box
                key={opt.label}
                role="button"
                tabIndex={0}
                onClick={() => selectOption(opt)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") selectOption(opt) }}
                border="2px solid"
                borderColor={active ? "#2563EB" : "#E5E7EB"}
                borderRadius="10px"
                p={4}
                bg={active ? "#EFF6FF" : "white"}
                cursor="pointer"
                textAlign="left"
                transition="all 0.15s"
                _hover={{
                  borderColor: active ? "#2563EB" : "#C7D2FE",
                  bg: active ? "#EFF6FF" : "#F8FAFC",
                }}
              >
                <Text fontSize="22px" mb={2} lineHeight={1}>{opt.emoji}</Text>
                <Text
                  fontSize="13px"
                  fontWeight="600"
                  color={active ? "#1D4ED8" : "#374151"}
                  lineHeight={1.3}
                >
                  {opt.label}
                </Text>
                <Text fontSize="11px" color={active ? "#60A5FA" : "#9CA3AF"} mt="2px">
                  {opt.sub}
                </Text>
              </Box>
            );
          })}
        </Grid>

        <Field.ErrorText>{errors.applicant?.applicant_type?.message}</Field.ErrorText>
        {errors.applicant?.relationship_degree && (
          <Text fontSize="12px" color="#E03131" mt={1}>
            {errors.applicant.relationship_degree.message}
          </Text>
        )}
      </Field.Root>

      {/* ── Nome · CPF · RG ── */}
      <Grid
        templateColumns={{ base: "1fr", md: "1fr 1fr", lg: "3fr 3fr 2fr" }}
        gap={4}
      >
        <Field.Root invalid={!!errors.applicant?.full_name}>
          <Field.Label fontWeight="600" fontSize="13px" color="#374151">Nome completo *</Field.Label>
          <Input autoComplete="name" placeholder="Ex: João da Silva Santos" {...register("applicant.full_name")} />
          <Field.ErrorText>{errors.applicant?.full_name?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.applicant?.cpf}>
          <Field.Label fontWeight="600" fontSize="13px" color="#374151">CPF *</Field.Label>
          <Input inputMode="numeric" placeholder="000.000.000-00" {...register("applicant.cpf")} />
          <Field.ErrorText>{errors.applicant?.cpf?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.applicant?.rg}>
          <Field.Label fontWeight="600" fontSize="13px" color="#374151">RG *</Field.Label>
          <Input placeholder="0.000.000" {...register("applicant.rg")} />
          <Field.ErrorText>{errors.applicant?.rg?.message}</Field.ErrorText>
        </Field.Root>
      </Grid>

      {/* ── Email · Endereço · Telefone ── */}
      <Grid
        templateColumns={{ base: "1fr", md: "1fr 1fr", lg: "2fr 3fr 2fr" }}
        gap={4}
      >
        <Field.Root invalid={!!errors.applicant?.email}>
          <Field.Label fontWeight="600" fontSize="13px" color="#374151">Email *</Field.Label>
          <Input autoComplete="email" placeholder="seu@email.com" {...register("applicant.email")} />
          <Field.ErrorText>{errors.applicant?.email?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.applicant?.address}>
          <Field.Label fontWeight="600" fontSize="13px" color="#374151">Endereço *</Field.Label>
          <Input placeholder="Rua, número, bairro, cidade — UF" {...register("applicant.address")} />
          <Field.ErrorText>{errors.applicant?.address?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.applicant?.phone}>
          <Field.Label fontWeight="600" fontSize="13px" color="#374151">Telefone *</Field.Label>
          <Input autoComplete="tel" placeholder="(00) 00000-0000" {...register("applicant.phone")} />
          <Field.ErrorText>{errors.applicant?.phone?.message}</Field.ErrorText>
        </Field.Root>
      </Grid>

    </Stack>
  );
}
