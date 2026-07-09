import { Text, chakra } from "@chakra-ui/react";
import { MdLocalPhone } from "react-icons/md";

export default function EmergencyBanner() {
  return (
    <chakra.a
      href="tel:192"
      display="flex"
      w="100%"
      bg="samuRed.500"
      color="white"
      alignItems="center"
      justifyContent="center"
      gap={2}
      py="6px"
      px={3}
      fontSize={["11px", "12.5px"]}
      fontWeight="600"
      textAlign="center"
      _hover={{ bg: "samuRed.600" }}
      transition="background 0.15s"
    >
      <MdLocalPhone size={14} />
      <Text>
        Emergência médica? Ligue <strong>192</strong> — este site é apenas para solicitar documentos já emitidos.
      </Text>
    </chakra.a>
  );
}
