import {
  Flex,
  Text,
  IconButton,
  VStack,
  Drawer,
  Portal,
  CloseButton,
  Menu,
  Button,
} from "@chakra-ui/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiUser } from "react-icons/fi";

import { MENU } from "../helpers/menu";
import { useAuth } from "../context/AuthContext";

export default function AppBar() {
  const [open, setOpen] = useState(false);
  const { token, loading, logout } = useAuth();


  return (
    <>
      <Flex
        as="header"
        w="100%"
        px={6}
        py={4}
        align="center"
        justify="space-between"
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        position="sticky"
        top="0"
        zIndex="1000"
      >
        {/* LOGO */}
        <Link to="/">
          <Text fontWeight="bold" fontSize="lg">
            CISBAF
          </Text>
        </Link>

        {/* MENU DESKTOP */}
        <Flex
          gap={8}
          align="center"
          display={{ base: "none", md: "flex" }}
        >
          {MENU.map((item) => (
            <Link key={item.path} to={item.path}>
              <Text
                fontWeight="medium"
                color="gray.600"
                _hover={{ color: "blue.600" }}
                transition="0.2s"
              >
                {item.label}
              </Text>
            </Link>
          ))}
        </Flex>

        {/* DIREITA */}
    
        <Flex align="center" gap={3}>
        {!loading && (
            <>
            {!token ? (
                <Link to="/painel">
                <Button size="sm" colorPalette="blue" variant="solid">
                    Painel Administrativo
                </Button>
                </Link>
            ) : (
                <Menu.Root>
                <Menu.Trigger asChild>
                    <Button
                    size="sm"
                    variant="outline"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    >
                    <FiUser />
                    Conta
                    </Button>
                </Menu.Trigger>

                <Portal>
                    <Menu.Positioner>
                    <Menu.Content>
                        <Menu.Item value="painel" asChild>
                        <Link to="/painel">Painel</Link>
                        </Menu.Item>

                        <Menu.Item
                        value="logout"
                        onClick={logout}
                        color="red.500"
                        >
                        Sair
                        </Menu.Item>
                    </Menu.Content>
                    </Menu.Positioner>
                </Portal>
                </Menu.Root>
            )}
            </>
        )}

            {/* MOBILE BUTTON */}
            <IconButton
                aria-label="Abrir menu"
                variant="ghost"
                display={{ base: "flex", md: "none" }}
                onClick={() => setOpen(true)}
            >
                <FiMenu />
            </IconButton>
        </Flex>

      </Flex>

      {/* DRAWER MOBILE */}
      <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.Header>
                <Flex justify="space-between" align="center">
                  <Text fontWeight="bold">Menu</Text>
                  <CloseButton onClick={() => setOpen(false)} />
                </Flex>
              </Drawer.Header>

              <Drawer.Body>
                <VStack align="start" gap={5}>
                  {MENU.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setOpen(false)}
                    >
                      <Text fontSize="lg">{item.label}</Text>
                    </Link>
                  ))}

                  <Link to="/painel" onClick={() => setOpen(false)}>
                    <Text
                      fontSize="lg"
                      fontWeight="semibold"
                      color="blue.600"
                    >
                      Painel Administrativo
                    </Text>
                  </Link>
                </VStack>
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  );
}