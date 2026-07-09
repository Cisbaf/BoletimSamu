import { Box, Flex } from "@chakra-ui/react";
import AppBar from "./AppBar";
import EmergencyBanner from "./EmergencyBanner";
import Footer from "./Footer";
import { Outlet, useLocation } from "react-router-dom"

export default function LayoutApp() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <Flex direction="column" minH="100vh" bg="#F0F4F8">
      <EmergencyBanner />
      <AppBar />
      <Box flex={1} w="100%" px={isHome ? 0 : [3, 5, 8]} py={isHome ? 0 : [6, 8, 1]}>
        <Outlet />
      </Box>
      <Footer />
    </Flex>
  )
}
