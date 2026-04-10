import {
  Box,
  Flex,
  Text,
} from "@chakra-ui/react";
import type { Status } from "../domain/documentDetail";
import { Tooltip } from "./ui/tooltip";
import { truncateText } from "../utils/truncateText";

interface TimeLineProps {
  status: Status[];
  showAllMessage?: boolean;
}

export const statusColor = {
  aguardando: "yellow",
  confirmado: "green",
  cancelado: "red",
};

export const statusLabel = {
  aguardando: "Aguardando",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
};


export default function DocumentStatusTimeLine(props: TimeLineProps) {
    const finalStatus = props.status[props.status.length - 1];
    const showAllMessage = props.showAllMessage || false;

    return (
      <Box mb={8}>
        <Text fontWeight="bold" mb={6}>
          Linha do Tempo
        </Text>

        <Flex position="relative" align="center">
          {/* Linha base */}
          <Box
            position="absolute"
            top="10px"
            left="0"
            right="0"
            height="2px"
            bg="gray.200"
            zIndex={0}
          />

          {/* Linha progresso */}
          <Box
            position="absolute"
            top="10px"
            left="0"
            height="2px"
            bg={`${statusColor[finalStatus.status]}.400`}
            width={`${(props.status.length - 1) / (props.status.length - 1) * 100}%`}
            zIndex={0}
          />

          {props.status.map((item, index) => {
            const isCompleted = index <= props.status.length - 1;
            const isLast = index === props.status.length - 1;

            return (
              <Flex
                key={item.id}
                direction="column"
                align="center"
                flex={1}
                zIndex={1}
              >
                {/* Bolinha */}
                <Box
                  w="20px"
                  h="20px"
                  borderRadius="full"
                  bg={
                    isLast
                      ? `${statusColor[item.status]}.500`
                      : isCompleted
                      ? `${statusColor[item.status]}.300`
                      : "gray.300"
                  }
                  border="3px solid white"
                  boxShadow="md"
                />

                {/* Status */}
                <Text mt={2} fontSize="sm" fontWeight="medium">
                  {statusLabel[item.status]}
                </Text>

                {/* props */}
                <Text fontSize="xs" color="gray.500">
                  {new Date(item.createdAt).toLocaleString()}
                  
                  {item.userName && ` - ${item.userName}`}
                </Text>

                {/* Comentário */}
                
                {item.comment && (
                  <Tooltip content={item.comment} showArrow>
                    <Text
                      fontSize="xs"
                      color="gray.600"
                      mt={2}
                      textAlign="center"
                      maxW="120px"
                      cursor="pointer"
                    >
                      {showAllMessage? item.comment : truncateText(item.comment)}
                    </Text>
                  </Tooltip>
                )}
              </Flex>
            );
          })}
        </Flex>
      </Box>
    )
}