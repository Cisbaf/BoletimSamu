"use client"

import {
  createContext,
  useContext,
  useState,
} from "react"
import { Flex, Spinner, Text } from "@chakra-ui/react"

interface LoadingContextType {
  showLoading: (text?: string) => void
  hideLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | null>(null)

export function LoadingProvider({ children }: { children: any }) {
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState<string | undefined>()

  function showLoading(message?: string) {
    setText(message)
    setLoading(true)
  }

  function hideLoading() {
    setLoading(false)
    setText(undefined)
  }

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}

      {loading && (
        <Flex
          position="fixed"
          inset="0"
          bg="blackAlpha.600"
          backdropFilter="blur(6px)"
          zIndex="9999"
          align="center"
          justify="center"
          direction="column"
          gap={4}
        >
          <Spinner size="xl" color="blue.400" />

          {text && (
            <Text color="white" fontSize="lg">
              {text}
            </Text>
          )}
        </Flex>
      )}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)

  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider")
  }

  return context
}