import {
  Box,
  VStack,
  Text,
  HStack,
  Flex,
  Button
} from "@chakra-ui/react";
import { useDocumentFormContext } from "../../context/DocumentFormContext";
import { FiCheckCircle, FiXCircle, FiCircle } from "react-icons/fi";
import { useStepperRequestContext } from "../../context/StepperRequestContext";
import { DOCUMENT_LABELS } from "../../domain/documentSchemaForm";
import { getRequiredDocuments } from "../../domain/required_documents";

export function getDocumentProgressFields(
  applicantType?: string,
  relationship?: string
) {
  const requiredDocs = getRequiredDocuments(applicantType, relationship);

  return requiredDocs.map((doc) => ({
    name: `documents.${doc}`,
    label: DOCUMENT_LABELS[doc],
    docType: doc, // ✅ sem cast, sem gambiarra
  }));
}

const DOCUMENTS_STEP_INDEX = 2;

export const FORM_PROGRESS_MAP = [
  {
    title: "Dados Pessoais",
    index: 0,
    fields: [
      { name: "applicant.applicant_type", label: "Tipo de solicitante" },
      {
        name: "applicant.relationship_degree",
        label: "Grau de parentesco",
        dependsOn: {
          field: "applicant.applicant_type",
          value: "REPRESENTATIVE",
        },
      },
      { name: "applicant.full_name", label: "Nome Completo" },
      { name: "applicant.cpf", label: "CPF" },
      { name: "applicant.rg", label: "RG" },
      { name: "applicant.email", label: "Email" },
      { name: "applicant.address", label: "Endereço" },
      { name: "applicant.phone", label: "Telefone" },
    ],
  },
  {
    title: "Dados da Ocorrência",
    index: 1,
    fields: [
      { name: "incident.patient_name", label: "Nome Paciente" },
      { name: "incident.date", label: "Data Ocorrência" },
      { name: "incident.time", label: "Hora Ocorrência" },
      { name: "incident.city", label: "Municipio" },
      { name: "incident.neighborhood", label: "Bairro" },
      { name: "incident.address", label: "Endereço" },
      { name: "incident.reason", label: "Motivo Solicitação" },
      { name: "incident.attendance_location", label: "Local Atendimento" },
    ],
  },
];


function get(obj: any, path: string) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}
export function FormProgressSummary() {
  const { setStep } = useStepperRequestContext();
  const { form } = useDocumentFormContext();
  const {
    watch,
    setFocus,
    formState: { errors },
  } = form;

  const values = watch();

  const applicantType = values.applicant?.applicant_type;
  const relationship = values.applicant?.relationship_degree;

  const documentFields = getDocumentProgressFields(
    applicantType,
    relationship
  );

  return (
    <VStack
      align="stretch"
      p={{ md: 3, lg: 4 }}
      bg="gray.50"
      borderRadius="lg"
      gap={{ md: 0.5, lg: 1 }}
    >
      {/* SEÇÕES EXISTENTES */}
      {FORM_PROGRESS_MAP.map((section) => (
        <Box key={section.title}>
          <Text fontWeight="bold" mb={2} fontSize={{ md: "sm", lg: "md" }}>
            {section.title}
          </Text>

          <VStack align="stretch" gap={2} pl={2}>
            {section.fields.map((field) => {
              if (field.dependsOn) {
                const depValue = get(values, field.dependsOn.field);
                if (depValue !== field.dependsOn.value) return null;
              }

              const value = get(values, field.name);
              const error = get(errors, field.name);

              let status: "done" | "error" | "empty" = "empty";
              if (value) status = "done";
              if (error) status = "error";

              const IconComponent =
                status === "done"
                  ? FiCheckCircle
                  : status === "error"
                  ? FiXCircle
                  : FiCircle;

              const color =
                status === "done"
                  ? "green.500"
                  : status === "error"
                  ? "red.500"
                  : "gray.400";

              return (
                <HStack key={field.name}>
                  <IconComponent size={16} color="currentColor" />
                  <Button
                    padding={0}
                    h={0}
                    variant="ghost"
                    onClick={() => {
                      setStep(section.index);
                      // @ts-expect-error RHF aceita path string
                      setFocus(field.name);
                    }}
                  >
                    <Text fontSize={{ md: "xs", lg: "sm" }} color={color}>
                      {field.label}
                    </Text>
                  </Button>
                </HStack>
              );
            })}
          </VStack>
        </Box>
      ))}

      {/* 🧷 NOVA SEÇÃO — DOCUMENTOS */}
      {documentFields.length > 0 && (
        <Box mt={3}>
          <Text fontWeight="bold" mb={2} fontSize={{ md: "sm", lg: "md" }}>
            Documentos
          </Text>

          <VStack align="stretch" gap={0} pl={2}>
            {documentFields.map((doc) => {
              const value = get(values, doc.name);
              const error = get(errors, doc.name);

              let status: "done" | "error" | "empty" = "empty";
              if (value) status = "done";
              if (error) status = "error";

              const IconComponent =
                status === "done"
                  ? FiCheckCircle
                  : status === "error"
                  ? FiXCircle
                  : FiCircle;

              const color =
                status === "done"
                  ? "green.500"
                  : status === "error"
                  ? "red.500"
                  : "gray.400";

              return (
                  <Flex>
                  <IconComponent size={16} color="currentColor" />
                  <Button
                    variant="ghost"
                    p={0}
                    h="auto"
                    justifyContent="flex-start"
                    onClick={() => setStep(DOCUMENTS_STEP_INDEX)}
                  >
                    <Text fontSize={{ md: "xs", lg: "sm" }} textWrap={"wrap"} color={color}>
                      {doc.label}
                    </Text>
                  </Button>
                </Flex>
              );
            })}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}
