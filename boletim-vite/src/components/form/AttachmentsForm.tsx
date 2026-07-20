import {
  Box,
  Field,
  Flex,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useDocumentFormContext } from "../../context/DocumentFormContext";
import { getRequiredDocuments } from "../../domain/required_documents";
import { DOCUMENT_LABELS, DOCUMENT_DESCRIPTIONS } from "../../domain/documentSchemaForm";
import type { RequiredDocument } from "../../domain/documentSchemaForm";
import React, { useRef, useState } from "react";

// ─── Ícone de upload ─────────────────────────────────────────────────────────

function UploadIcon() {
  return (
    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3v12M12 3l-3.5 3.5M12 3l3.5 3.5M3 17c0 2.2 1.8 4 4 4h10c2.2 0 4-1.8 4-4"
        stroke="#2563EB"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        stroke="#2563EB"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Formata tamanho de arquivo ───────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Componente de upload por campo ──────────────────────────────────────────

interface FileUploadFieldProps {
  docType: RequiredDocument;
  label: string;
  description?: string;
  currentFile: File | undefined;
  error?: string;
  onSelect: (file: File) => void;
  onRemove: () => void;
  resetKey: string;
}

function FileUploadField({
  label,
  description,
  currentFile,
  error,
  onSelect,
  onRemove,
  resetKey,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onSelect(file);
  };

  const hasFile = !!currentFile;

  return (
    <Field.Root invalid={!!error}>
      <Field.Label fontWeight="600" fontSize="13px" color="#374151" mb={description ? 1 : 2}>
        {label}
      </Field.Label>
      {description && (
        <Text fontSize="12px" color="#6B7280" mb={2}>
          {description}
        </Text>
      )}

      {/* Zona de upload */}
      {!hasFile ? (
        <Box
          border="2px dashed"
          borderColor={error ? "#E03131" : isDragging ? "#2563EB" : "#BFDBFE"}
          borderRadius="12px"
          bg={isDragging ? "#EFF6FF" : error ? "#FEF2F2" : "#F0F7FF"}
          py={6}
          px={4}
          textAlign="center"
          cursor="pointer"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          transition="all 0.2s"
          _hover={{ borderColor: "#2563EB", bg: "#EFF6FF" }}
        >
          {/* Ícone */}
          <Flex justify="center" mb={3}>
            <Box
              w="48px"
              h="48px"
              bg="#DBEAFE"
              borderRadius="12px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <UploadIcon />
            </Box>
          </Flex>

          <Text fontSize="14px" fontWeight="600" color="#1D4ED8" mb={1}>
            Arraste o arquivo aqui
          </Text>
          <Text fontSize="12px" color="#60A5FA" mb={3}>
            ou clique para selecionar
          </Text>

          <Box
            display="inline-block"
            px={4}
            py="6px"
            border="1.5px solid #BFDBFE"
            borderRadius="8px"
            bg="white"
            fontSize="12px"
            fontWeight="600"
            color="#374151"
          >
            Escolher arquivo
          </Box>

          <Text fontSize="11px" color="#94A3B8" mt={3}>
            PDF, JPG, PNG · Máx. 5MB
          </Text>
        </Box>
      ) : (
        /* Arquivo selecionado */
        <Flex
          align="center"
          gap={3}
          px={4}
          py={3}
          border="1.5px solid #BFDBFE"
          borderRadius="10px"
          bg="#F0F7FF"
        >
          <Box flexShrink={0}><FileIcon /></Box>

          <Box flex={1} minW={0}>
            <Text
              fontSize="13px"
              fontWeight="600"
              color="#1D4ED8"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {currentFile.name}
            </Text>
            <Text fontSize="11px" color="#60A5FA">
              {formatSize(currentFile.size)}
            </Text>
          </Box>

          {/* Botão remover */}
          <Box
            role="button"
            tabIndex={0}
            onClick={onRemove}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onRemove(); }}
            w="28px"
            h="28px"
            borderRadius="full"
            bg="#DBEAFE"
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            flexShrink={0}
            color="#2563EB"
            fontWeight="700"
            fontSize="14px"
            transition="all 0.15s"
            _hover={{ bg: "#BFDBFE" }}
            title="Remover arquivo"
          >
            ✕
          </Box>
        </Flex>
      )}

      {/* Input oculto */}
      <input
        key={resetKey}
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
        }}
      />

      <Field.ErrorText>{error}</Field.ErrorText>
    </Field.Root>
  );
}

// ─── Form principal ───────────────────────────────────────────────────────────

export default function AttachmentsForm() {
  const { form } = useDocumentFormContext();
  const { watch, setValue, formState: { errors } } = form;

  const applicantType = watch("applicant.applicant_type");
  const relationship  = watch("applicant.relationship_degree");
  const purpose       = watch("purpose");
  const currentDocs   = watch("documents");

  const requiredDocs = getRequiredDocuments(applicantType, relationship, purpose);

  const previousRelationship = React.useRef(relationship);
  const previousPurpose      = React.useRef(purpose);

  React.useEffect(() => {
    if (previousRelationship.current !== relationship) {
      setValue("documents", undefined);
      previousRelationship.current = relationship;
    }

    if (previousPurpose.current !== purpose) {
      if (previousPurpose.current === "OBITO") {
        if (!currentDocs) return;
        const { DEATH_CERTIFICATE, ...rest } = currentDocs;
        // @ts-ignore
        setValue("documents", rest);
      }
      previousPurpose.current = purpose;
    }
  }, [relationship, purpose]);

  if (!requiredDocs.length) {
    return (
      <Box
        textAlign="center"
        py={8}
        border="2px dashed #E5E7EB"
        borderRadius="12px"
        bg="#F9FAFB"
      >
        <Text fontSize="13px" color="#9CA3AF">
          Selecione o tipo de solicitante na etapa 1 para carregar os documentos necessários.
        </Text>
      </Box>
    );
  }

  return (
    <Stack gap={5}>
   
      {/* Campos de upload */}
      {requiredDocs.map((docType) => (
        <FileUploadField
          key={docType}
          docType={docType}
          label={DOCUMENT_LABELS[docType]}
          description={DOCUMENT_DESCRIPTIONS[docType]}
          currentFile={currentDocs?.[docType]}
          error={errors.documents?.[docType]?.message as string | undefined}
          resetKey={`${docType}-${relationship}-${purpose}`}
          onSelect={(file) => {
            setValue(`documents.${docType}` as any, file, { shouldValidate: true });
          }}
          onRemove={() => {
            setValue(`documents.${docType}` as any, undefined, { shouldValidate: true });
          }}
        />
      ))}
    </Stack>
  );
}
