import { chakra } from "@chakra-ui/react"
import { Box, Button, Text, Flex, Icon } from "@chakra-ui/react";
import type { IconType } from "react-icons";
import { NavLink } from "react-router-dom"

interface CardMenuItemProps {
  title: string;
  desc: string;
  routePage: string;
  icon: IconType;
  isExternal?: boolean;
  iconBg?: string;
  iconColor?: string;
}

const RouterLink = chakra(NavLink)
const ExternalLink = chakra("a")

export default function CardMenuItem({
  title,
  desc,
  routePage,
  icon,
  isExternal = false,
  iconBg = "#EFF6FF",
  iconColor = "#2563EB",
}: CardMenuItemProps) {
  return (
    <Box
      bg="white"
      borderRadius="2xl"
      boxShadow="0 1px 4px rgba(0,0,0,.06), 0 4px 20px rgba(0,0,0,.08)"
      border="1px solid"
      borderColor="#F3F4F6"
      p={6}
      display="flex"
      flexDirection="column"
      h="100%"
      transition="all 0.2s"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "0 4px 12px rgba(0,0,0,.08), 0 12px 40px rgba(0,0,0,.12)",
        borderColor: "#E0E7FF",
      }}
    >
      {/* ÍCONE */}
      <Flex
        bg={iconBg}
        borderRadius="14px"
        boxSize="56px"
        align="center"
        justify="center"
        mb={4}
        flexShrink={0}
      >
        <Icon as={icon} boxSize={7} color={iconColor} />
      </Flex>

      {/* TÍTULO */}
      <Text fontWeight="700" fontSize="15px" color="#111827" mb={2} letterSpacing="-0.2px">
        {title}
      </Text>

      {/* DESCRIÇÃO */}
      <Text fontSize="13px" color="#6B7280" lineHeight={1.65} flex={1}>
        {desc}
      </Text>

      {/* BOTÃO */}
      {isExternal ? (
        <ExternalLink
          mt={5}
          w="full"
          href={routePage}
          target="_blank"
          rel="noopener noreferrer"
          display="block"
        >
          <Button
            w="full"
            bg="#2563EB"
            color="white"
            borderRadius="10px"
            fontWeight="600"
            fontSize="13px"
            h="38px"
            boxShadow="0 2px 8px rgba(37,99,235,0.22)"
            _hover={{ bg: "#1D4ED8" }}
          >
            Acessar
          </Button>
        </ExternalLink>
      ) : (
        <RouterLink mt={5} w="full" to={routePage} display="block">
          <Button
            w="full"
            bg="#2563EB"
            color="white"
            borderRadius="10px"
            fontWeight="600"
            fontSize="13px"
            h="38px"
            boxShadow="0 2px 8px rgba(37,99,235,0.22)"
            _hover={{ bg: "#1D4ED8" }}
          >
            Acessar
          </Button>
        </RouterLink>
      )}
    </Box>
  );
}
