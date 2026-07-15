import { Box, Text, SimpleGrid, Flex, Heading, Image, chakra } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import CardMenuItem from "../components/CardMenuItem";
import {
  MdHealthAndSafety,
  MdReportProblem,
  MdVerifiedUser,
  MdBolt,
  MdOutlineLock,
  MdOutlineDescription,
} from "react-icons/md";
import { RiChatSearchFill } from "react-icons/ri";
import heroImage from "../assets/samu-hero.jpg";
import ambulanceImage from "../assets/samu-ambulancia.jpg";

const RouterLink = chakra(Link);

const TRUST_ITEMS = [
  { icon: MdBolt, label: "Solicitação Online" },
  { icon: MdOutlineLock, label: "Dados Protegidos (LGPD)" },
  { icon: MdOutlineDescription, label: "Documento Oficial" },
];

const STEPS = [
  {
    n: "1",
    title: "Preencha o formulário",
    desc: "Informe os dados do atendimento e do solicitante em um formulário simples e rápido, direto pelo site.",
  },
  {
    n: "2",
    title: "Aguarde a análise",
    desc: "Nossa equipe verifica os dados e prepara o documento solicitado. Acompanhe o status pelo protocolo.",
  },
  {
    n: "3",
    title: "Retire o documento",
    desc: "Quando estiver pronto, retire a cópia pessoalmente na unidade, mediante assinatura do recibo de entrega.",
  },
];

export default function HomePage() {
  return (
    <Box>
      {/* HERO */}
      <Box
        position="relative"
        w="100%"
        minH={["560px", "600px", "660px"]}
        overflow="hidden"
        display="flex"
        alignItems="center"
      >
        <Box
          position="absolute"
          inset={0}
          bgImage={`url(${heroImage})`}
          bgSize="cover"
          bgPos="center 65%"
          bgRepeat="no-repeat"
          transform="scale(1.02)"
        />
        <Box
          position="absolute"
          inset={0}
          bgGradient="to-b"
          gradientFrom="rgba(17,24,39,0.85)"
          gradientVia="rgba(17,24,39,0.65)"
          gradientTo="rgba(17,24,39,0.75)"
        />

        <Box position="relative" maxW="1100px" w="100%" mx="auto" px={[5, 6, 8]} py={[16, 16, 20]}>
          <Flex
            align="center"
            gap={2}
            bg="rgba(255,255,255,0.12)"
            border="1px solid rgba(255,255,255,0.25)"
            backdropFilter="blur(6px)"
            borderRadius="full"
            w="fit-content"
            px={4}
            py="6px"
            mb={5}
          >
            <MdVerifiedUser color="#F7941D" size={16} />
            <Text fontSize="12.5px" fontWeight="600" color="white" letterSpacing="0.3px">
              Serviço público CISBAF
            </Text>
          </Flex>

          <Heading
            as="h1"
            fontSize={["30px", "40px", "48px"]}
            fontWeight="800"
            color="white"
            lineHeight={1.15}
            letterSpacing="-0.8px"
            maxW="680px"
            mb={4}
          >
            Precisa da cópia do boletim do seu atendimento SAMU 192?
          </Heading>

          <Text fontSize={["15px", "16.5px"]} color="rgba(255,255,255,0.85)" maxW="560px" mb={8} lineHeight={1.7}>
            Solicite online, gratuitamente, a cópia do boletim de ocorrência
            registrado durante um atendimento de urgência do SAMU. A retirada é feita pessoalmente, mediante
            assinatura de recibo.
          </Text>

          <Flex gap={4} flexWrap="wrap" mb={10}>
            <RouterLink to="/solicitar">
              <Flex
                align="center"
                justify="center"
                bg="#2563EB"
                color="white"
                fontWeight="700"
                fontSize="15px"
                borderRadius="10px"
                h="50px"
                px={7}
                boxShadow="0 4px 16px rgba(37,99,235,0.4)"
                _hover={{ bg: "#1D4ED8" }}
                transition="background 0.15s"
              >
                Solicitar Cópia do Boletim
              </Flex>
            </RouterLink>

            <RouterLink to="/acompanhar">
              <Flex
                align="center"
                justify="center"
                bg="rgba(255,255,255,0.08)"
                color="white"
                fontWeight="700"
                fontSize="15px"
                borderRadius="10px"
                h="50px"
                px={7}
                border="1.5px solid rgba(255,255,255,0.5)"
                _hover={{ bg: "rgba(255,255,255,0.18)" }}
                transition="background 0.15s"
              >
                Acompanhar Solicitação
              </Flex>
            </RouterLink>
          </Flex>

          <SimpleGrid columns={[2, 2, 4]} gap={[4, 6]}>
            {TRUST_ITEMS.map((item) => (
              <Flex key={item.label} align="center" gap={2}>
                <Flex
                  boxSize="32px"
                  borderRadius="full"
                  bg="rgba(255,255,255,0.12)"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <item.icon color="#F7941D" size={16} />
                </Flex>
                <Text fontSize="12.5px" fontWeight="600" color="white">
                  {item.label}
                </Text>
              </Flex>
            ))}
          </SimpleGrid>
        </Box>
      </Box>

      {/* COMO FUNCIONA */}
      <Box maxW="1100px" mx="auto" px={[5, 6, 8]} py={[12, 14, 16]}>
        <Text fontSize="13px" fontWeight="700" color="samuRed.500" letterSpacing="0.5px" mb={2}>
          COMO FUNCIONA
        </Text>
        <Heading as="h2" fontSize={["22px", "26px"]} fontWeight="800" color="#111827" letterSpacing="-0.5px" mb={10}>
          Do pedido à retirada, em três passos simples
        </Heading>

        <SimpleGrid columns={[1, 1, 3]} gap={8}>
          {STEPS.map((step) => (
            <Box key={step.n}>
              <Flex
                boxSize="44px"
                borderRadius="full"
                bg="samuRed.50"
                color="samuRed.500"
                align="center"
                justify="center"
                fontWeight="800"
                fontSize="17px"
                mb={4}
              >
                {step.n}
              </Flex>
              <Text fontWeight="700" fontSize="16px" color="#111827" mb={2}>
                {step.title}
              </Text>
              <Text fontSize="13.5px" color="#6B7280" lineHeight={1.7}>
                {step.desc}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      {/* SERVIÇOS */}
      <Box bg="white" borderTop="1px solid #E5E7EB" borderBottom="1px solid #E5E7EB">
        <Box maxW="1100px" mx="auto" px={[5, 6, 8]} py={[12, 14, 16]}>
          <Text fontSize="13px" fontWeight="700" color="samuRed.500" letterSpacing="0.5px" mb={2}>
            O QUE VOCÊ PRECISA?
          </Text>
          <Heading as="h2" fontSize={["22px", "26px"]} fontWeight="800" color="#111827" letterSpacing="-0.5px" mb={10}>
            Escolha uma das opções abaixo
          </Heading>

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
      </Box>

      {/* SOBRE O SAMU */}
      <Box maxW="1100px" mx="auto" px={[5, 6, 8]} py={[12, 14, 16]}>
        <SimpleGrid columns={[1, 1, 2]} gap={[8, 10, 14]} alignItems="center">
          <Box
            borderRadius="20px"
            overflow="hidden"
            boxShadow="0 8px 30px rgba(0,0,0,0.12)"
            h={["220px", "300px", "360px"]}
          >
            <Image
              src={ambulanceImage}
              alt="Ambulância do SAMU 192"
              w="100%"
              h="100%"
              objectFit="cover"
            />
          </Box>

          <Box>
            <Text fontSize="13px" fontWeight="700" color="samuRed.500" letterSpacing="0.5px" mb={2}>
              SOBRE O SAMU 192
            </Text>
            <Heading as="h2" fontSize={["22px", "26px"]} fontWeight="800" color="#111827" letterSpacing="-0.5px" mb={4}>
              Atendimento móvel de urgência, gratuito e disponível 24h
            </Heading>
            <Text fontSize="14.5px" color="#6B7280" lineHeight={1.8} mb={4}>
              O SAMU 192 é o Serviço de Atendimento Móvel de Urgência do SUS,
              disponível gratuitamente 24 horas por dia para socorrer vítimas
              de acidentes, mal súbito ou outras urgências. Após cada
              atendimento, é emitido um boletim de ocorrência com os detalhes
              do socorro prestado.
            </Text>
            <Text fontSize="14.5px" color="#6B7280" lineHeight={1.8} mb={6}>
              Este portal permite solicitar a <strong>cópia desse boletim</strong>,
              já emitido, para fins de seguro, perícia, processos administrativos
              ou registro pessoal — de forma simples, gratuita e segura.
            </Text>

            <Flex
              align="start"
              gap={3}
              bg="samuRed.50"
              border="1px solid"
              borderColor="#FBD5D5"
              borderRadius="12px"
              p={4}
            >
              <MdReportProblem color="#D2232A" size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
              <Text fontSize="13px" color="samuRed.700" lineHeight={1.6}>
                <strong>Este canal não é para emergências.</strong> Em caso de
                urgência médica, ligue imediatamente para <strong>192</strong>.
              </Text>
            </Flex>
          </Box>
        </SimpleGrid>
      </Box>
    </Box>
  );
}
