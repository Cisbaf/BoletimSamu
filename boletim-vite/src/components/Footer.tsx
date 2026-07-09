import { Box, Flex, Text, Image, SimpleGrid, Separator, chakra } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { MdHealthAndSafety } from "react-icons/md";
import logo from "../assets/cisbaf-samu.png";

export default function Footer() {
  return (
    <Box as="footer" bg="#111827" color="#D1D5DB" mt={16}>
      <Box maxW="1100px" mx="auto" px={[5, 6, 8]} py={10}>
        <SimpleGrid columns={[1, 1, 3]} gap={8}>
          <Box>
            <Flex align="center" gap={3} mb={3}>
              <Image
                src={logo}
                alt="SAMU 192"
                boxSize="40px"
                borderRadius="full"
                bg="white"
                p="2px"
              />
              <Box>
                <Text color="white" fontWeight="800" fontSize="14px" lineHeight={1.2}>
                  CISBAF · SAMU 192
                </Text>
                <Text fontSize="11px" color="#9CA3AF">
                  Consórcio Intermunicipal de Saúde
                </Text>
              </Box>
            </Flex>
            <Text fontSize="12.5px" lineHeight={1.7} color="#9CA3AF">
              Portal oficial para solicitação de cópia de boletins de ocorrência
              do Serviço de Atendimento Móvel de Urgência.
            </Text>
          </Box>

          <Box>
            <Text color="white" fontWeight="700" fontSize="13px" mb={3}>
              Serviços
            </Text>
            <Flex direction="column" gap={2}>
              <Link to="/solicitar">
                <Text fontSize="12.5px" _hover={{ color: "white" }} transition="color 0.15s">
                  Solicitar cópia do boletim
                </Text>
              </Link>
              <Link to="/acompanhar">
                <Text fontSize="12.5px" _hover={{ color: "white" }} transition="color 0.15s">
                  Acompanhar / retificar solicitação
                </Text>
              </Link>
              <chakra.a
                href="https://chamadosti.cisbaf.org.br/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Text fontSize="12.5px" _hover={{ color: "white" }} transition="color 0.15s">
                  Relatar problema técnico
                </Text>
              </chakra.a>
            </Flex>
          </Box>

          <Box>
            <Text color="white" fontWeight="700" fontSize="13px" mb={3}>
              Serviço gratuito e público
            </Text>
            <Flex align="start" gap={2} fontSize="12.5px" lineHeight={1.7} color="#9CA3AF">
              <MdHealthAndSafety size={16} style={{ marginTop: "2px", flexShrink: 0 }} />
              <Text>
                Este atendimento é 100% gratuito, parte do protocolo do SUS.
                Nenhum valor é cobrado em nenhuma etapa do processo.
              </Text>
            </Flex>
          </Box>
        </SimpleGrid>

        <Separator my={6} borderColor="#1F2937" />

        <Flex
          direction={["column", "row"]}
          justify="space-between"
          align={["start", "center"]}
          gap={2}
        >
          <Text fontSize="11.5px" color="#6B7280">
            © {new Date().getFullYear()} CISBAF — Todos os direitos reservados.
          </Text>
          <Text fontSize="11.5px" color="#6B7280">
            Em caso de emergência, disque 192.
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
