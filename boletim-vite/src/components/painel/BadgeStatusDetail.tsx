import { Badge, Flex } from "@chakra-ui/react";
import { HiCheckCircle, HiExclamationCircle, HiExclamation } from "react-icons/hi";
import type { Status } from "../../domain/documentDetail";

export default function BadgeStatusDetail({props}: {props: Status}) {

  let colorPalette: string;
  let Icon: any;

  if (props.status == "confirmado") {
    colorPalette = "green";
    Icon = HiCheckCircle;
  } else if (props.status == "aguardando") {
    colorPalette = "yellow";
    Icon = HiExclamationCircle;
  } else {
    colorPalette = "red";
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
        <Flex gap={1} alignItems={"center"}>
            <Icon />
            {props.status}
        </Flex>
    </Badge>
  );
};