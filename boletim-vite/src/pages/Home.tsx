import { Box, Text, SimpleGrid } from "@chakra-ui/react";
import CardMenuItem from "../components/CardMenuItem";
import { MdHealthAndSafety, MdReportProblem } from "react-icons/md";
import { RiChatSearchFill } from "react-icons/ri";

export default function HomePage() {
  return (
    <Box maxW="900px" mx="auto">

      {/* Header */}
      <Box mb={10}>
        <Text
          fontSize={["20px", "24px", "28px"]}
          fontWeight="800"
          color="#111827"
          letterSpacing="-0.6px"
          mb={2}
        >
          Solicitação de Cópia de Boletim
        </Text>
        <Text fontSize="14px" color="#6B7280">
          SAMU 192 · Serviço de Atendimento Móvel de Urgência — CISBAF
        </Text>
      </Box>

      <SimpleGrid columns={[1, 1, 3]} gap={5}>
        <CardMenuItem
          title="Solicitar Cópia"
          desc="Solicite a cópia do boletim de atendimento de emergência prestado pelo SAMU."
          routePage="/solicitar"
          icon={MdHealthAndSafety}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
        />

        <CardMenuItem
          title="Acompanhar Solicitação"
          desc="Já enviou sua solicitação? Acompanhe o status e prazo do seu pedido aqui."
          routePage="/acompanhar"
          icon={RiChatSearchFill}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
        />

        <CardMenuItem
          title="Relatar Problema"
          desc="Encontrou algum erro ou dificuldade? Fale com a equipe de TI do CISBAF."
          routePage="https://chamadosti.cisbaf.org.br/"
          isExternal
          icon={MdReportProblem}
          iconBg="#FEF2F2"
          iconColor="#DC2626"
        />
      </SimpleGrid>
    </Box>
  );
}
