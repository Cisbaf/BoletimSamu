import {
  Flex,
  Text,
  Box,
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
        py={0}
        h="56px"
        align="center"
        justify="space-between"
        bg="white"
        borderBottom="1px solid"
        borderColor="#E5E7EB"
        position="sticky"
        top="0"
        zIndex="1000"
        boxShadow="0 1px 3px rgba(0,0,0,0.06)"
      >
        {/* LOGO */}
        <Link to="/">
          <Flex align="center" gap={2}>
            <Box
              w="28px"
              h="28px"
              bg="#DC2626"
              borderRadius="6px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Text color="white" fontWeight="800" fontSize="13px" lineHeight={1}>
                S
              </Text>
            </Box>
            <Box>
              <Text fontWeight="700" fontSize="14px" color="#111827" lineHeight={1.1}>
                SAMU 192
              </Text>
              <Text fontSize="9px" color="#9CA3AF" letterSpacing="0.3px">
                CISBAF · Sistema de Solicitações
              </Text>
            </Box>
          </Flex>
        </Link>

        {/* MENU DESKTOP */}
        <Flex gap={6} align="center" display={{ base: "none", md: "flex" }}>
          {MENU.map((item) => (
            <Link key={item.path} to={item.path}>
              <Text
                fontWeight="500"
                fontSize="14px"
                color="#6B7280"
                _hover={{ color: "#2563EB" }}
                transition="color 0.15s"
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
                  <Button
                    size="sm"
                    bg="#2563EB"
                    color="white"
                    borderRadius="8px"
                    fontWeight="600"
                    fontSize="13px"
                    h="32px"
                    px={4}
                    boxShadow="0 1px 4px rgba(37,99,235,0.25)"
                    _hover={{ bg: "#1D4ED8" }}
                  >
                    Painel Administrativo
                  </Button>
                </Link>
              ) : (
                <Menu.Root>
                  <Menu.Trigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      borderRadius="8px"
                      border="1.5px solid #E5E7EB"
                      color="#374151"
                      fontWeight="600"
                      fontSize="13px"
                      h="32px"
                      display="flex"
                      alignItems="center"
                      gap={2}
                      _hover={{ borderColor: "#2563EB", color: "#2563EB" }}
                    >
                      <FiUser />
                      Conta
                    </Button>
                  </Menu.Trigger>

                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content
                        borderRadius="10px"
                        boxShadow="0 4px 20px rgba(0,0,0,0.12)"
                        border="1px solid #E5E7EB"
                      >
                        <Menu.Item value="painel" asChild>
                          <Link to="/painel">Painel</Link>
                        </Menu.Item>
                        <Menu.Item value="logout" onClick={logout} color="red.500">
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
            color="#6B7280"
            _hover={{ bg: "#F3F4F6" }}
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
                  <Text fontWeight="700" fontSize="15px" color="#111827">
                    Menu
                  </Text>
                  <CloseButton onClick={() => setOpen(false)} />
                </Flex>
              </Drawer.Header>

              <Drawer.Body>
                <VStack align="start" gap={5}>
                  {MENU.map((item) => (
                    <Link key={item.path} to={item.path} onClick={() => setOpen(false)}>
                      <Text fontSize="15px" fontWeight="500" color="#374151">
                        {item.label}
                      </Text>
                    </Link>
                  ))}

                  <Link to="/painel" onClick={() => setOpen(false)}>
                    <Text fontSize="15px" fontWeight="700" color="#2563EB">
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
