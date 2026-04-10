import {
  Field,
  Stack,
  Input,
  Text,
} from "@chakra-ui/react";
import { useDocumentFormContext } from "../../context/DocumentFormContext";
import { getRequiredDocuments } from "../../domain/required_documents";
import { DOCUMENT_LABELS,  } from "../../domain/documentSchemaForm";
import React from "react";

export default function AttachmentsForm() {
  const { form } = useDocumentFormContext();
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;

  const applicantType = watch("applicant.applicant_type");
  const relationship = watch("applicant.relationship_degree");

  const requiredDocs = getRequiredDocuments(applicantType, relationship);

  const previousApplicantType = React.useRef(applicantType);
  const previousRelationship = React.useRef(relationship);

  React.useEffect(() => {
  previousApplicantType.current = applicantType;
  previousRelationship.current = relationship;
}, [applicantType, relationship]);

  if (!requiredDocs.length) {
    return (
      <Text color="gray.500">
        Selecione o tipo de solicitante para anexar documentos.
      </Text>
    );
  }

  return (
    <Stack gap={6}>
      {requiredDocs.map((docType) => (
        <Field.Root
          key={docType}
          invalid={!!errors.documents?.[docType]}
        >
          <Field.Label fontWeight="bold">
            {DOCUMENT_LABELS[docType as keyof typeof DOCUMENT_LABELS]}
          </Field.Label>

          <Input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setValue(`documents.${docType}` as any, file, {
                  shouldValidate: true,
                });
              }
            }}
          />

          <Field.ErrorText>
            {errors.documents?.[docType]?.message as string}
          </Field.ErrorText>
        </Field.Root>
      ))}
    </Stack>
  );
}
