import { ApiError } from "./apiError";

const FALLBACK = "Ocorreu um erro inesperado.";

/**
 * Mensagens por status para os casos em que o corpo da resposta não é JSON
 * (nginx e Django devolvem HTML nesses erros, e o HTML não diz nada de útil
 * para o usuário).
 */
const STATUS_MESSAGES: Record<number, string> = {
  401: "Sessão expirada. Faça login novamente.",
  403: "Você não tem permissão para realizar esta ação.",
  404: "Recurso não encontrado.",
  408: "O servidor demorou demais para responder. Tente novamente.",
  413: "O envio ficou grande demais para o servidor. Reduza o tamanho dos anexos (máx. 10 MB por arquivo) e tente novamente.",
  429: "Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.",
  500: "Erro interno no servidor ao processar a solicitação. Tente novamente em alguns minutos.",
  502: "O servidor está indisponível no momento. Tente novamente em alguns minutos.",
  503: "O servidor está indisponível no momento. Tente novamente em alguns minutos.",
  504: "O servidor demorou demais para responder. Verifique sua conexão e tente novamente.",
};

/**
 * Nomes amigáveis dos campos, para que o erro diga ONDE está o problema
 * ("Nº da ocorrência: ...") em vez de só repetir a frase do DRF.
 * A chave é o último trecho do caminho do erro (ex.: incident.occurrence_number).
 */
const FIELD_LABELS: Record<string, string> = {
  purpose: "Finalidade",
  applicant_type: "Tipo de solicitante",
  relationship_degree: "Grau de parentesco",
  files: "Anexos",
  types: "Tipos de anexo",
  full_name: "Nome completo",
  cpf: "CPF",
  rg: "RG",
  email: "E-mail",
  phone: "Telefone",
  date: "Data da ocorrência",
  time: "Hora da ocorrência",
  patient_name: "Nome do paciente",
  city: "Município",
  neighborhood: "Bairro",
  reason: "Motivo da solicitação da ambulância",
  attendance_location: "Local do atendimento",
  other_location_description: "Descrição do outro local",
  occurrence_number: "Nº da ocorrência",
  notes: "Observações",
  other_purpose: "Outro motivo",
  PATIENT_ID: "Documento com foto do paciente",
  APPLICANT_ID: "Documento com foto do solicitante",
  MARRIAGE_CERTIFICATE: "Certidão de casamento / União estável",
  POWER_OF_ATTORNEY: "Procuração específica",
  DEATH_CERTIFICATE: "Certidão de Óbito",
  KINSHIP_PROOF: "Comprovante de Parentesco",
};

// "address" existe no solicitante e na ocorrência, então o rótulo depende do pai.
const PATH_LABELS: Record<string, string> = {
  "applicant.address": "Endereço do solicitante",
  "incident.address": "Endereço da ocorrência",
};

const GENERIC_KEYS = new Set(["detail", "non_field_errors"]);

function labelFor(path: string[]): string | null {
  const last = path[path.length - 1];
  if (!last || GENERIC_KEYS.has(last) || /^\d+$/.test(last)) return null;
  const parent = path[path.length - 2];
  return PATH_LABELS[`${parent}.${last}`] ?? FIELD_LABELS[last] ?? null;
}

function collectMessages(value: unknown, messages: string[], path: string[] = []) {
  if (!value) return;

  if (typeof value === "string") {
    // Corpos de erro em HTML (nginx/Django) não servem como mensagem.
    if (value.length > 300 || /<\s*(html|head|body|!doctype)/i.test(value)) return;
    const label = labelFor(path);
    messages.push(label ? `${label}: ${value}` : value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectMessages(item, messages, path));
  } else if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) =>
      collectMessages(item, messages, [...path, key])
    );
  }
}

function messageFromBody(data: unknown): string | null {
  if (!data) return null;

  if (typeof data === "string") {
    const messages: string[] = [];
    collectMessages(data, messages);
    return messages[0] ?? null;
  }

  // Caso clássico: { detail: "..." }
  const detail = (data as Record<string, unknown>)?.detail;
  if (typeof detail === "string") return detail;

  const messages: string[] = [];
  collectMessages(data, messages);

  if (messages.length === 0) return null;

  // Remove duplicadas e junta bonito
  return [...new Set(messages)].join(" ");
}

/**
 * Transforma o erro de uma chamada à API em uma frase exibível.
 *
 * Aceita, em ordem de prioridade: o corpo de erro do DRF (dict/lista de
 * mensagens), o status HTTP e, por fim, a mensagem do próprio Error — assim
 * uma falha de rede ou uma resposta em HTML deixam de virar "erro inesperado".
 */
export function parseDjangoError(error: any): string {
  if (!error) return FALLBACK;
  if (typeof error === "string") return error;

  const status: number | undefined =
    typeof error?.status === "number" ? error.status : error?.response?.status;

  const body =
    error instanceof ApiError
      ? error.data
      : error?.response?.data ?? (error instanceof Error ? null : error);

  const fromBody = messageFromBody(body);
  if (fromBody) return fromBody;

  if (status) {
    if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
    if (status >= 500) return STATUS_MESSAGES[500];
    return `O servidor recusou o envio (erro ${status}). Revise os dados e tente novamente.`;
  }

  if (error instanceof Error && error.message) return error.message;

  return FALLBACK;
}
