import React from "react";
import { Steps } from "@chakra-ui/react"

interface StepperRequestType {
  setStep: (index: number) => void;
}

export const StepperRequestContext = React.createContext<StepperRequestType | null>(null);

interface StepperRequestProps {
  children: any;
}

export function StepperRequestProvider({children}: StepperRequestProps) {
    const [step, setStep] = React.useState(0)

    return (
      <StepperRequestContext.Provider value={{ setStep }}>
        <Steps.Root
          step={step}   
          onStepChange={(e) => setStep(e.step)}
          defaultStep={0}
          orientation="vertical">
            {children}
          </Steps.Root>
      </StepperRequestContext.Provider>
    )
}

export function useStepperRequestContext() {
    const context = React.useContext(StepperRequestContext);
    if (!context) {
      throw new Error("useStepperRequest must be used within a StepperRequestProvider");
    }
  return context;
}