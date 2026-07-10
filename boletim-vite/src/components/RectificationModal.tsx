import React from "react";
import { Box, Dialog, Flex, Input, Portal, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { usePost } from "../hooks/usePost";
import { useToast } from "../hooks/useToast";
import { parseDjangoError } from "../helpers/parseErrors";
import { isValidCPF } from "../domain/valid";
import { ApiBaseUrl } from "../settings";

const MotionBox = motion(Box);

interface RectificationModalProps {
  /** Protocolo do pedido já confirmado que será retificado. */
  protocol: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Disparado quando a retificação é aberta com sucesso (ex.: refetch). */
  onSuccess?: () => void;
}

// ─── RectificationModal ────────────────────────────────────────────────────────
//
// Modal exibido a partir do botão "Solicitar Retificação" na página
// Acompanhar / Retificar. Explica o que é uma retificação e pede o CPF do
// solicitante para confirmar a identidade antes de abrir o protocolo.

export default function RectificationModal({
  protocol,
  open,
  onOpenChange,
  onSuccess,
}: RectificationModalProps) {
  const [cpf, setCpf] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const [confirmed, setConfirmed] = React.useState(false);
  const { error: showErrorToast } = useToast();

  const { post, loading } = usePost({
    url: `${ApiBaseUrl}/document/rectifications/create/`,
    onSuccess: () => {
      setConfirmed(true);
      onSuccess?.();
    },
    onError: (err) => {
      const message = parseDjangoError(err);
      setFieldError(message);
      showErrorToast({ title: "Não foi possível confirmar", description: message });
    },
  });

  function reset() {
    setCpf("");
    setReason("");
    setFieldError(null);
    setConfirmed(false);
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function handleConfirm() {
    const digits = cpf.replace(/\D/g, "");

    if (!isValidCPF(digits)) {
      setFieldError("Informe um CPF válido.");
      return;
    }

    if (!reason.trim()) {
      setFieldError("Descreva o motivo da retificação.");
      return;
    }

    setFieldError(null);
    post({ protocol, cpf: digits, reason: reason.trim() });
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => (e.open ? onOpenChange(true) : handleClose())}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxW={{ base: "92%", md: "440px" }}
            w="full"
            borderRadius="2xl"
            overflow="hidden"
            p={0}
          >
            {confirmed ? (
              <SuccessState onClose={handleClose} />
            ) : (
              <RequestState
                cpf={cpf}
                setCpf={setCpf}
                reason={reason}
                setReason={setReason}
                fieldError={fieldError}
                loading={loading}
                onConfirm={handleConfirm}
                onCancel={handleClose}
              />
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ─── Estado: explicação + confirmação de CPF ──────────────────────────────────

interface RequestStateProps {
  cpf: string;
  setCpf: (value: string) => void;
  reason: string;
  setReason: (value: string) => void;
  fieldError: string | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function RequestState({ cpf, setCpf, reason, setReason, fieldError, loading, onConfirm, onCancel }: RequestStateProps) {
  return (
    <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box px={6} pt={6} pb={5} borderBottom="1px solid #F3F4F6">
        <Flex align="center" gap={3} mb={1}>
          <Box
            w="32px"
            h="32px"
            bg="#F3E8FF"
            borderRadius="8px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
                stroke="#A855F7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </Box>
          <Text fontSize="16px" fontWeight="800" color="#111827" letterSpacing="-0.3px">
            Solicitar Retificação
          </Text>
        </Flex>
      </Box>

      <Box px={6} py={5}>
        <Text fontSize="13px" color="#4B5563" lineHeight={1.7} mb={5}>
          Se ao retirar o documento presencialmente você identificou alguma
          informação incorreta, abra aqui um protocolo de retificação. Ele
          entrará na linha do tempo desta solicitação e será agendado pela
          equipe da CISBAF.
        </Text>

        <Text fontSize="12px" fontWeight="600" color="#374151" mb={2}>
          Por que deseja retificar este documento?
        </Text>

        <textarea
          placeholder="Descreva brevemente o erro identificado..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "10px 12px",
            border: "1px solid #E5E7EB",
            borderRadius: "12px",
            fontSize: "14px",
            fontFamily: "inherit",
            resize: "vertical",
            boxSizing: "border-box",
            backgroundColor: "#F9FAFB",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#A855F7";
            e.currentTarget.style.backgroundColor = "white";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(168,85,247,0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#E5E7EB";
            e.currentTarget.style.backgroundColor = "#F9FAFB";
            e.currentTarget.style.boxShadow = "none";
          }}
        />

        <Text fontSize="12px" fontWeight="600" color="#374151" mb={2} mt={4}>
          Confirme seu CPF para continuar
        </Text>

        <Input
          placeholder="000.000.000-00"
          inputMode="numeric"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onConfirm(); }}
          h="44px"
          bg="#F9FAFB"
          border="1px solid #E5E7EB"
          borderRadius="12px"
          fontSize="14px"
          fontFamily="mono"
          _focus={{ borderColor: "#A855F7", bg: "white", boxShadow: "0 0 0 3px rgba(168,85,247,0.12)" }}
        />

        {fieldError && (
          <Text fontSize="12px" color="#DC2626" mt={2} fontWeight="600">
            {fieldError}
          </Text>
        )}

        <Text fontSize="11px" color="#9CA3AF" mt={2}>
          Precisa ser o mesmo CPF cadastrado como solicitante deste pedido.
        </Text>
      </Box>

      <Flex px={6} pb={6} gap={3}>
        <Box
          role="button"
          tabIndex={0}
          onClick={onCancel}
          onKeyDown={(e) => { if (e.key === "Enter") onCancel(); }}
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
          onClick={loading ? undefined : onConfirm}
          onKeyDown={(e) => { if (e.key === "Enter" && !loading) onConfirm(); }}
          flex={1}
          textAlign="center"
          py="11px"
          bg={loading ? "#C4B5FD" : "#A855F7"}
          color="white"
          borderRadius="12px"
          fontWeight="700"
          fontSize="14px"
          cursor={loading ? "not-allowed" : "pointer"}
          transition="all 0.15s"
          _hover={loading ? undefined : { bg: "#9333EA" }}
        >
          {loading ? "Confirmando..." : "Confirmar"}
        </Box>
      </Flex>
    </MotionBox>
  );
}

// ─── Estado: confirmação de sucesso ───────────────────────────────────────────

function SuccessState({ onClose }: { onClose: () => void }) {
  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Box h="4px" bg="linear-gradient(90deg, #A855F7, #7C3AED)" />

      <Flex direction="column" align="center" textAlign="center" px={8} py={10} gap={5}>
        <Box
          w="60px"
          h="60px"
          bg="#F3E8FF"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="26px"
        >
          ✓
        </Box>

        <Box>
          <Text fontSize="17px" fontWeight="800" color="#111827" letterSpacing="-0.3px" mb={2}>
            Retificação solicitada!
          </Text>
          <Text fontSize="13px" color="#6B7280" maxW="300px">
            Identidade confirmada. A retificação foi registrada e já aparece
            na linha do tempo desta solicitação — nossa equipe entrará em
            contato para agendar o atendimento.
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
          bg="#A855F7"
          color="white"
          borderRadius="12px"
          fontWeight="700"
          fontSize="14px"
          transition="all 0.15s"
          _hover={{ bg: "#9333EA" }}
        >
          Ver na linha do tempo
        </Box>
      </Flex>
    </MotionBox>
  );
}
