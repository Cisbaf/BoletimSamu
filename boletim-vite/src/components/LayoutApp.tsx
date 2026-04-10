import { Flex, Container } from "@chakra-ui/react";
import AppBar from "./AppBar";
import { Outlet } from "react-router-dom"


export default function LayoutApp() {

    return (
        <Flex
            direction={"column"}>
                
            <AppBar/>

            <Container
                bg="white"
                w={["100%", "95%", "90%", "85%", "80%"]}
                height={"100%"}
                mt={[0, 5, 10]}
                borderRadius={[0, 2]}
                >
                <Outlet /> {/* aqui renderiza as páginas */}
            </Container>

        </Flex>
    )
}