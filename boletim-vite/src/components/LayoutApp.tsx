import { Box, Flex } from "@chakra-ui/react";
import AppBar from "./AppBar";
import { Outlet } from "react-router-dom"

export default function LayoutApp() {
  return (
    <Flex direction="column" minH="100vh" bg="#F0F4F8">
      <AppBar />
      <Box flex={1} w="100%" px={[3, 5, 8]} py={[6, 8, 1]}>
        <Outlet />
      </Box>
    </Flex>
  )
}
