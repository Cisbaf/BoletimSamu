import { Button as ChakraButton, defineStyle } from "@chakra-ui/react"
import type { ButtonProps as ChakraButtonProps } from "@chakra-ui/react"
import type { ReactNode } from "react"

// Exportamos nossa própria ButtonProps sem conflitar com a do Chakra
export interface ButtonProps extends Omit<ChakraButtonProps, "variant" | "size"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "xs" | "sm" | "md" | "lg"
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  ...props
}: ButtonProps) {

  const baseStyle = defineStyle({
    fontWeight: "600",
    transition: "all 150ms ease",
    borderRadius: "8px",
    _disabled: { cursor: "not-allowed", opacity: 0.6 },
  })

  const variantStyles: Record<string, ReturnType<typeof defineStyle>> = {
    primary: defineStyle({
      bg: "brandBlue.500",
      color: "white",
      _hover: { bg: "brandBlue.600", shadow: "md" },
      _active: { bg: "brandBlue.700", shadow: "lg" },
      _disabled: { bg: "gray.300", color: "gray.400" },
    }),
    secondary: defineStyle({
      bg: "white",
      color: "gray.700",
      border: "1px solid",
      borderColor: "gray.300",
      _hover: { bg: "gray.50", borderColor: "gray.400", shadow: "sm" },
      _active: { bg: "gray.100" },
      _disabled: { bg: "gray.50", color: "gray.400", borderColor: "gray.200" },
    }),
    outline: defineStyle({
      bg: "transparent",
      color: "brandBlue.500",
      border: "2px solid",
      borderColor: "brandBlue.500",
      _hover: { bg: "brandBlue.50" },
      _active: { bg: "brandBlue.100" },
      _disabled: { color: "gray.400", borderColor: "gray.300" },
    }),
    ghost: defineStyle({
      bg: "transparent",
      color: "gray.700",
      _hover: { bg: "gray.100" },
      _active: { bg: "gray.200" },
      _disabled: { color: "gray.400" },
    }),
    danger: defineStyle({
      bg: "#E03131",
      color: "white",
      _hover: { bg: "#C92A2A", shadow: "md" },
      _active: { bg: "#A71E1E", shadow: "lg" },
      _disabled: { bg: "gray.300", color: "gray.400" },
    }),
  }

  const sizeStyles: Record<string, ReturnType<typeof defineStyle>> = {
    xs: defineStyle({ h: "32px", px: "12px", fontSize: "12px" }),
    sm: defineStyle({ h: "36px", px: "16px", fontSize: "14px" }),
    md: defineStyle({ h: "44px", px: "24px", fontSize: "16px" }),
    lg: defineStyle({ h: "52px", px: "32px", fontSize: "18px" }),
  }

  const combinedStyle = {
    ...baseStyle,
    ...variantStyles[variant],
    ...sizeStyles[size],
  }

  return (
    <ChakraButton
      loading={loading}
      {...(combinedStyle as any)}
      {...(props as ChakraButtonProps)}
    >
      {children}
    </ChakraButton>
  )
}
