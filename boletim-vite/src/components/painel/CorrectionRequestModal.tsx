import React from "react";
import {
  Box,
  Flex,
  Text,
  Textarea,
  Checkbox,
  Portal,
  CloseButton,
  Dialog,
} from "@chakra-ui/react";
import type { DocumentDetail } from "../../domain/documentDetail";
import {
  CORRECTION_FIELD_CATALOG,
  type CorrectionFieldDescriptor,
} from "../../domain/documentCorrection";
import { useDocumentDetailContext } from "../../context/DocumentDetail";

interface CorrectionRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentDetail;
}

interface FieldState {
  checked: boolean;
  comment: string;
}

// ─── CorrectionRequestModal ───────────────────────────────────────────────────

export default function CorrectionRequestModal({
  open,
  onOpenChange,
  document,
}: CorrectionRequestModalProps) {
  const { newCorrection } = useDocumentDetailContext();
  const [fieldStates, setFieldStates] = React.useState<Record<string, FieldState>>({});
  const [submitting, setSubmitting] = React.useState(false);

  // Conjunto de document_types presentes nos anexos do pedido
  const attachmentTypes = React.useMemo(
    () => new Set(document.documents.map((d) => d.documentType)),
    [document.documents]
  );

  // Catálogo filtrado: na categoria "Documentos Anexados", exibir só os tipos
  // que realmente existem nos anexos do pedido atual.
  const filteredCatalog = React.useMemo(
    () =>
      CORRECTION_FIELD_CATALOG.map((cat) => {
        if (cat.category === "Documentos Anexados") {
          return {
            ...cat,
            fields: cat.fields.filter((f) => {
              const docType = f.key.replace("attachment.", "");
              return attachmentTypes.has(docType as any);
            }),
          };
        }
        return cat;
      }).filter((cat) => cat.fields.length > 0),
    [attachmentTypes]
  );

  const handleCheck = (key: string, checked: boolean) => {
    setFieldStates((prev) => ({
      ...prev,
      [key]: { checked, comment: prev[key]?.comment ?? "" },
    }));
  };

  const handleComment = (key: string, comment: string) => {
    setFieldStates((prev) => ({
      ...prev,
      [key]: { checked: prev[key]?.checked ?? false, comment },
    }));
  };

  const checkedFields = Object.entries(fieldStates).filter(([, s]) => s.checked);
  const allCommentsFilledIn = checkedFields.every(([, s]) => s.comment.trim().length > 0);
  const canSubmit = checkedFields.length > 0 && allCommentsFilledIn;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const fields = checkedFields.map(([key, s]) => ({
        fieldKey: key,
        adminComment: s.comment.trim(),
      }));
      const response = await newCorrection(document.id, fields);
      if (response) {
        setFieldStates({});
        onOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFieldStates({});
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => { if (!e.open) handleClose(); }}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW={{ base: "95%", md: "640px" }} w="full">
            <Dialog.Header borderBottom="1px solid #F3F4F6" pb={4}>
              <Dialog.Title>
                <Text fontWeight="700" fontSize="15px" color="#111827">
                  Solicitar Correção de Preenchimento
                </Text>
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.CloseTrigger asChild>
              <CloseButton
                size="sm"
                position="absolute"
                top="2"
                right="2"
                onClick={handleClose}
              />
            </Dialog.CloseTrigger>

            <Dialog.Body py={5} maxH="60vh" overflowY="auto">
              <Text fontSize="12px" color="#6B7280" mb={4}>
                Marque os campos que precisam ser corrigidos e adicione um comentário
                explicando o erro em cada um.
              </Text>

              <Flex direction="column" gap={5}>
                {filteredCatalog.map((cat) => (
                  <Box key={cat.category}>
                    {/* Cabeçalho da categoria */}
                    <Flex align="center" gap={2} mb={3}>
                      <Box w="3px" h="14px" bg="#2563EB" borderRadius="full" flexShrink={0} />
                      <Text fontSize="12px" fontWeight="700" color="#374151" textTransform="uppercase" letterSpacing="0.5px">
                        {cat.category}
                      </Text>
                    </Flex>

                    <Flex direction="column" gap={3}>
                      {cat.fields.map((field: CorrectionFieldDescriptor) => {
                        const state = fieldStates[field.key];
                        const isChecked = state?.checked ?? false;

                        return (
                          <Box
                            key={field.key}
                            border="1px solid"
                            borderColor={isChecked ? "#BFDBFE" : "#E5E7EB"}
                            borderRadius="10px"
                            p={3}
                            bg={isChecked ? "#EFF6FF" : "white"}
                            transition="all 0.15s"
                          >
                            <Flex align="center" gap={3} cursor="pointer" onClick={() => handleCheck(field.key, !isChecked)}>
                              <Checkbox.Root
                                checked={isChecked}
                                onCheckedChange={(e) => handleCheck(field.key, !!e.checked)}
                                colorPalette="blue"
                              >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control />
                              </Checkbox.Root>
                              <Text fontSize="13px" fontWeight="600" color="#111827">
                                {field.label}
                              </Text>
                            </Flex>

                            {isChecked && (
                              <Box mt={3}>
                                <Text fontSize="11px" fontWeight="600" color="#374151" mb={1}>
                                  Comentário para o cidadão{" "}
                                  <Text as="span" color="#EF4444">*</Text>
                                </Text>
                                <Textarea
                                  placeholder="Explique o erro neste campo..."
                                  value={state?.comment ?? ""}
                                  onChange={(e) => handleComment(field.key, e.target.value)}
                                  bg="white"
                                  border="1px solid #E5E7EB"
                                  borderRadius="8px"
                                  fontSize="13px"
                                  minH="70px"
                                  resize="vertical"
                                  _focus={{ borderColor: "#2563EB", boxShadow: "0 0 0 3px rgba(37,99,235,0.12)" }}
                                />
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Flex>
                  </Box>
                ))}
              </Flex>
            </Dialog.Body>

            <Dialog.Footer borderTop="1px solid #F3F4F6" pt={4} gap={3}>
              <Box
                role="button"
                tabIndex={0}
                onClick={handleClose}
                onKeyDown={(e) => { if (e.key === "Enter") handleClose(); }}
                flex={1}
                textAlign="center"
                py="11px"
                bg="white"
                color="#374151"
                border="1px solid #E5E7EB"
                borderRadius="10px"
                fontWeight="700"
                fontSize="14px"
                cursor="pointer"
                transition="all 0.15s"
                _hover={{ bg: "#F3F4F6" }}
              >
                Cancelar
              </Box>

              <Box
                role="button"
                tabIndex={0}
                onClick={canSubmit && !submitting ? handleSubmit : undefined}
                onKeyDown={(e) => { if (e.key === "Enter" && canSubmit && !submitting) handleSubmit(); }}
                flex={1}
                textAlign="center"
                py="11px"
                bg={canSubmit && !submitting ? "#F97316" : "#D1D5DB"}
                color="white"
                borderRadius="10px"
                fontWeight="700"
                fontSize="14px"
                cursor={canSubmit && !submitting ? "pointer" : "not-allowed"}
                transition="all 0.15s"
                _hover={canSubmit && !submitting ? { bg: "#EA580C" } : undefined}
                boxShadow={canSubmit && !submitting ? "0 2px 8px rgba(249,115,22,0.28)" : "none"}
              >
                {submitting ? "Enviando..." : "Solicitar Correção"}
              </Box>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
