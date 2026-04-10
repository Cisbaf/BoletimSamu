import { Button, Field, Flex, Show, Text, Textarea } from "@chakra-ui/react";
import React from "react";
import { DrawerBody, DrawerCloseTrigger, DrawerContent, DrawerFooter, DrawerHeader, DrawerRoot } from "../ui/drawer";
import AutomaticResponses from "./AutomaticResponses";
import { useDocumentDetailContext } from "../../context/DocumentDetail";


interface DocumentResponse {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function DocumentResponse({isOpen, onOpenChange}: DocumentResponse){
    const [statusResponse, setStatusResponse] = React.useState<"confirmado" | "cancelado">("confirmado");
    const [text, setText] = React.useState("");
    const { document, newStatus } = useDocumentDetailContext();

    const newStatusHandle = async () => {
        const response = await newStatus(statusResponse, text);
        if (response) resetState();
    }

    const resetState = () => {
        setStatusResponse("confirmado");
        setText("");
        onOpenChange(false);
    }

    return (
     <DrawerRoot size={"sm"} open={isOpen} onOpenChange={resetState}>
        <DrawerContent>
            <DrawerHeader>
                <Text fontWeight="bold">Atualizar Resposta Solicitação</Text>
            </DrawerHeader>

            <DrawerCloseTrigger />

            <DrawerBody>
                <Show when={document}>
                    {() => (
                     <Flex direction="column" gap={4}>
                        <Flex gap={2}>
                            <Button
                            flex={1}
                            variant={statusResponse === "confirmado" ? "solid" : "outline"}
                            colorPalette="green"
                            onClick={() => setStatusResponse("confirmado")}
                            >
                            Aprovar
                            </Button>

                            <Button
                            flex={1}
                            variant={statusResponse === "cancelado" ? "solid" : "outline"}
                            colorPalette="red"
                            onClick={() => setStatusResponse("cancelado")}
                            >
                            Rejeitar
                            </Button>
                        </Flex>
                        
                        <AutomaticResponses status={statusResponse} setValue={setText}/>

                        <Field.Root required>
                            <Field.Label>
                            Resposta <Field.RequiredIndicator />
                            </Field.Label>
                            <Textarea
                                placeholder="Escreva a justificativa"
                                value={text}
                                height="250px"
                                onChange={(e) => setText(e.target.value)}
                                variant="subtle" />
                            <Field.HelperText>Máximo 500 caracteres.</Field.HelperText>
                        </Field.Root>
                        </Flex>
                    )}
                </Show>
            </DrawerBody>
            <DrawerFooter>
                <Button onClick={newStatusHandle}>Enviar Resposta</Button>
            </DrawerFooter>
        </DrawerContent>
        </DrawerRoot>
    );
}