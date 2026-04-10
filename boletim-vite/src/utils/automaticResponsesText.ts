export const APPROVED_MESSAGE = `Prezado(a),

Sua solicitação foi aprovada. O documento já está disponível para retirada mediante apresentação de documento de identificação.

Atenciosamente.`;

export type RejectionReason =
  | "ILLEGIBLE_DOCUMENT"
  | "NOT_FOUND"
  | "MISSING_DOCUMENTS"
  | "OUT_OF_SCOPE";

export const REJECTION_LABELS: Record<RejectionReason, string> = {
  ILLEGIBLE_DOCUMENT: "Documento ilegível ou incompleto",
  NOT_FOUND: "Registro não encontrado",
  MISSING_DOCUMENTS: "Documentos obrigatórios ausentes",
  OUT_OF_SCOPE: "Solicitação fora do escopo",
};

export const REJECTION_MESSAGES = {
  ILLEGIBLE_DOCUMENT: `Prezado(a),

Após análise da documentação enviada, informamos que não foi possível dar prosseguimento à sua solicitação, pois o documento apresentado encontra-se ilegível ou incompleto.

Solicitamos, por gentileza, o reenvio do arquivo em formato legível para que possamos dar continuidade ao atendimento.

Atenciosamente.`,
  NOT_FOUND: `Prezado(a),

Informamos que, com os dados fornecidos, não foi possível localizar a ocorrência mencionada.

Solicitamos, por gentileza, que revise as informações enviadas e, se possível, complemente com dados como data, horário e endereço completo para uma nova verificação.

Atenciosamente.`,
  MISSING_DOCUMENTS: `Prezado(a),

Informamos que sua solicitação não pôde ser processada devido à ausência de documentação obrigatória.

Solicitamos, por gentileza, que realize o envio dos documentos necessários para que possamos dar continuidade à análise.

Atenciosamente.`,
  OUT_OF_SCOPE: `Prezado(a),

Após análise, informamos que sua solicitação não atende aos critérios necessários para o fornecimento do documento solicitado.

Permanecemos à disposição para eventuais esclarecimentos.

Atenciosamente.`,
};