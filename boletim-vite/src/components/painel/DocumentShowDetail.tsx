import React from "react";
import { ReusableDialog } from "./ReusableDialog";
import { Accordion, Button, Dialog, Flex, HStack, Show, SkeletonText, Span, Text,} from "@chakra-ui/react";
import DocumentDetailView from "./DocumentDetailView";
import AttachmentCarousel from "./DocumentViewAnexs";
import DocumentStatusTimeLine from "../DocumentStatusTimeLine";
import { FcAnswers } from "react-icons/fc";
import { FaRegFilePdf } from "react-icons/fa";
import { useDocumentDetailContext } from "../../context/DocumentDetail";
import DocumentResponse from "./DocumentResponse";
import { exportRequestPdf } from "../../helpers/exportRequestPdf";


export interface DocumentShowDetailType {
    showDocument: (valueProtocol: string) => void;
}

interface DocumentShowDetailProps {
}

export const DocumentShowDetail = React.forwardRef<DocumentShowDetailType, DocumentShowDetailProps>(
    (_, ref) => {
    const [visible, setVisible] = React.useState(false);
    const [answersVisible, setAnswersVisible] = React.useState(false);
    const { document, updateForProtocol } = useDocumentDetailContext();
    
    const onClose = () => {
        setVisible(false);
        updateForProtocol("");
    }

    React.useImperativeHandle(ref, () => ({
        showDocument(valueProtocol) {
            setVisible(true);
            updateForProtocol(valueProtocol);
        },
    }))

    return (
    <ReusableDialog
        // trigger={<Button>Abrir Modal</Button>}
        open={visible}
        onOpenChange={onClose}
        title={`Detalhes da Solicitação`}
        footer={
           <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
            </Dialog.ActionTrigger>
        }
        >
        <Show when={document}
            fallback={
                <HStack width="full">
                    <SkeletonText noOfLines={4} height={100} />
                </HStack>
            }>
            {(doc)=> (
                <Flex direction="column" gap={5}>
                    <HStack position={"absolute"} right={10} gap={2}>
                        <Button
                            maxWidth={140}
                            onClick={(()=>exportRequestPdf(doc))}
                            variant={"outline"}>
                            <FaRegFilePdf/>
                            <Text>Exportar PDF</Text>
                        </Button>
                        <Button
                            maxWidth={100}
                            onClick={(()=>setAnswersVisible(true))}
                            variant={"subtle"}>
                            <FcAnswers/>
                            <Text>Novo Status</Text>
                        </Button>
                    </HStack>
                    <DocumentDetailView data={doc} />
                    <DocumentStatusTimeLine status={doc.status} rectifications={doc.rectifications} corrections={doc.corrections}/>
                    <DocumentResponse
                        isOpen={answersVisible}
                        onOpenChange={setAnswersVisible}
                    />
                    <Accordion.Root collapsible bgColor={"#f6f6f6"} p={2}>
                        <Accordion.Item value={"anexos"}>
                            <Accordion.ItemTrigger cursor={"pointer"}>
                                <Span flex="1">{`Anexos (${doc.documents.length})`}</Span>
                                <Accordion.ItemIndicator />
                            </Accordion.ItemTrigger>
                            <Accordion.ItemContent>
                                <Accordion.ItemBody>
                                    <AttachmentCarousel files={doc.documents}/>
                                </Accordion.ItemBody>
                            </Accordion.ItemContent>
                        </Accordion.Item>
                    </Accordion.Root>
               
                </Flex>
            )}
        </Show>
        
        </ReusableDialog>
    )
    }
)
