import { Box, Text, Center, SimpleGrid, Container } from "@chakra-ui/react";
import CardMenuItem from "../components/CardMenuItem";
import { MdHealthAndSafety, MdReportProblem } from "react-icons/md";
import { RiChatSearchFill } from "react-icons/ri";

export default function HomePage() {
  return (
    <Box py={10}>
      <Container maxW="6xl">
        <Center mb={12}>
          <Text
            fontSize={["xl", "2xl", "3xl", "4xl"]}
            fontWeight="bold"
            textAlign="center"
          >
            CÓPIA DE BOLETIM DE ATENDIMENTO SAMU
          </Text>
        </Center>

        <SimpleGrid columns={[1, 1, 2, 3]} gap={[4, 6, 8]}>
          <CardMenuItem
            title="SOLICITAR CÓPIA"
            desc="O boletim de atendimento é o documento que contém informações detalhadas sobre a assistência emergencial prestada ao paciente pelo SAMU."
            routePage="/solicitar"
            icon={MdHealthAndSafety}
          />

          <CardMenuItem
            title="ACOMPANHAR SOLICITAÇÃO"
            desc="Já solicitou a cópia do boletim? Acompanhe aqui o andamento do seu pedido."
            routePage="/acompanhar"
            icon={RiChatSearchFill}
          />

          <CardMenuItem
            title="RELATAR PROBLEMA NO SISTEMA"
            desc="Se algo não funcionou como deveria, conte pra gente. Sua ajuda é importante para melhorarmos o sistema."
            routePage="https://chamadosti.cisbaf.org.br/"
            isExternal
            icon={MdReportProblem}
          />
        </SimpleGrid>
      </Container>
    </Box>
  );
}
