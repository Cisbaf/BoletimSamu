import { Box, Flex, Text } from "@chakra-ui/react"
import type { BoxProps, FlexProps, TextProps } from "@chakra-ui/react"
import type { ReactNode } from "react"

export interface CardProps extends BoxProps {
  children: ReactNode
}

export function Card({ children, ...props }: CardProps) {
  return (
    <Box
      bg="white"
      borderRadius="12px"
      border="1px solid"
      borderColor="gray.200"
      shadow="sm"
      transition="all 200ms ease"
      _hover={{ shadow: "md" }}
      {...props}
    >
      {children}
    </Box>
  )
}

export interface CardHeaderProps extends FlexProps {
  children: ReactNode
}

export function CardHeader({ children, ...props }: CardHeaderProps) {
  return (
    <Flex
      px="24px"
      py="20px"
      borderBottom="1px solid"
      borderColor="gray.200"
      alignItems="center"
      gap="12px"
      {...props}
    >
      {children}
    </Flex>
  )
}

export interface CardTitleProps extends TextProps {
  children: ReactNode
}

export function CardTitle({ children, ...props }: CardTitleProps) {
  return (
    <Text
      fontSize="20px"
      fontWeight="600"
      color="gray.900"
      lineHeight="28px"
      {...props}
    >
      {children}
    </Text>
  )
}

export interface CardBodyProps extends BoxProps {
  children: ReactNode
}

export function CardBody({ children, ...props }: CardBodyProps) {
  return (
    <Box px="24px" py="24px" {...props}>
      {children}
    </Box>
  )
}

export interface CardFooterProps extends FlexProps {
  children: ReactNode
}

export function CardFooter({ children, ...props }: CardFooterProps) {
  return (
    <Flex
      px="24px"
      py="16px"
      borderTop="1px solid"
      borderColor="gray.200"
      gap="12px"
      justifyContent="flex-end"
      flexWrap="wrap"
      {...props}
    >
      {children}
    </Flex>
  )
}
