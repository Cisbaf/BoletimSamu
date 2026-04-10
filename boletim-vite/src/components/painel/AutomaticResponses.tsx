import { Button, Flex } from "@chakra-ui/react";
import { APPROVED_MESSAGE, REJECTION_LABELS, REJECTION_MESSAGES, type RejectionReason } from "../../utils/automaticResponsesText";


interface AutomaticResponsesProps {
    status: "confirmado" | "cancelado",
    setValue: (text: string) => void;
}

export default function AutomaticResponses({ status, setValue }: AutomaticResponsesProps) {
    
    if (status === "confirmado") {
        return (
            <Flex direction="column" gap={2}>
                <Button
                variant="outline"
                onClick={() => setValue(APPROVED_MESSAGE)}
                >
                Usar resposta de aprovação
                </Button>
            </Flex>
            );
    }

  // cancelado
  return (
    <Flex direction="column" gap={2}>
      {(Object.keys(REJECTION_MESSAGES) as RejectionReason[]).map((reason) => (
        <Button
          key={reason}
          variant="outline"
          justifyContent="flex-start"
          onClick={() => setValue(REJECTION_MESSAGES[reason])}
        >
          {REJECTION_LABELS[reason]}
        </Button>
      ))}
    </Flex>
  );

}