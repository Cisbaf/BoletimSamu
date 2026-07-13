import React, { useRef, useState } from "react";
import {
  Box,
  Dialog,
  Flex,
  Input,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { usePost } from "../hooks/usePost";
import { useToast } from "../hooks/useToast";
import { parseDjangoError } from "../helpers/parseErrors";
import { isValidCPF } from "../domain/valid";
import { ApiBaseUrl } from "../settings";
import {
  CORRECTION_FIELD_CATALOG,
  type Correction,
  type CorrectionField,
  type CorrectionFieldKind,
} from "../domain/documentCorrection";
import {
  CITIES,
  ATTENDANCE_LOCATIONS,
  LOCATION_LABELS,
  ApplicantSchema,
  IncidentSchema,
} from "../domain/documentSchemaForm";

const MotionBox = motion(Box);

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CorrectionModalProps {
  protocol: string;
  correction: Correction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Busca o kind do campo no catálogo; retorna "text" se não encontrado. */
function getFieldKind(fieldKey: string): CorrectionFieldKind {
  for (const cat of CORRECTION_FIELD_CATALOG) {
    const found = cat.fields.find((f) => f.key === fieldKey);
    if (found) return found.kind;
  }
  return "text";
}

/** Campos que devem usar Textarea em vez de Input. */
const TEXTAREA_FIELDS = new Set([
  "incident.reason",
  "incident.notes",
  "incident.other_location_description",
]);

/** Valida um valor textual usando o schema Zod correto para o campo. */
function validateFieldValue(fieldKey: string, value: string): string | null {
  const [namespace, field] = fieldKey.split(".");

  try {
    if (namespace === "applicant" && field) {
      const shape = ApplicantSchema.shape as Record<string, any>;
      if (shape[field]) {
        const result = shape[field].safeParse(value);
        if (!result.success) {
          return result.error.issues[0]?.message ?? "Valor inválido";
        }
      }
    } else if (namespace === "incident" && field) {
      const shape = IncidentSchema.shape as Record<string, any>;
      if (shape[field]) {
        const result = shape[field].safeParse(value);
        if (!result.success) {
          return result.error.issues[0]?.message ?? "Valor inválido";
        }
      }
    }
  } catch {
    // Se o campo não tem validação Zod direta, não bloqueia
  }

  if (!value.trim()) return "Campo obrigatório";
  return null;
}

// ─── Componente de upload de arquivo ─────────────────────────────────────────

function UploadIcon() {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3v12M12 3l-3.5 3.5M12 3l3.5 3.5M3 17c0 2.2 1.8 4 4 4h10c2.2 0 4-1.8 4-4"
        stroke="#F97316"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        stroke="#F97316"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileUploadFieldInlineProps {
  file: File | null;
  error?: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
}

function FileUploadFieldInline({ file, error, onSelect, onRemove }: FileUploadFieldInlineProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onSelect(f);
  };

  return (
    <Box>
      {!file ? (
        <Box
          border="2px dashed"
          borderColor={error ? "#E03131" : isDragging ? "#F97316" : "#FED7AA"}
          borderRadius="12px"
          bg={isDragging ? "#FFF7ED" : error ? "#FEF2F2" : "#FFF7ED"}
          py={5}
          px={4}
          textAlign="center"
          cursor="pointer"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          transition="all 0.2s"
          _hover={{ borderColor: "#F97316", bg: "#FFF7ED" }}
        >
          <Flex justify="center" mb={2}>
            <Box
              w="40px"
              h="40px"
              bg="#FED7AA"
              borderRadius="10px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <UploadIcon />
            </Box>
          </Flex>
          <Text fontSize="13px" fontWeight="600" color="#C2410C" mb={1}>
            Arraste o arquivo aqui
          </Text>
          <Text fontSize="11px" color="#FB923C">
            ou clique para selecionar
          </Text>
          <Text fontSize="11px" color="#9CA3AF" mt={2}>
            PDF, JPG, PNG · Máx. 5 MB
          </Text>
        </Box>
      ) : (
        <Flex
          align="center"
          gap={3}
          px={3}
          py={2}
          border="1.5px solid #FED7AA"
          borderRadius="10px"
          bg="#FFF7ED"
        >
          <Box flexShrink={0}><FileIcon /></Box>
          <Box flex={1} minW={0}>
            <Text fontSize="12px" fontWeight="600" color="#C2410C" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
              {file.name}
            </Text>
            <Text fontSize="10px" color="#FB923C">{formatSize(file.size)}</Text>
          </Box>
          <Box
            role="button"
            tabIndex={0}
            onClick={onRemove}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onRemove(); }}
            w="24px"
            h="24px"
            borderRadius="full"
            bg="#FED7AA"
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            flexShrink={0}
            color="#C2410C"
            fontWeight="700"
            fontSize="12px"
            _hover={{ bg: "#FDBA74" }}
            title="Remover arquivo"
          >
            ✕
          </Box>
        </Flex>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
          // Reset o input para permitir re-seleção do mesmo arquivo
          e.target.value = "";
        }}
      />

      {error && (
        <Text fontSize="11px" color="#DC2626" mt={1} fontWeight="600">
          {error}
        </Text>
      )}
    </Box>
  );
}

// ─── Card de campo individual ─────────────────────────────────────────────────

interface FieldCardProps {
  correctionField: CorrectionField;
  kind: CorrectionFieldKind;
  textValue: string;
  fileValue: File | null;
  fieldError: string | null;
  onTextChange: (value: string) => void;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
}

function FieldCard({
  correctionField,
  kind,
  textValue,
  fileValue,
  fieldError,
  onTextChange,
  onFileSelect,
  onFileRemove,
}: FieldCardProps) {
  const isTextarea = TEXTAREA_FIELDS.has(correctionField.fieldKey);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${fieldError ? "#E03131" : "#E5E7EB"}`,
    borderRadius: "10px",
    fontSize: "13px",
    fontFamily: "inherit",
    backgroundColor: "#F9FAFB",
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <Box
      p={4}
      border="1px solid #FED7AA"
      borderRadius="12px"
      bg="white"
    >
      {/* Rótulo do campo */}
      <Text fontSize="13px" fontWeight="700" color="#111827" mb={2}>
        {correctionField.fieldLabel}
      </Text>

      {/* Comentário do admin */}
      <Box
        mb={3}
        p={3}
        bg="#FFF7ED"
        border="1px solid #FED7AA"
        borderLeft="3px solid #F97316"
        borderRadius="8px"
      >
        <Text fontSize="11px" fontWeight="700" color="#9A3412" textTransform="uppercase" letterSpacing="0.5px" mb={1}>
          Apontamento do administrador
        </Text>
        <Text fontSize="12px" color="#7C2D12" lineHeight={1.6}>
          {correctionField.adminComment}
        </Text>
      </Box>

      {/* Input adequado ao kind */}
      {kind === "file" ? (
        <FileUploadFieldInline
          file={fileValue}
          error={fieldError}
          onSelect={onFileSelect}
          onRemove={onFileRemove}
        />
      ) : kind === "select" && correctionField.fieldKey === "incident.city" ? (
        <Box>
          <select
            value={textValue}
            onChange={(e) => onTextChange(e.target.value)}
            style={{ ...inputStyle, height: "40px" }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#F97316";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = fieldError ? "#E03131" : "#E5E7EB";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <option value="">Selecione um município...</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          {fieldError && (
            <Text fontSize="11px" color="#DC2626" mt={1} fontWeight="600">{fieldError}</Text>
          )}
        </Box>
      ) : kind === "select" && correctionField.fieldKey === "incident.attendance_location" ? (
        <Box>
          <select
            value={textValue}
            onChange={(e) => onTextChange(e.target.value)}
            style={{ ...inputStyle, height: "40px" }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#F97316";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = fieldError ? "#E03131" : "#E5E7EB";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <option value="">Selecione o local de atendimento...</option>
            {ATTENDANCE_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{LOCATION_LABELS[loc]}</option>
            ))}
          </select>
          {fieldError && (
            <Text fontSize="11px" color="#DC2626" mt={1} fontWeight="600">{fieldError}</Text>
          )}
        </Box>
      ) : kind === "date" ? (
        <Box>
          <input
            type="date"
            value={textValue}
            onChange={(e) => onTextChange(e.target.value)}
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#F97316";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = fieldError ? "#E03131" : "#E5E7EB";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {fieldError && (
            <Text fontSize="11px" color="#DC2626" mt={1} fontWeight="600">{fieldError}</Text>
          )}
        </Box>
      ) : kind === "time" ? (
        <Box>
          <input
            type="time"
            value={textValue}
            onChange={(e) => onTextChange(e.target.value)}
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#F97316";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = fieldError ? "#E03131" : "#E5E7EB";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {fieldError && (
            <Text fontSize="11px" color="#DC2626" mt={1} fontWeight="600">{fieldError}</Text>
          )}
        </Box>
      ) : isTextarea ? (
        <Box>
          <textarea
            value={textValue}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={`Novo valor para "${correctionField.fieldLabel}"...`}
            style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#F97316";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = fieldError ? "#E03131" : "#E5E7EB";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {fieldError && (
            <Text fontSize="11px" color="#DC2626" mt={1} fontWeight="600">{fieldError}</Text>
          )}
        </Box>
      ) : (
        /* text padrão */
        <Box>
          <input
            type="text"
            value={textValue}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={`Novo valor para "${correctionField.fieldLabel}"...`}
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#F97316";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = fieldError ? "#E03131" : "#E5E7EB";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {fieldError && (
            <Text fontSize="11px" color="#DC2626" mt={1} fontWeight="600">{fieldError}</Text>
          )}
        </Box>
      )}
    </Box>
  );
}

// ─── Estado de sucesso ────────────────────────────────────────────────────────

function SuccessState({ onClose }: { onClose: () => void }) {
  return (
    <MotionBox initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <Box h="4px" bg="linear-gradient(90deg, #F97316, #EA580C)" />
      <Flex direction="column" align="center" textAlign="center" px={8} py={10} gap={5}>
        <Box
          w="60px"
          h="60px"
          bg="#FFF7ED"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="26px"
          color="#F97316"
        >
          ✓
        </Box>
        <Box>
          <Text fontSize="17px" fontWeight="800" color="#111827" letterSpacing="-0.3px" mb={2}>
            Correção enviada!
          </Text>
          <Text fontSize="13px" color="#6B7280" maxW="300px">
            Suas respostas foram registradas. Nossa equipe irá analisar as correções
            enviadas e você acompanhará o resultado pela linha do tempo.
          </Text>
        </Box>
        <Box
          role="button"
          tabIndex={0}
          onClick={onClose}
          onKeyDown={(e) => { if (e.key === "Enter") onClose(); }}
          cursor="pointer"
          w="full"
          textAlign="center"
          py="12px"
          bg="#F97316"
          color="white"
          borderRadius="12px"
          fontWeight="700"
          fontSize="14px"
          transition="all 0.15s"
          _hover={{ bg: "#EA580C" }}
        >
          Ver na linha do tempo
        </Box>
      </Flex>
    </MotionBox>
  );
}

// ─── CorrectionModal (principal) ──────────────────────────────────────────────

export default function CorrectionModal({
  protocol,
  correction,
  open,
  onOpenChange,
  onSuccess,
}: CorrectionModalProps) {
  const fields = correction.fields;

  // Valores de texto por fieldKey
  const [textValues, setTextValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.fieldKey, ""]))
  );

  // Arquivos por fieldKey (apenas campos "file")
  const [fileValues, setFileValues] = useState<Record<string, File | null>>(() =>
    Object.fromEntries(fields.map((f) => [f.fieldKey, null]))
  );

  // Erros por fieldKey
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  // CPF de confirmação
  const [cpf, setCpf] = useState("");
  const [cpfError, setCpfError] = useState<string | null>(null);

  // Erro geral (400, 429, etc.)
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [confirmed, setConfirmed] = useState(false);

  const { success: showSuccess, error: showError } = useToast();

  const { post, loading } = usePost({
    url: `${ApiBaseUrl}/document/corrections/submit/`,
    multiPart: true,
    onSuccess: () => {
      setConfirmed(true);
      showSuccess({ title: "Correção enviada com sucesso!" });
      onSuccess?.();
    },
    onError: (err) => {
      const status = err?.status ?? err?.response?.status;
      let message: string;
      if (status === 429) {
        message = "Muitas tentativas. Aguarde um momento antes de tentar novamente.";
      } else {
        message = parseDjangoError(err);
      }
      setGlobalError(message);
      showError({ title: "Não foi possível enviar a correção", description: message });
    },
  });

  function reset() {
    setTextValues(Object.fromEntries(fields.map((f) => [f.fieldKey, ""])));
    setFileValues(Object.fromEntries(fields.map((f) => [f.fieldKey, null])));
    setFieldErrors({});
    setCpf("");
    setCpfError(null);
    setGlobalError(null);
    setConfirmed(false);
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function handleTextChange(fieldKey: string, value: string) {
    setTextValues((prev) => ({ ...prev, [fieldKey]: value }));
    // Limpa erro ao editar
    setFieldErrors((prev) => ({ ...prev, [fieldKey]: null }));
  }

  function handleFileSelect(fieldKey: string, file: File) {
    setFileValues((prev) => ({ ...prev, [fieldKey]: file }));
    setFieldErrors((prev) => ({ ...prev, [fieldKey]: null }));
  }

  function handleFileRemove(fieldKey: string) {
    setFileValues((prev) => ({ ...prev, [fieldKey]: null }));
  }

  /** Valida todos os campos. Retorna true se tudo ok. */
  function validateAll(): boolean {
    const errors: Record<string, string | null> = {};
    let valid = true;

    for (const f of fields) {
      const kind = getFieldKind(f.fieldKey);
      if (kind === "file") {
        if (!fileValues[f.fieldKey]) {
          errors[f.fieldKey] = "Selecione um arquivo para este campo.";
          valid = false;
        }
      } else {
        const val = textValues[f.fieldKey] ?? "";
        const err = validateFieldValue(f.fieldKey, val);
        if (err) {
          errors[f.fieldKey] = err;
          valid = false;
        }
      }
    }

    setFieldErrors(errors);
    return valid;
  }

  function handleSubmit() {
    setGlobalError(null);

    // Valida campos
    const fieldsOk = validateAll();

    // Valida CPF
    const cpfDigits = cpf.replace(/\D/g, "");
    if (!isValidCPF(cpfDigits)) {
      setCpfError("Informe um CPF válido.");
      return;
    }
    setCpfError(null);

    if (!fieldsOk) return;

    // Monta FormData
    const formData = new FormData();
    formData.append("protocol", protocol);
    formData.append("cpf", cpfDigits);

    // answers: apenas campos não-file
    const answers: { field_key: string; value: string }[] = [];
    for (const f of fields) {
      const kind = getFieldKind(f.fieldKey);
      if (kind !== "file") {
        answers.push({ field_key: f.fieldKey, value: textValues[f.fieldKey] ?? "" });
      }
    }
    formData.append("answers", JSON.stringify(answers));

    // Arquivos: uma part por campo, com name = field_key
    for (const f of fields) {
      const kind = getFieldKind(f.fieldKey);
      if (kind === "file") {
        const file = fileValues[f.fieldKey];
        if (file) {
          formData.append(f.fieldKey, file);
        }
      }
    }

    post(formData);
  }

  /** Verifica se todos os campos obrigatórios têm resposta válida (sem erros). */
  const allFieldsAnswered = fields.every((f) => {
    const kind = getFieldKind(f.fieldKey);
    if (kind === "file") return !!fileValues[f.fieldKey];
    const val = textValues[f.fieldKey] ?? "";
    return val.trim().length > 0;
  });

  const submitDisabled = loading || !allFieldsAnswered;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => (e.open ? onOpenChange(true) : handleClose())}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxW={{ base: "96%", md: "560px" }}
            w="full"
            borderRadius="2xl"
            overflow="hidden"
            p={0}
            maxH="90vh"
            display="flex"
            flexDirection="column"
          >
            {confirmed ? (
              <SuccessState onClose={handleClose} />
            ) : (
              <MotionBox
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                display="flex"
                flexDirection="column"
                overflow="hidden"
                flex={1}
              >
                {/* Header */}
                <Box px={6} pt={6} pb={5} borderBottom="1px solid #FED7AA" flexShrink={0}>
                  <Flex align="center" gap={3} mb={1}>
                    <Box
                      w="32px"
                      h="32px"
                      bg="#FFF7ED"
                      borderRadius="8px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                          stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                        />
                        <path
                          d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"
                          stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                        />
                      </svg>
                    </Box>
                    <Box>
                      <Text fontSize="16px" fontWeight="800" color="#111827" letterSpacing="-0.3px">
                        Corrigir Preenchimento
                      </Text>
                      <Text fontSize="11px" color="#9CA3AF">
                        Protocolo {protocol}
                      </Text>
                    </Box>
                  </Flex>
                </Box>

                {/* Corpo scrollável */}
                <Box overflowY="auto" flex={1} px={6} py={5}>
                  <Text fontSize="13px" color="#4B5563" lineHeight={1.7} mb={5}>
                    O administrador identificou campos preenchidos incorretamente. Revise cada
                    apontamento abaixo, corrija o valor e envie para análise.
                  </Text>

                  {/* Campos apontados */}
                  <Stack gap={4} mb={5}>
                    {fields.map((f) => (
                      <FieldCard
                        key={f.fieldKey}
                        correctionField={f}
                        kind={getFieldKind(f.fieldKey)}
                        textValue={textValues[f.fieldKey] ?? ""}
                        fileValue={fileValues[f.fieldKey] ?? null}
                        fieldError={fieldErrors[f.fieldKey] ?? null}
                        onTextChange={(val) => handleTextChange(f.fieldKey, val)}
                        onFileSelect={(file) => handleFileSelect(f.fieldKey, file)}
                        onFileRemove={() => handleFileRemove(f.fieldKey)}
                      />
                    ))}
                  </Stack>

                  {/* CPF de confirmação */}
                  <Box
                    p={4}
                    bg="#F9FAFB"
                    border="1px solid #E5E7EB"
                    borderRadius="12px"
                  >
                    <Text fontSize="12px" fontWeight="700" color="#374151" mb={1}>
                      Confirme seu CPF para enviar
                    </Text>
                    <Text fontSize="11px" color="#9CA3AF" mb={3}>
                      Precisa ser o mesmo CPF cadastrado como solicitante deste pedido.
                    </Text>
                    <Input
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                      value={cpf}
                      onChange={(e) => { setCpf(e.target.value); setCpfError(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter" && !submitDisabled) handleSubmit(); }}
                      h="44px"
                      bg="white"
                      border={`1px solid ${cpfError ? "#E03131" : "#E5E7EB"}`}
                      borderRadius="12px"
                      fontSize="14px"
                      fontFamily="mono"
                      _focus={{ borderColor: "#F97316", boxShadow: "0 0 0 3px rgba(249,115,22,0.12)" }}
                    />
                    {cpfError && (
                      <Text fontSize="12px" color="#DC2626" mt={2} fontWeight="600">
                        {cpfError}
                      </Text>
                    )}
                  </Box>

                  {/* Erro global */}
                  {globalError && (
                    <Box
                      mt={3}
                      p={3}
                      bg="#FEF2F2"
                      border="1px solid #FECACA"
                      borderLeft="3px solid #EF4444"
                      borderRadius="8px"
                    >
                      <Text fontSize="12px" color="#DC2626" fontWeight="600">
                        {globalError}
                      </Text>
                    </Box>
                  )}
                </Box>

                {/* Footer com botões */}
                <Flex px={6} pb={6} pt={4} gap={3} borderTop="1px solid #F3F4F6" flexShrink={0}>
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={handleClose}
                    onKeyDown={(e) => { if (e.key === "Enter") handleClose(); }}
                    flex={1}
                    textAlign="center"
                    py="11px"
                    bg="white"
                    border="1px solid #E5E7EB"
                    color="#374151"
                    borderRadius="12px"
                    fontWeight="700"
                    fontSize="14px"
                    cursor="pointer"
                  >
                    Cancelar
                  </Box>
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={submitDisabled ? undefined : handleSubmit}
                    onKeyDown={(e) => { if (e.key === "Enter" && !submitDisabled) handleSubmit(); }}
                    flex={2}
                    textAlign="center"
                    py="11px"
                    bg={submitDisabled ? "#FED7AA" : "#F97316"}
                    color={submitDisabled ? "#9A3412" : "white"}
                    borderRadius="12px"
                    fontWeight="700"
                    fontSize="14px"
                    cursor={submitDisabled ? "not-allowed" : "pointer"}
                    transition="all 0.15s"
                    _hover={submitDisabled ? undefined : { bg: "#EA580C" }}
                    opacity={submitDisabled ? 0.7 : 1}
                  >
                    {loading ? "Enviando..." : "Enviar Correções"}
                  </Box>
                </Flex>
              </MotionBox>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
