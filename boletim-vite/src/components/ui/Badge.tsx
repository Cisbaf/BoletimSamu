import { Flex, Text, Icon } from "@chakra-ui/react"
import type { FlexProps } from "@chakra-ui/react"
import type { ElementType, ReactNode } from "react"
import {
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiXCircle,
  FiInfo,
} from "react-icons/fi"

type StatusType = "success" | "warning" | "pending" | "error" | "info"

export interface BadgeProps extends FlexProps {
  status: StatusType
  children: ReactNode
  icon?: ElementType
}

const statusConfig = {
  success:  { bg: "#ECFDF5", color: "#065F46", borderColor: "#A7F3D0", icon: FiCheckCircle, label: "Sucesso" },
  warning:  { bg: "#FFFBEB", color: "#92400E", borderColor: "#FCD34D", icon: FiAlertCircle, label: "Aviso" },
  pending:  { bg: "#FEF3C7", color: "#A16207", borderColor: "#FDE68A", icon: FiClock,        label: "Pendente" },
  error:    { bg: "#FEE2E2", color: "#7F1D1D", borderColor: "#FECACA", icon: FiXCircle,      label: "Erro" },
  info:     { bg: "#EFF6FF", color: "#0C2D6B", borderColor: "#BFDBFE", icon: FiInfo,         label: "Informação" },
}

export function Badge({ status, children, icon: CustomIcon, ...props }: BadgeProps) {
  const config = statusConfig[status]
  const IconComponent: ElementType = CustomIcon ?? config.icon

  return (
    <Flex
      alignItems="center"
      gap="8px"
      px="12px"
      py="6px"
      borderRadius="6px"
      bg={config.bg}
      color={config.color}
      border="1px solid"
      borderColor={config.borderColor}
      fontSize="12px"
      fontWeight="600"
      lineHeight="16px"
      width="fit-content"
      {...props}
    >
      <Icon as={IconComponent} w="16px" h="16px" />
      <Text>{children}</Text>
    </Flex>
  )
}

export { statusConfig }
