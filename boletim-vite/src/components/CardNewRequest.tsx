import { Text, Flex, Box } from "@chakra-ui/react";
import { useToast } from "../hooks/useToast";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

interface CardNewRequestProps {
  protocol: string;
  onClose: () => void;
}

export default function CardNewRequest({ protocol, onClose }: CardNewRequestProps) {
  const toast = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(protocol);
      toast.info({
        title: "Protocolo copiado!",
        description: "O número foi copiado para a área de transferência.",
        duration: 2000,
      });
    } catch {
      toast.info({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o protocolo.",
        duration: 2000,
      });
    }
  };

  return (
    <MotionBox
      bg="white"
      borderRadius="2xl"
      boxShadow="0 1px 3px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.10)"
      overflow="hidden"
      maxW="480px"
      w="full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Flex direction="column" align="center" textAlign="center" px={8} py={10} gap={6}>
        {/* Ícone de sucesso */}
        <Box
          w="64px"
          h="64px"
          bg="#DCFCE7"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="28px"
        >
          ✓
        </Box>

        {/* Título */}
        <Box>
          <Text fontSize="20px" fontWeight="800" color="#111827" letterSpacing="-0.3px" mb={2}>
            Solicitação criada com sucesso!
          </Text>
          <Text fontSize="13px" color="#6B7280" maxW="320px">
            Guarde seu protocolo para acompanhar o andamento da solicitação.
          </Text>
        </Box>

        {/* Pill do protocolo */}
        <Box
          role="button"
          tabIndex={0}
          onClick={handleCopy}
          onKeyDown={(e) => { if (e.key === "Enter") handleCopy(); }}
          cursor="pointer"
          px={8}
          py={4}
          bg="#EFF6FF"
          border="2px solid #BFDBFE"
          borderRadius="14px"
          transition="all 0.15s"
          _hover={{ bg: "#DBEAFE", borderColor: "#93C5FD", transform: "scale(1.02)" }}
        >
          <Text
            fontSize="22px"
            fontWeight="800"
            color="#1D4ED8"
            letterSpacing="2px"
            fontFamily="mono"
          >
            {protocol}
          </Text>
          <Text fontSize="11px" color="#60A5FA" mt={1} fontWeight="500">
            Clique para copiar
          </Text>
        </Box>

        {/* Botão de acompanhar */}
        <Box
          role="button"
          tabIndex={0}
          onClick={onClose}
          onKeyDown={(e) => { if (e.key === "Enter") onClose(); }}
          cursor="pointer"
          w="full"
          textAlign="center"
          py="13px"
          bg="#2563EB"
          color="white"
          borderRadius="12px"
          fontWeight="700"
          fontSize="14px"
          transition="all 0.15s"
          _hover={{ bg: "#1D4ED8" }}
          boxShadow="0 2px 8px rgba(37,99,235,0.28)"
        >
          Acompanhar minha solicitação →
        </Box>
      </Flex>
    </MotionBox>
  );
}
