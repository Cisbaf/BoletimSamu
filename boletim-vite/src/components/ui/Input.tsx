import {
  Field,
  Input as ChakraInput,
  HStack,
  Icon,
  Text,
} from "@chakra-ui/react"
import type { InputProps as ChakraInputProps } from "@chakra-ui/react"
import type { ReactNode } from "react"
import { FiAlertCircle, FiCheckCircle, FiInfo } from "react-icons/fi"

export interface InputProps extends Omit<ChakraInputProps, "size"> {
  label?: string
  hint?: string
  error?: string
  success?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  required?: boolean
  disabled?: boolean
}

export function Input({
  label,
  hint,
  error,
  success,
  leftIcon,
  required,
  disabled,
  ...props
}: InputProps) {
  const hasError = !!error
  const showSuccess = success && !hasError

  return (
    <Field.Root invalid={hasError} disabled={disabled}>
      {label && (
        <Field.Label
          fontSize="14px"
          fontWeight="600"
          color="gray.700"
          mb="8px"
        >
          {label}
          {required && (
            <Text as="span" color="#E03131" ml="4px">
              *
            </Text>
          )}
        </Field.Label>
      )}

      <HStack position="relative" width="100%">
        {leftIcon && (
          <Icon
            position="absolute"
            left="12px"
            color="gray.400"
            pointerEvents="none"
            zIndex={1}
          >
            {leftIcon as any}
          </Icon>
        )}

        <ChakraInput
          px={leftIcon ? "40px" : "12px"}
          py="10px"
          height="44px"
          fontSize="14px"
          borderRadius="10px"
          border="1.5px solid"
          borderColor={hasError ? "#E03131" : "#E5E7EB"}
          bg={disabled ? "gray.50" : "#F9FAFB"}
          color="#111827"
          transition="all 150ms ease"
          _focus={{
            borderColor: hasError ? "#E03131" : "#2563EB",
            boxShadow: hasError
              ? "0 0 0 3px rgba(224, 49, 49, 0.1)"
              : "0 0 0 3px rgba(37, 99, 235, 0.1)",
          }}
          _disabled={{ bg: "gray.50", color: "gray.400", cursor: "not-allowed" }}
          _placeholder={{ color: "#94A3B8" }}
          {...props}
        />

        {(showSuccess || error) && (
          <Icon
            position="absolute"
            right="12px"
            color={showSuccess ? "#22C55E" : "#E03131"}
            pointerEvents="none"
            zIndex={1}
          >
            {showSuccess ? <FiCheckCircle /> : <FiAlertCircle />}
          </Icon>
        )}
      </HStack>

      {hint && !error && (
        <Text fontSize="12px" color="gray.500" mt="6px" display="flex" alignItems="center" gap="4px">
          <Icon as={FiInfo} w="14px" h="14px" />
          {hint}
        </Text>
      )}

      {error && (
        <Field.ErrorText fontSize="12px" mt="6px">
          <Icon as={FiAlertCircle} mr="4px" />
          {error}
        </Field.ErrorText>
      )}

      {showSuccess && (
        <Text fontSize="12px" color="#22C55E" mt="6px" display="flex" alignItems="center" gap="4px">
          <Icon as={FiCheckCircle} w="14px" h="14px" />
          Válido
        </Text>
      )}
    </Field.Root>
  )
}

export interface TextareaProps extends Omit<ChakraInputProps, "size"> {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  maxLength?: number
}

export function Textarea({ label, hint, error, required, maxLength, ...props }: TextareaProps) {
  const hasError = !!error

  return (
    <Field.Root invalid={hasError}>
      {label && (
        <Field.Label fontSize="14px" fontWeight="600" color="gray.700" mb="8px">
          {label}
          {required && (
            <Text as="span" color="#E03131" ml="4px">
              *
            </Text>
          )}
        </Field.Label>
      )}

      <ChakraInput
        as="textarea"
        px="12px"
        py="10px"
        minHeight="100px"
        fontSize="14px"
        borderRadius="10px"
        border="1.5px solid"
        borderColor={hasError ? "#E03131" : "#E5E7EB"}
        bg="#F9FAFB"
        resize="vertical"
        transition="all 150ms ease"
        _focus={{
          borderColor: hasError ? "#E03131" : "#2563EB",
          boxShadow: hasError
            ? "0 0 0 3px rgba(224, 49, 49, 0.1)"
            : "0 0 0 3px rgba(37, 99, 235, 0.1)",
        }}
        _placeholder={{ color: "#94A3B8" }}
        {...props}
      />

      {hint && !error && (
        <Text fontSize="12px" color="gray.500" mt="6px">{hint}</Text>
      )}

      {error && (
        <Field.ErrorText fontSize="12px" mt="6px">{error}</Field.ErrorText>
      )}

      {maxLength && (
        <Text fontSize="12px" color="gray.500" mt="6px" textAlign="right">
          {props.value?.toString().length || 0} / {maxLength}
        </Text>
      )}
    </Field.Root>
  )
}
