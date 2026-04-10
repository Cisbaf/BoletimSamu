import { chakra } from "@chakra-ui/react"
import { Button, Card, Text, Flex, Icon } from "@chakra-ui/react";
import type { IconType } from "react-icons";
import { NavLink } from "react-router-dom"

interface CardMenuItemProps {
  title: string;
  desc: string;
  routePage: string;
  icon: IconType;
  isExternal?: boolean; // 👈 novo
}

const RouterLink = chakra(NavLink)
const ExternalLink = chakra("a")

export default function CardMenuItem({
  title,
  desc,
  routePage,
  icon,
  isExternal = false,
}: CardMenuItemProps) {
  return (
    <Card.Root
      h="100%"
      bg="white"
      borderRadius="2xl"
      boxShadow="lg"
      transition="all 0.2s"
      _hover={{
        transform: "translateY(-6px)",
        boxShadow: "2xl",
      }}
    >
      <Card.Body>
        <Flex direction="column" align="center" textAlign="center" h="100%">
          
          {/* ÍCONE */}
          <Flex
            bg="gray.100"
            borderRadius="full"
            boxSize="90px"
            align="center"
            justify="center"
            mb={6}
          >
            <Icon as={icon} boxSize={12} color="gray.700" />
          </Flex>

          {/* TÍTULO */}
          <Text fontWeight="bold" fontSize="lg" mb={3}>
            {title}
          </Text>

          {/* DESCRIÇÃO */}
          <Text fontSize="sm" color="gray.600">
            {desc}
          </Text>

          <br />

          {/* BOTÃO */}
          {isExternal ? (
            <ExternalLink
              mt="auto"
              w="full"
              href={routePage}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                w="full"
                colorScheme="blackAlpha"
                size="md"
                borderRadius="lg"
              >
                ACESSAR
              </Button>
            </ExternalLink>
          ) : (
            <RouterLink mt="auto" w="full" to={routePage}>
              <Button
                w="full"
                colorScheme="blackAlpha"
                size="md"
                borderRadius="lg"
              >
                ACESSAR
              </Button>
            </RouterLink>
          )}
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}