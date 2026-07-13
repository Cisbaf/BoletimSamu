/* =========================
 * CORREÇÃO DE PREENCHIMENTO
 * ========================= */

/**
 * Status possíveis de uma correção de preenchimento.
 *
 * - pendente  → admin criou, aguardando resposta do cidadão
 * - enviada   → cidadão respondeu, aguardando avaliação do admin
 * - aprovada  → admin aceitou as correções (terminal)
 * - rejeitada → admin rejeitou a resposta do cidadão (terminal)
 */
export type CorrectionStatusValue =
  | "pendente"
  | "enviada"
  | "aprovada"
  | "rejeitada";

/**
 * Um campo individual apontado pelo admin como incorreto.
 * O backend serializa em camelCase via ToCamelCase (veja utils/camelCase.ts).
 */
export interface CorrectionField {
  id: number;
  /** Chave estruturada do campo, ex.: "applicant.cpf", "attachment.PATIENT_ID" */
  fieldKey: string;
  /** Rótulo legível gerado pelo backend, ex.: "CPF" */
  fieldLabel: string;
  /** Comentário do admin explicando o erro */
  adminComment: string;
  /** Novo valor textual enviado pelo cidadão (null até enviar) */
  newValue: string | null;
  /** URL do novo arquivo enviado pelo cidadão (null até enviar) */
  newFile: string | null;
  /** Timestamp do envio do cidadão (null até enviar) */
  submittedAt: string | null;
}

/** Entrada do histórico de status de uma correção. */
export interface CorrectionStatus {
  id: number;
  status: CorrectionStatusValue;
  comment: string | null;
  userName?: string;
  createdAt: string;
}

/** Entidade completa de uma correção de preenchimento. */
export interface Correction {
  id: number;
  createdAt: string;
  fields: CorrectionField[];
  status: CorrectionStatus[];
}

/* =========================
 * CATÁLOGO DE CAMPOS
 * ========================= */

export type CorrectionFieldKind = "text" | "date" | "time" | "select" | "file";

export interface CorrectionFieldDescriptor {
  /** Chave enviada ao backend (deve bater com a whitelist Django) */
  key: string;
  /** Rótulo exibido ao usuário */
  label: string;
  /** Tipo de input adequado para o campo */
  kind: CorrectionFieldKind;
}

export interface CorrectionFieldCategory {
  category: string;
  fields: CorrectionFieldDescriptor[];
}

/**
 * Catálogo categorizado de campos que o admin pode marcar para correção.
 *
 * As chaves `attachment.*` usam os mesmos document_type definidos em
 * documentSchemaForm.ts (DOCUMENT_TYPES) e required_documents.ts.
 *
 * ATENÇÃO: as chaves `applicant.*` e `incident.*` espelham os nomes dos
 * campos do formulário do cidadão (documentSchemaForm.ts) prefixados pelo
 * seu namespace. O backend Django receberá esses nomes e os usará para
 * localizar o campo correto no modelo.
 */
export const CORRECTION_FIELD_CATALOG: CorrectionFieldCategory[] = [
  {
    category: "Dados do Requerente",
    fields: [
      { key: "applicant.full_name",  label: "Nome Completo", kind: "text" },
      { key: "applicant.cpf",        label: "CPF",           kind: "text" },
      { key: "applicant.rg",         label: "RG",            kind: "text" },
      { key: "applicant.email",      label: "E-mail",        kind: "text" },
      { key: "applicant.address",    label: "Endereço",      kind: "text" },
      { key: "applicant.phone",      label: "Telefone",      kind: "text" },
    ],
  },
  {
    category: "Dados da Ocorrência",
    fields: [
      { key: "incident.date",                       label: "Data da Ocorrência",                      kind: "date"   },
      { key: "incident.time",                       label: "Hora da Ocorrência",                      kind: "time"   },
      { key: "incident.patient_name",               label: "Nome do Paciente",                        kind: "text"   },
      { key: "incident.city",                       label: "Município",                               kind: "select" },
      { key: "incident.neighborhood",               label: "Bairro",                                  kind: "text"   },
      { key: "incident.address",                    label: "Endereço da Ocorrência",                  kind: "text"   },
      { key: "incident.reason",                     label: "Motivo da Solicitação da Ambulância",     kind: "text"   },
      { key: "incident.attendance_location",        label: "Local do Atendimento",                    kind: "select" },
      { key: "incident.other_location_description", label: "Descrição do Outro Local",                kind: "text"   },
      { key: "incident.occurrence_number",          label: "Número da Ocorrência",                    kind: "text"   },
      { key: "incident.notes",                      label: "Observações",                             kind: "text"   },
    ],
  },
  {
    category: "Dados da Solicitação",
    fields: [
      { key: "document.other_purpose", label: "Outro Motivo", kind: "text" },
    ],
  },
  {
    category: "Documentos Anexados",
    fields: [
      { key: "attachment.PATIENT_ID",          label: "Documento com foto do paciente",           kind: "file" },
      { key: "attachment.APPLICANT_ID",        label: "Documento com foto do solicitante",        kind: "file" },
      { key: "attachment.MARRIAGE_CERTIFICATE",label: "Certidão de casamento / União estável",    kind: "file" },
      { key: "attachment.POWER_OF_ATTORNEY",   label: "Procuração específica",                    kind: "file" },
      { key: "attachment.DEATH_CERTIFICATE",   label: "Certidão de Óbito",                        kind: "file" },
    ],
  },
];
