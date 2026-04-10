import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Text,
  Steps
} from "@chakra-ui/react"
import { useStepsContext } from "@chakra-ui/react"

interface StepItem {
  title: string
  description: string
  component: any
  validate?: () => Promise<boolean> | boolean
}

interface StepperProps {
  steps: StepItem[];
}

function NextButton({ steps }: { steps: StepItem[] }) {
  const stepper = useStepsContext()

  const isLast = stepper.value === steps.length - 1

  const handleNext = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const step = steps[stepper.value]
    if (!step) return

    if (step.validate) {
      const valid = await step.validate()
      if (!valid) {
        e.preventDefault()
        return
      }
    }

    if (!isLast) {
      e.preventDefault()
      stepper.setStep(stepper.value + 1)
    }
  }

  return (
    <Button
      colorScheme="blue"
      onClick={handleNext}
      type="submit"
      disabled={stepper.value >= steps.length}
    >
      {isLast ? "Finalizar" : "Próximo"}
    </Button>
  )
}
export default function StepperForm({ steps }: StepperProps) {
  return (
    <Steps.Root defaultStep={0} count={steps.length} width="100%">
      <Steps.List mb={2}>
        <StepperHeader steps={steps} />
      </Steps.List>

      {steps.map((step, index) => (
        <Steps.Content key={index} index={index}>
          <Box
            p={6}
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
          >
            {step.component}
          </Box>
        </Steps.Content>
      ))}

      <ButtonGroup mt={6}>
        <Steps.PrevTrigger asChild>
          <Button variant="outline">Anterior</Button>
        </Steps.PrevTrigger>

        <NextButton steps={steps} />
      </ButtonGroup>
    </Steps.Root>
  )
}

interface StepperHeaderProps {
  steps: StepItem[]
}

function StepperHeader({ steps }: StepperHeaderProps) {
  const stepper = useStepsContext()

  const currentStep = steps[stepper.value]

  if (!currentStep) return null

  return (
    <Flex width="100%" direction="column">
      {/* DESKTOP */}
      <Flex
        justify="space-between"
        display={{ base: "none", md: "flex" }}
        flex={1}
      >
        {steps.map((step, index) => (
          <Steps.Item key={index} index={index} flex="1">
            <Flex align="center" gap={3}>
              <Steps.Indicator asChild>
                <Box
                  w="42px"
                  h="42px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  border="2px solid"
                  borderColor="gray.300"
                  borderRadius="6px"
                  fontWeight="bold"
                  bg="white"
                  _current={{
                    bg: "blue.500",
                    color: "white",
                    borderColor: "blue.500"
                  }}
                  _complete={{
                    bg: "green.500",
                    color: "white",
                    borderColor: "green.500"
                  }}
                >
                  {index + 1}
                </Box>
              </Steps.Indicator>

              <Text
                fontSize={["sm", "md", "lg"]}
                fontWeight={["normal", "medium"]}
              >
                {step.title}
              </Text>
            </Flex>

            <Steps.Separator flex="1" ml={4} />
          </Steps.Item>
        ))}
      </Flex>

      {/* MOBILE */}
      <Flex
        display={{ base: "flex", md: "none" }}
        align="center"
        gap={3}
      >
        <Box
          w="42px"
          h="42px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="6px"
          fontWeight="bold"
          bg="blue.500"
          color="white"
        >
          {stepper.value + 1}
        </Box>

        <Text fontSize="lg" fontWeight="semibold">
          {currentStep.title}
        </Text>
      </Flex>

      <Text mt={5} fontWeight="medium" textStyle={["sm", "md", "lg"]}>
        {currentStep.description}
      </Text>
    </Flex>
  )
}