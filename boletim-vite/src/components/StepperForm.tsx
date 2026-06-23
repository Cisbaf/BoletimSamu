import { Box, Button, Flex, Text, Steps } from "@chakra-ui/react"
import { useStepsContext } from "@chakra-ui/react"

interface StepItem {
  title: string
  description: string
  component: any
  validate?: () => Promise<boolean> | boolean
  stepLabel?: string // label curto para o dot (ex: "Solicitante")
}

interface StepperProps {
  steps: StepItem[]
  brandName?: string
  brandSubtitle?: string
}

export default function StepperForm({ steps, brandName, brandSubtitle }: StepperProps) {
  return (
    <Steps.Root defaultStep={0} count={steps.length} width="100%">
      <StepperInner steps={steps} brandName={brandName} brandSubtitle={brandSubtitle} />
    </Steps.Root>
  )
}

// ─── Dot do step ────────────────────────────────────────────────────────────

interface DotProps {
  index: number
  current: number
  label: string
}

function StepDot({ index, current, label }: DotProps) {
  const isDone   = index < current
  const isActive = index === current

  return (
    <Flex direction="column" align="center" gap="6px">
      <Flex
        w="28px"
        h="28px"
        borderRadius="full"
        bg={isDone ? "#22C55E" : isActive ? "#2563EB" : "white"}
        border="2px solid"
        borderColor={isDone ? "#22C55E" : isActive ? "#2563EB" : "#E5E7EB"}
        align="center"
        justify="center"
        transition="all 0.25s"
        flexShrink={0}
      >
        <Text
          fontSize="11px"
          fontWeight="700"
          color={isDone || isActive ? "white" : "#9CA3AF"}
          lineHeight={1}
        >
          {isDone ? "✓" : String(index + 1)}
        </Text>
      </Flex>
      <Text
        fontSize="10px"
        fontWeight={isActive ? "700" : "500"}
        color={isActive ? "#1D4ED8" : isDone ? "#059669" : "#9CA3AF"}
        whiteSpace="nowrap"
      >
        {label}
      </Text>
    </Flex>
  )
}

// ─── Inner (precisa de contexto Steps.Root) ──────────────────────────────────

function StepperInner({ steps, brandName, brandSubtitle }: StepperProps) {
  const stepper = useStepsContext()
  const current  = stepper.value
  const total    = steps.length
  const isLast   = current === total - 1
  const progress = Math.round(((current + 1) / total) * 100)
  const currentStep = steps[current]

  const handleNext = async () => {
    if (currentStep?.validate) {
      const valid = await currentStep.validate()
      if (!valid) return
    }
    if (!isLast) {
      stepper.setStep(current + 1)
    }
  }

  const handlePrev = () => {
    stepper.setStep(Math.max(0, current - 1))
  }

  const defaultLabels = ["Solicitante", "Ocorrência", "Documentos"]

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      boxShadow="0 2px 6px rgba(0,0,0,.08), 0 10px 40px rgba(0,0,0,.10)"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      maxW="50%"
      mx="auto"
      w="100%"
    >
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <Box px={7} pt={6} pb={5} borderBottom="1px solid" borderColor="gray.100">

        {/* Badge + título + contador */}
        <Flex justify="space-between" align="center" mb={5}>
          <Flex align="center" gap={2}>
            <Box
              w="26px"
              h="26px"
              bg="#DC2626"
              borderRadius="6px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Text color="white" fontWeight="800" fontSize="12px" lineHeight={1}>
                S
              </Text>
            </Box>
            <Box>
              {brandName && (
                <Text fontWeight="700" fontSize="14px" color="#111827" lineHeight={1.2}>
                  {brandName}
                </Text>
              )}
              {brandSubtitle && (
                <Text fontSize="10px" color="#9CA3AF" mt="2px">
                  {brandSubtitle}
                </Text>
              )}
            </Box>
          </Flex>
          <Text fontSize="12px" color="#9CA3AF" fontWeight="500">
            {current + 1} / {total}
          </Text>
        </Flex>

        {/* Barra de progresso */}
        <Box h="4px" bg="#F3F4F6" borderRadius="full" mb={5} overflow="hidden">
          <Box
            h="100%"
            w={`${progress}%`}
            bg="#2563EB"
            borderRadius="full"
            transition="width 0.35s ease"
          />
        </Box>

        {/* Step dots */}
        <Box position="relative">
          <Box
            position="absolute"
            top="13px"
            left="14px"
            right="14px"
            h="1.5px"
            bg="#F3F4F6"
            zIndex={0}
          />
          <Flex justify="space-between" position="relative" zIndex={1}>
            {steps.map((step, i) => (
              <StepDot
                key={i}
                index={i}
                current={current}
                label={step.stepLabel ?? defaultLabels[i] ?? `Passo ${i + 1}`}
              />
            ))}
          </Flex>
        </Box>
      </Box>

      {/* ── CONTEÚDO ───────────────────────────────────────────────────── */}
      <Box flex={1} overflowY="auto" px={7} pt={6} pb={2}>

        {/* Título do passo */}
        <Box mb={5}>
          <Text
            fontSize="20px"
            fontWeight="700"
            color="#111827"
            letterSpacing="-0.4px"
            mb={1}
          >
            {currentStep?.title}
          </Text>
          <Text fontSize="13px" color="#6B7280">
            {currentStep?.description}
          </Text>
        </Box>

        {/* Formulários por passo */}
        {steps.map((step, index) => (
          <Steps.Content key={index} index={index}>
            {step.component}
          </Steps.Content>
        ))}
      </Box>

      {/* ── RODAPÉ DE NAVEGAÇÃO ────────────────────────────────────────── */}
      <Box
        px={7}
        py={4}
        borderTop="1px solid"
        borderColor="gray.100"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bg="white"
      >
        <Button
          variant="outline"
          visibility={current > 0 ? "visible" : "hidden"}
          borderRadius="10px"
          border="2px solid"
          borderColor="#E5E7EB"
          color="#374151"
          fontWeight="600"
          fontSize="13px"
          px={5}
          h="40px"
          onClick={handlePrev}
          _hover={{ bg: "#F9FAFB", borderColor: "#D1D5DB" }}
        >
          ← Voltar
        </Button>

        {!isLast ? (
          <Button
            bg="#2563EB"
            color="white"
            borderRadius="10px"
            fontWeight="700"
            fontSize="13px"
            px={6}
            h="40px"
            boxShadow="0 2px 8px rgba(37,99,235,0.28)"
            onClick={handleNext}
            _hover={{ bg: "#1D4ED8" }}
          >
            Próximo →
          </Button>
        ) : (
          <Button
            type="submit"
            bg="#2563EB"
            color="white"
            borderRadius="10px"
            fontWeight="700"
            fontSize="13px"
            px={6}
            h="40px"
            boxShadow="0 2px 8px rgba(37,99,235,0.28)"
            onClick={handleNext}
            _hover={{ bg: "#1D4ED8" }}
          >
            ✓ Enviar Solicitação
          </Button>
        )}
      </Box>
    </Box>
  )
}
