import { createSystem, defaultConfig } from "@chakra-ui/react"

export const system = createSystem(defaultConfig, {
    preflight: true, // 👈 ISSO AQUI É O RESET GLOBAL

  theme: {
    tokens: {
      colors: {
        brandBlue: {
          500: { value: "#1E63E9" },
          600: { value: "#174FCC" },
          700: { value: "#123EA3" },
        },
        brandYellow: {
          500: { value: "#F5B800" },
          600: { value: "#e0a800" },
        },
        alertRed: {
          500: { value: "#E03131" },
          600: { value: "#C92A2A" },
        },
      },
      fonts: {
        heading: { value: "'Poppins', sans-serif" },
        body: { value: "'Inter', sans-serif" },
      },
      radii: {
        lg: { value: "12px" },
      },
    },

    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: "#fff" },
        },
      },
    },
  },
})
