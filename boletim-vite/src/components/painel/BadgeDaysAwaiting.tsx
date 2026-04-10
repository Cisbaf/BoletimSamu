import { Badge } from "@chakra-ui/react";
import { HiCheckCircle, HiExclamationCircle, HiExclamation } from "react-icons/hi";


export default function BadgeDaysAwaiting({days}: {days: number}) {
  
  let colorPalette: string;
  let label: string;
  let Icon: any;

  if (days <= 7) {
    colorPalette = "green";
    label = `${days} dia${days === 1 ? "" : "s"} (normal)`;
    Icon = HiCheckCircle;
  } else if (days <= 15) {
    colorPalette = "yellow";
    label = `${days} dia${days === 1 ? "" : "s"} (atraso médio)`;
    Icon = HiExclamationCircle;
  } else {
    colorPalette = "red";
    label = `${days} dia${days === 1 ? "" : "s"} (atraso longo)`;
    Icon = HiExclamation;
  }

  return (
    <Badge
      variant="solid"
      colorPalette={colorPalette}
      display="inline-flex"
      alignItems="center"
      gap={1}
      borderRadius="full"
      px={2}
      py={1}
      fontSize="xs"
    >
      <Icon />
      {label}
    </Badge>
  );
};