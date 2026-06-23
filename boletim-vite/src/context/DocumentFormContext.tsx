import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { DocumentFormData } from "../domain/documentSchemaForm";
import { DocumentSchema } from "../domain/documentSchemaForm";
import { initialFilling } from "../utils/fakeFilling";

interface DocumentFormType {
  form: UseFormReturn<DocumentFormData>;
}

const DocumentFormContext = React.createContext<DocumentFormType | null>(null);

interface DocumentFormProps {
  submitForm: (data: DocumentFormData)=> Promise<void>;
  children: any;
  fakeData?: boolean; 
}

export function DocumentFormProvider({submitForm ,children, fakeData}: DocumentFormProps) {
    const form = useForm<DocumentFormData>({
        resolver: zodResolver(DocumentSchema),
        defaultValues: fakeData? initialFilling : {} 
    });

    const { handleSubmit } = form;

    const onError = (errors: any) => {
      console.log("FORM ERROR ❌", errors);
    };

  return (
    <DocumentFormContext.Provider value={{form}}>
      <form onSubmit={handleSubmit(submitForm, onError)}>{children}</form>
    </DocumentFormContext.Provider>
  )
}

export function useDocumentFormContext() {
    const context = React.useContext(DocumentFormContext);
    if (!context) {
      throw new Error("useDocumentFormContext must be used within a DocumentFormProvider");
    }
  return context;
}