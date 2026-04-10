import { Container } from "@chakra-ui/react"

interface LayoutProps {
  children: any;
}

function Layout({ children }: LayoutProps) {

  return (
      <Container
        bg="white"
        w={["100%", "95%", "90%", "85%", "80%"]}
        height={"100%"}
        mt={[0, 5, 10]}
        borderRadius={[0, 2]}
        >
        {children}
      </Container>
  )
}

export default Layout;
