import { Text, Button, Flex, Box } from "@chakra-ui/react";
import { useToast } from "../hooks/useToast";
import { motion } from "framer-motion";

const MotionFlex = motion(Flex);

interface CardNewRequestProps {
  protocol: string;
  onClose: ()=> void;
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
     <MotionFlex
        direction="column"
        align="center"
        justify="center"
        gap={5}
        p={10}
        bg="white"
        borderRadius="2xl"
        boxShadow="xl"
        textAlign="center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
    >
        <Text fontSize="5xl">🎉</Text>

        <Text fontSize="2xl" fontWeight="bold">
            Solicitação criada com sucesso!
        </Text>

        <Text color="gray.500" maxW="sm">
            Guarde seu número de protocolo para acompanhar o andamento da sua solicitação.
        </Text>

        <Box
            px={8}
            py={4}
            bg="blue.50"
            borderRadius="lg"
            cursor="pointer"
            transition="0.2s"
            _hover={{ bg: "blue.100", transform: "scale(1.02)" }}
            onClick={handleCopy}
        >
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                {protocol}
            </Text>
            <Text fontSize="sm" color="gray.500">
                Clique para copiar
            </Text>
        </Box>

        <Box gap={3} mt={2}>
            <Button
                colorScheme="blue"
                size="lg"
                onClick={onClose}
            >
                Acompanhar minha solicitação
            </Button>

        </Box>
    </MotionFlex>
  );
}