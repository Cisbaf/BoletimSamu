import { Box, Field, Flex, Show, Text, Textarea } from "@chakra-ui/react";
import React from "react";
import {
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
} from "../ui/drawer";
import AutomaticResponses from "./AutomaticResponses";
import RectificationResponse from "./RectificationResponse";
import CorrectionReviewResponse from "./CorrectionReviewResponse";
import CorrectionRequestModal from "./CorrectionRequestModal";
import { useDocumentDetailContext } from "../../context/DocumentDetail";
import {
  getOpenRectification,
  getOpenCorrection,
  hasOpenRectification,
} from "../../utils/timeline";
import { currentDocumentStatus } from "../../utils/timeline";

interface DocumentResponseProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Botão de decisão ─────────────────────────────────────────────────────────

interface DecisionButtonProps {
  label: string
  active: boolean
  color: string
  activeBg: string
  activeBorder: string
  onClick: () => void
}

function DecisionButton({ label, active, color, activeBg, activeBorder, onClick }: DecisionButtonProps) {
  return (
    <Box
      role="button"
      tabIndex={0}
      flex={1}
      textAlign="center"
      py="10px"
      borderRadius="10px"
      fontSize="13px"
      fontWeight="700"
      cursor="pointer"
      border="2px solid"
      transition="all 0.15s"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter") onClick() }}
      bg={active ? activeBg : "white"}
      borderColor={active ? activeBorder : "#E5E7EB"}
      color={active ? color : "#9CA3AF"}
      boxShadow={active ? `0 2px 6px ${activeBg}80` : "none"}
    >
      {label}
    </Box>
  )
}

// ─── DocumentResponse ─────────────────────────────────────────────────────────

export default function DocumentResponse({ isOpen, onOpenChange }: DocumentResponseProps) {
  const [statusResponse, setStatusResponse] = React.useState<"confirmado" | "cancelado">("confirmado");
  const [text, setText] = React.useState("");
  const [correctionModalOpen, setCorrectionModalOpen] = React.useState(false);
  const [cancelConfirm, setCancelConfirm] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);

  const { document, newStatus, newRectificationStatus, newCorrectionStatus } = useDocumentDetailContext();

  const openRectification = document ? getOpenRectification(document.rectifications) : undefined;
  const openCorrection = document ? getOpenCorrection(document.corrections) : undefined;
  const correctionStatus = openCorrection
    ? openCorrection.status[openCorrection.status.length - 1]?.status
    : undefined;

  // Determina se o pedido está aguardando e não há retificação nem correção aberta
  const docStatus = document ? currentDocumentStatus(document.status) : undefined;
  const canRequestCorrection =
    docStatus === "aguardando" &&
    !hasOpenRectification(document?.rectifications ?? []) &&
    !openCorrection;

  const handleSubmit = async () => {
    const response = await newStatus(statusResponse, text);
    if (response) resetState();
  };

  const handleCancelCorrection = async () => {
    if (!openCorrection || cancelling) return;
    setCancelling(true);
    try {
      await newCorrectionStatus(openCorrection.id, "rejeitada", "");
      setCancelConfirm(false);
      onOpenChange(false);
    } finally {
      setCancelling(false);
    }
  };

  const resetState = () => {
    setStatusResponse("confirmado");
    setText("");
    setCancelConfirm(false);
    onOpenChange(false);
  };

  // Título do drawer muda conforme o contexto
  const drawerTitle = openCorrection
    ? correctionStatus === "enviada"
      ? "Avaliar Correção"
      : "Aguardando Correção do Cidadão"
    : openRectification
    ? "Responder Retificação"
    : "Atualizar Status da Solicitação";

  return (
    <>
      <DrawerRoot size="sm" open={isOpen} onOpenChange={resetState}>
        <DrawerContent>

          <DrawerHeader borderBottom="1px solid #F3F4F6" pb={4}>
            <Text fontWeight="700" fontSize="15px" color="#111827">
              {drawerTitle}
            </Text>
          </DrawerHeader>

          <DrawerCloseTrigger />

          <DrawerBody py={5}>
            <Show when={document}>
              {(doc) => (
                <Flex direction="column" gap={5}>

                  {/* ── Ramo 1: Correção enviada pelo cidadão → revisar ── */}
                  {openCorrection && correctionStatus === "enviada" && (
                    <CorrectionReviewResponse
                      correction={openCorrection}
                      detail={doc}
                      onSubmit={(status, comment) =>
                        newCorrectionStatus(openCorrection.id, status, comment)
                      }
                    />
                  )}

                  {/* ── Ramo 2: Correção pendente → aguardando cidadão ── */}
                  {openCorrection && correctionStatus === "pendente" && (
                    <Box border="1px solid #FED7AA" bg="#FFF7ED" borderRadius="12px" p={4}>
                      <Flex align="center" gap={2} mb={3}>
                        <Box w="8px" h="8px" borderRadius="full" bg="#F97316" flexShrink={0} />
                        <Text fontSize="13px" fontWeight="700" color="#9A3412">
                          Correção de Preenchimento Solicitada
                        </Text>
                      </Flex>
                      <Text fontSize="12px" color="#7C2D12" lineHeight={1.6} mb={4}>
                        O cidadão ainda não enviou as correções solicitadas. Aguarde a resposta
                        ou cancele a solicitação de correção abaixo.
                      </Text>

                      {!cancelConfirm ? (
                        <Box
                          role="button"
                          tabIndex={0}
                          onClick={() => setCancelConfirm(true)}
                          onKeyDown={(e) => { if (e.key === "Enter") setCancelConfirm(true); }}
                          textAlign="center"
                          py="9px"
                          bg="white"
                          color="#991B1B"
                          border="2px solid #EF4444"
                          borderRadius="10px"
                          fontWeight="700"
                          fontSize="13px"
                          cursor="pointer"
                          transition="all 0.15s"
                          _hover={{ bg: "#FEE2E2" }}
                        >
                          Cancelar Correção
                        </Box>
                      ) : (
                        <Box>
                          <Text fontSize="12px" color="#991B1B" fontWeight="600" mb={2} textAlign="center">
                            Confirmar cancelamento da correção?
                          </Text>
                          <Flex gap={2}>
                            <Box
                              role="button"
                              tabIndex={0}
                              onClick={() => setCancelConfirm(false)}
                              onKeyDown={(e) => { if (e.key === "Enter") setCancelConfirm(false); }}
                              flex={1}
                              textAlign="center"
                              py="8px"
                              bg="white"
                              color="#374151"
                              border="1px solid #E5E7EB"
                              borderRadius="8px"
                              fontWeight="600"
                              fontSize="12px"
                              cursor="pointer"
                              _hover={{ bg: "#F3F4F6" }}
                            >
                              Manter
                            </Box>
                            <Box
                              role="button"
                              tabIndex={0}
                              onClick={cancelling ? undefined : handleCancelCorrection}
                              onKeyDown={(e) => { if (e.key === "Enter" && !cancelling) handleCancelCorrection(); }}
                              flex={1}
                              textAlign="center"
                              py="8px"
                              bg={cancelling ? "#FECACA" : "#EF4444"}
                              color="white"
                              borderRadius="8px"
                              fontWeight="700"
                              fontSize="12px"
                              cursor={cancelling ? "not-allowed" : "pointer"}
                              _hover={cancelling ? undefined : { bg: "#DC2626" }}
                            >
                              {cancelling ? "Cancelando..." : "Confirmar"}
                            </Box>
                          </Flex>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* ── Ramo 3: Retificação aberta → responder retificação ── */}
                  {!openCorrection && openRectification && (
                    <RectificationResponse
                      rectification={openRectification}
                      onSubmit={(status, comment) =>
                        newRectificationStatus(openRectification.id, status, comment)
                      }
                    />
                  )}

                  {/* ── Ramo 4: Fluxo normal (aprovar/rejeitar) ── */}
                  {!openCorrection && !openRectification && (
                    <>
                      {/* Botão "Solicitar Mudanças" — só quando aguardando e sem bloqueios */}
                      {canRequestCorrection && (
                        <Box
                          role="button"
                          tabIndex={0}
                          onClick={() => setCorrectionModalOpen(true)}
                          onKeyDown={(e) => { if (e.key === "Enter") setCorrectionModalOpen(true); }}
                          textAlign="center"
                          py="9px"
                          bg="white"
                          color="#9A3412"
                          border="2px solid #F97316"
                          borderRadius="10px"
                          fontWeight="700"
                          fontSize="13px"
                          cursor="pointer"
                          transition="all 0.15s"
                          _hover={{ bg: "#FFF7ED" }}
                        >
                          ✎ Solicitar Mudanças
                        </Box>
                      )}

                      {/* Decisão: Aprovar / Rejeitar */}
                      <Box>
                        <Text fontSize="12px" fontWeight="600" color="#374151" mb={2}>
                          Decisão
                        </Text>
                        <Flex gap={3}>
                          <DecisionButton
                            label="✓ Aprovar"
                            active={statusResponse === "confirmado"}
                            color="#166534"
                            activeBg="#DCFCE7"
                            activeBorder="#22C55E"
                            onClick={() => setStatusResponse("confirmado")}
                          />
                          <DecisionButton
                            label="✕ Rejeitar"
                            active={statusResponse === "cancelado"}
                            color="#991B1B"
                            activeBg="#FEE2E2"
                            activeBorder="#EF4444"
                            onClick={() => setStatusResponse("cancelado")}
                          />
                        </Flex>
                      </Box>

                      {/* Respostas automáticas */}
                      <Box>
                        <Text fontSize="12px" fontWeight="600" color="#374151" mb={2}>
                          Respostas Rápidas
                        </Text>
                        <AutomaticResponses status={statusResponse} setValue={setText} />
                      </Box>

                      {/* Texto da resposta */}
                      <Field.Root required>
                        <Field.Label fontSize="12px" fontWeight="600" color="#374151" mb={1}>
                          Justificativa <Field.RequiredIndicator />
                        </Field.Label>
                        <Textarea
                          placeholder="Escreva a justificativa..."
                          value={text}
                          height="200px"
                          onChange={(e) => setText(e.target.value)}
                          bg="#F9FAFB"
                          border="1px solid #E5E7EB"
                          borderRadius="10px"
                          fontSize="13px"
                          _focus={{ borderColor: "#2563EB", boxShadow: "0 0 0 3px rgba(37,99,235,0.12)" }}
                          resize="vertical"
                        />
                        <Field.HelperText fontSize="11px" color="#9CA3AF">
                          Máximo 500 caracteres.
                        </Field.HelperText>
                      </Field.Root>
                    </>
                  )}

                </Flex>
              )}
            </Show>
          </DrawerBody>

          <DrawerFooter borderTop="1px solid #F3F4F6" pt={4}>
            {(openCorrection || openRectification) ? (
              <Box
                role="button"
                tabIndex={0}
                onClick={() => onOpenChange(false)}
                onKeyDown={(e) => { if (e.key === "Enter") onOpenChange(false) }}
                w="full"
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
                Fechar
              </Box>
            ) : (
              <Box
                role="button"
                tabIndex={0}
                onClick={handleSubmit}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }}
                w="full"
                textAlign="center"
                py="11px"
                bg="#2563EB"
                color="white"
                borderRadius="10px"
                fontWeight="700"
                fontSize="14px"
                cursor="pointer"
                transition="all 0.15s"
                _hover={{ bg: "#1D4ED8" }}
                boxShadow="0 2px 8px rgba(37,99,235,0.28)"
              >
                Enviar Resposta
              </Box>
            )}
          </DrawerFooter>

        </DrawerContent>
      </DrawerRoot>

      {/* Modal de solicitação de correção — fora do Drawer para não sobrepor */}
      {document && correctionModalOpen && (
        <CorrectionRequestModal
          open={correctionModalOpen}
          onOpenChange={setCorrectionModalOpen}
          document={document}
        />
      )}
    </>
  );
}
