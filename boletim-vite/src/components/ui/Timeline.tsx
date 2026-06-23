import {
  VStack,
  HStack,
  Box,
  Text,
  Circle,
} from "@chakra-ui/react"
import type { BoxProps } from "@chakra-ui/react"
import type { ReactNode } from "react"
import {
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiXCircle,
  FiChevronDown,
} from "react-icons/fi"

type TimelineStatus = "completed" | "pending" | "warning" | "error" | "current"

export interface TimelineItemProps extends BoxProps {
  status: TimelineStatus
  title: string
  subtitle?: string
  description?: ReactNode
  timestamp?: string
  children?: ReactNode
  isLast?: boolean
}

const statusConfig = {
  completed: { color: "#22C55E",  icon: FiCheckCircle,  bgLight: "#F0FDF4", borderColor: "#BBF7D0" },
  pending:   { color: "#F59E0B",  icon: FiClock,        bgLight: "#FFFBEB", borderColor: "#FDE68A" },
  warning:   { color: "#F59E0B",  icon: FiAlertCircle,  bgLight: "#FFF7ED", borderColor: "#FED7AA" },
  error:     { color: "#E03131",  icon: FiXCircle,      bgLight: "#FEF2F2", borderColor: "#FECACA" },
  current:   { color: "#2563EB",  icon: FiChevronDown,  bgLight: "#EFF6FF", borderColor: "#BFDBFE" },
}

export function TimelineItem({
  status,
  title,
  subtitle,
  description,
  timestamp,
  children,
  isLast = false,
  direction: _dir,
  ...props
}: TimelineItemProps) {
  const config = statusConfig[status]

  return (
    <HStack align="stretch" gap={0} {...(props as any)}>
      {/* Dot e linha */}
      <VStack gap={0} align="center" py="12px">
        <Circle
          size="44px"
          bg={config.bgLight}
          border="2px solid"
          borderColor={config.borderColor}
          display="flex"
          alignItems="center"
          justifyContent="center"
          color={config.color}
          flexShrink={0}
          zIndex={2}
        >
          <Box as={config.icon} w="20px" h="20px" />
        </Circle>

        {!isLast && (
          <Box w="2px" flex="1" minH="60px" bg={config.borderColor} my="8px" />
        )}
      </VStack>

      {/* Conteúdo */}
      <Box flex={1} pb={isLast ? 0 : "20px"} pl="12px">
        <VStack align="start" gap="4px">
          <HStack justify="space-between" width="100%">
            <Text fontSize="16px" fontWeight="600" color="gray.900">{title}</Text>
            {timestamp && (
              <Text fontSize="12px" color="gray.500" whiteSpace="nowrap" ml="auto">
                {timestamp}
              </Text>
            )}
          </HStack>

          {subtitle && <Text fontSize="14px" color="gray.600">{subtitle}</Text>}
          {description && <Box fontSize="14px" color="gray.700" mt="8px">{description}</Box>}
          {children && <Box mt="12px">{children}</Box>}
        </VStack>
      </Box>
    </HStack>
  )
}

export interface TimelineProps extends BoxProps {
  children: ReactNode
}

export function Timeline({ children, direction: _dir, ...props }: TimelineProps) {
  return (
    <VStack
      align="stretch"
      gap={0}
      bg="white"
      borderRadius="12px"
      border="1px solid"
      borderColor="gray.200"
      p="24px"
      {...(props as any)}
    >
      {children}
    </VStack>
  )
}
