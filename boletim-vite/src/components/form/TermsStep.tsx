import { Box, Checkbox, Flex, Text } from "@chakra-ui/react";
import { acceptTermText } from "../../utils/term";

interface TermsStepProps {
  accepted: boolean;
  onChangeAccepted: (accepted: boolean) => void;
}

export default function TermsStep({ accepted, onChangeAccepted }: TermsStepProps) {
  const paragraphs = acceptTermText.trim().split("\n\n");

  return (
    <Box>
      <Box
        border="1px solid"
        borderColor="#E5E7EB"
        borderRadius="10px"
        bg="#F9FAFB"
        p={4}
        maxH="320px"
        overflowY="auto"
        mb={4}
      >
        <Text fontSize="14px" fontWeight="700" color="#111827" mb={3}>
          SOLICITAÇÃO DE CÓPIA DE BOLETIM DE ATENDIMENTO SAMU
        </Text>
        {paragraphs.map((paragraph, index) => (
          <Text key={index} fontSize="13px" color="#374151" mb={3} lineHeight={1.6}>
            {paragraph.trim()}
          </Text>
        ))}
      </Box>

      <Box
        border="1px solid"
        borderColor={accepted ? "#BFDBFE" : "#E5E7EB"}
        borderRadius="10px"
        p={3}
        bg={accepted ? "#EFF6FF" : "white"}
        transition="all 0.15s"
      >
        <Flex align="center" gap={3} cursor="pointer" onClick={() => onChangeAccepted(!accepted)}>
          <Checkbox.Root
            checked={accepted}
            onCheckedChange={(e) => onChangeAccepted(!!e.checked)}
            colorPalette="blue"
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
          </Checkbox.Root>
          <Text fontSize="13px" fontWeight="600" color="#111827">
            Li e estou de acordo com os termos acima.
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
