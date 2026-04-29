import { Box } from "@chakra-ui/react";
import { StepperRequestProvider } from "../context/StepperRequestContext";
import { DocumentFormProvider, useDocumentFormContext } from "../context/DocumentFormContext";
import ApplicantForm from "../components/form/ApplicantForm";
import IncidentForm from "../components/form/IncidentForm";
import AttachmentsForm from "../components/form/AttachmentsForm";
import StepperForm from "../components/StepperForm";
import { usePost } from "../hooks/usePost";
import MakeFormData from "../helpers/makeFormData";
import React from "react";
import { useLoading } from "../context/LoadingContext";
import { useToast } from "../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { parseDjangoError } from "../helpers/parseErros";

export default function SolicitarCopiaPage() {
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate()
  const toaster = useToast();

  const { post, loading } = usePost({
      url: "/document/create/",
      onSuccess: (res) => {
        toaster.success({
          title: "Documento enviado com sucesso!",
          description: "Aguarde que você sera redirecionado!"
        });
        navigate(`/acompanhar?protocol=${res.protocol}&created=true`);
      },
      onError: (err) => {
        const formatError = parseDjangoError(err);
        toaster.error({
          title: "Erro ao enviar solicitação!",
          description: formatError
        })
      },
      multiPart: true
  });

  React.useEffect(()=>{
    if (loading) showLoading("Enviando Solicitação...");
    else setTimeout(hideLoading, 1000);
  }, [loading]);

   return (
     <Box py={10}>
        <DocumentFormProvider submitFom={(data)=>post(MakeFormData(data))}>
            <StepForm/>
        </DocumentFormProvider>
    </Box>
   )
}

function StepForm() {
  const { form } = useDocumentFormContext();

  return (
    <StepperRequestProvider>
      <StepperForm
        steps={[
          {
            title: "Dados do Solicitante",
            description: "Essa etapa identifica quem preenche o formulário.",
            component: <ApplicantForm/>,
            validate: () => form.trigger("applicant")
          },
          {
            title: "Dados da Ocorrência",
            description: "Essa etapa identifica as informações do atendimento do SAMU.",
            component: <IncidentForm/>,
            validate: () => form.trigger(["purpose", "incident"])
          },
          {
            title: "Anexos",
            description: "Essa requerer envio da documentação.",
            component: <AttachmentsForm/>,
            validate: () => form.trigger("documents")
          }
        ]}
      />
    </StepperRequestProvider>
  )
};
