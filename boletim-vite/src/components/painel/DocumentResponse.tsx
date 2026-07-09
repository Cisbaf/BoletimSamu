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
import { useDocumentDetailContext } from "../../context/DocumentDetail";
import { getOpenRectification } from "../../utils/timeline";

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
  const { document, newStatus, newRectificationStatus } = useDocumentDetailContext();

  const openRectification = document ? getOpenRectification(document.rectifications) : undefined;

  const handleSubmit = async () => {
    const response = await newStatus(statusResponse, text);
    if (response) resetState();
  };

  const resetState = () => {
    setStatusResponse("confirmado");
    setText("");
    onOpenChange(false);
  };

  return (
    <DrawerRoot size="sm" open={isOpen} onOpenChange={resetState}>
      <DrawerContent>

        <DrawerHeader borderBottom="1px solid #F3F4F6" pb={4}>
          <Text fontWeight="700" fontSize="15px" color="#111827">
            {openRectification ? "Responder Retificação" : "Atualizar Status da Solicitação"}
          </Text>
        </DrawerHeader>

        <DrawerCloseTrigger />

        <DrawerBody py={5}>
          <Show when={document}>
            {() => (
              <Flex direction="column" gap={5}>

                {openRectification ? (
                  /* Enquanto houver uma retificação em aberto, só ela pode ser
                     respondida — o pedido em si já está confirmado. */
                  <RectificationResponse
                    rectification={openRectification}
                    onSubmit={(status, comment) =>
                      newRectificationStatus(openRectification.id, status, comment)
                    }
                  />
                ) : (
                  <>
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
          {openRectification ? (
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
  );
}
