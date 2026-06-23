import { z } from "zod";
import { isValidCPF } from "./valid";

/* =========================
 * Constantes (UI + Schema)
 * ========================= */

export const CITIES = [
  "BELFORD ROXO",
  "DUQUE DE CAXIAS",
  "ITAGUAÍ",
  "JAPERI",
  "MAGE",
  "MESQUITA",
  "NILÓPOLIS",
  "NOVA IGUAÇU",
  "PARACAMBI",
  "QUEIMADOS",
  "SAO JOAO DE MERITI",
  "SEROPÉDICA",
] as const;

export const PURPOSES = [
  "OBITO",
  "DPVAT",
  "INSS",
  "SEGURO",
  "INVENTARIO",
  "ACAO JUDICIAL",
  "OUTROS",
] as const;

export const APPLICANT_TYPES = [
  "PATIENT",
  "REPRESENTATIVE",
] as const;

export const RELATIONSHIP_DEGREES = [
  "FAMILY",
  "SPOUSE",
  "ATTORNEY",
] as const;

export const ATTENDANCE_LOCATIONS = [
  "RES",
  "PUB",
  "OTH",
] as const;

export const DOCUMENT_TYPES = [
  "PATIENT_ID",
  "APPLICANT_ID",
  "MARRIAGE_CERTIFICATE",
  "POWER_OF_ATTORNEY",
  "DEATH_CERTIFICATE",
] as const;

export const ApplicantSchema = z
  .object({
    applicant_type: z.enum(APPLICANT_TYPES, "Selecione uma das opções!"),
    relationship_degree: z.enum(RELATIONSHIP_DEGREES, "Grau de parentesco é obrigatório para representante").optional(),
    full_name: z.string().min(6, "Nome muito curto!"),
    cpf: z
      .string()
      .transform(v => v.replace(/\D/g, ""))
      .refine(isValidCPF, {
        message: "CPF inválido",
      }),
    rg: z.string().min(8, "Verifique o RG!"),
    email: z.string().email("E-mail incorreto!"),
    address: z.string().nonempty("Preencha o endereço"),
    phone: z.string().nonempty("Preencha o telefone"),
  })
  .superRefine((data, ctx) => {
    // 🔴 PATIENT não pode ter relationship
    if (
      data.applicant_type === "PATIENT" &&
      data.relationship_degree
    ) {
      ctx.addIssue({
        path: ["relationship_degree"],
        message:
          "Grau de parentesco não deve ser informado quando o solicitante é o próprio paciente",
        code: z.ZodIssueCode.custom,
      });
    }

    // 🔴 REPRESENTATIVE precisa de relationship
    if (
      data.applicant_type === "REPRESENTATIVE" &&
      !data.relationship_degree
    ) {
      ctx.addIssue({
        path: ["relationship_degree"],
        message:
          "Grau de parentesco é obrigatório para representante",
        code: z.ZodIssueCode.custom,
      });
    }
  });
  
export const IncidentSchema = z.object({
  date: z.string().nonempty("Preencha uma data"),
  time: z.string().nonempty("Preencha um horário"),
  patient_name: z.string().nonempty("Preencha o nome completo"),
  city: z.enum(CITIES, "Selecione um municipio valido"),
  neighborhood: z.string().nonempty("Preencha o bairro"),
  address: z.string().nonempty("Preencha o endereço"),
  reason: z.string().nonempty("Preencha o motivo").max(50),
  attendance_location: z.enum(ATTENDANCE_LOCATIONS, "Selecione o local do atendimento"),
  other_location_description: z.string().optional(),
  occurrence_number: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (
    data.attendance_location === "OTH" &&
    !data.other_location_description
  ) {
    ctx.addIssue({
      path: ["other_location_description"],
      message: "Descrição do local é obrigatória",
      code: z.ZodIssueCode.custom,
    });
  }
});


export const REQUIRED_DOCUMENTS = {
  PATIENT: {
    default: ["PATIENT_ID"],
  },
  REPRESENTATIVE: {
    FAMILY: ["PATIENT_ID", "APPLICANT_ID"],
    SPOUSE: ["PATIENT_ID", "APPLICANT_ID", "MARRIAGE_CERTIFICATE"],
    ATTORNEY: ["PATIENT_ID", "APPLICANT_ID", "POWER_OF_ATTORNEY"],
  },
  PURPOSE: {
    OBITO: ["DEATH_CERTIFICATE"]
  }
} as const;


export const DocumentsSchema = z
  .record(
    z.enum(DOCUMENT_TYPES),
    z.instanceof(File).optional()
  )
  .optional();
  
export const DocumentSchema = z.object({
  purpose: z.enum(PURPOSES, "Selecione uma opção!"),
  applicant: ApplicantSchema,
  incident: IncidentSchema,
  documents: DocumentsSchema.optional(),
}).superRefine((data, ctx) => {
    const { applicant_type, relationship_degree } = data.applicant;
    const uploadedDocs = Object.keys(data.documents ?? {});

    let requiredDocs: RequiredDocument[] = [];

    if (applicant_type === "PATIENT") {
      requiredDocs = [...REQUIRED_DOCUMENTS.PATIENT.default];
    }

    if (applicant_type === "REPRESENTATIVE" && relationship_degree) {
      requiredDocs = [
        ...REQUIRED_DOCUMENTS.REPRESENTATIVE[relationship_degree],
      ];
    }

    // 🔴 REGRA NOVA: Óbito sempre exige certidão de óbito
    if (data.purpose === "OBITO") {
      if (!requiredDocs.includes("DEATH_CERTIFICATE")) {
        requiredDocs.push("DEATH_CERTIFICATE");
      }
    }

    const missingDocs = requiredDocs.filter(
      (doc) => !uploadedDocs.includes(doc)
    );

    if (missingDocs.length) {
      missingDocs.forEach((doc) => {
        ctx.addIssue({
          path: ["documents", doc],
          message: "Documento obrigatório",
          code: z.ZodIssueCode.custom,
        });
      });
    }
  });


// labels

export const APPLICANT_TYPE_LABELS: Record<
  (typeof APPLICANT_TYPES)[number],
  string
> = {
  PATIENT: "Paciente",
  REPRESENTATIVE: "Representante",
};

export const RELATIONSHIP_DEGREE_LABELS: Record<
  (typeof RELATIONSHIP_DEGREES)[number],
  string
> = {
  FAMILY: "Familiar",
  SPOUSE: "Cônjuge",
  ATTORNEY: "Procurador",
};

export const LOCATION_LABELS: Record<(typeof ATTENDANCE_LOCATIONS)[number],
string> = {
  RES: "Residência",
  PUB: "Local Público",
  OTH: "Outro",
};

export const DOCUMENT_LABELS: Record<(typeof DOCUMENT_TYPES)[number],
string> = {
  PATIENT_ID: "Documento Paciente",
  APPLICANT_ID: "Documento Solicitante",
  MARRIAGE_CERTIFICATE: "Certidão Casamento / União estável",
  POWER_OF_ATTORNEY: "Procuração específica",
  DEATH_CERTIFICATE: "Certidão de Óbito"
};

export type RequiredDocument =
  | "PATIENT_ID"
  | "APPLICANT_ID"
  | "MARRIAGE_CERTIFICATE"
  | "POWER_OF_ATTORNEY"
  | "DEATH_CERTIFICATE";


export type DocumentFormData = z.infer<typeof DocumentSchema>;
export type Applicant = z.infer<typeof ApplicantSchema>;
export type Incident = z.infer<typeof IncidentSchema>;
