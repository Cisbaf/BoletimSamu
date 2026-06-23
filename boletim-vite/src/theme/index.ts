import { createSystem, defaultConfig } from "@chakra-ui/react"

export const system = createSystem(defaultConfig, {
  preflight: true,

  globalCss: {
    html: {
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    },
    body: {
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      bg: "#F0F4F8",
      color: "#111827",
    },
  },

  theme: {
    tokens: {
      colors: {
        brandBlue: {
          50:  { value: "#EFF6FF" },
          100: { value: "#DBEAFE" },
          500: { value: "#2563EB" },
          600: { value: "#1D4ED8" },
          700: { value: "#1E40AF" },
        },
        brandYellow: {
          500: { value: "#F5B800" },
          600: { value: "#e0a800" },
        },
        alertRed: {
          500: { value: "#DC2626" },
          600: { value: "#B91C1C" },
        },
        successGreen: {
          500: { value: "#22C55E" },
          600: { value: "#16A34A" },
        },
      },
      fonts: {
        heading: { value: "'Plus Jakarta Sans', system-ui, sans-serif" },
        body:    { value: "'Plus Jakarta Sans', system-ui, sans-serif" },
      },
      radii: {
        lg: { value: "10px" },
        xl: { value: "16px" },
      },
    },

    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: "#F0F4F8" },
        },
      },
    },
  },
})
