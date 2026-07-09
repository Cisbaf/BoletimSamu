/* =========================
 * RESPONSE (backend)
 * ========================= */

import type { APPLICANT_TYPES, DOCUMENT_TYPES, RELATIONSHIP_DEGREES } from "./documentSchemaForm";

export interface DocumentDetail {
  id: number;
  applicant: ApplicantResponse;
  incident: IncidentResponse;
  status: Status[];
  rectifications: Rectification[];
  documents: DocumentFile[];
  protocol: string;
  purpose: string;
  otherPurpose: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ApplicantType = (typeof APPLICANT_TYPES)[number];
export type RelationshipDegree = (typeof RELATIONSHIP_DEGREES)[number];


export interface ApplicantResponse {
  id: number;
  applicantType: ApplicantType;
  relationshipDegree: RelationshipDegree | null;
  fullName: string;
  cpf: string;
  rg: string;
  email: string;
  address: string;
  phone: string;
}

export interface IncidentResponse {
  id: number;
  date: string;
  time: string;
  patientName: string;
  city: string;
  neighborhood: string;
  address: string;
  reason: string;
  attendanceLocation: string;
  otherLocationDescription: string | null;
  occurrenceNumber: string | null;
  notes: string | null;
}

export interface Status {
  id: number;
  comment: string | null;
  status: "aguardando" | "confirmado" | "cancelado";
  userName?: string;
  createdAt: string;
}

/* =========================
 * RETIFICAÇÃO
 * ========================= */

export type RectificationStatusValue =
  | "solicitada"
  | "agendada"
  | "concluida"
  | "cancelada";

export interface RectificationStatus {
  id: number;
  comment: string | null;
  status: RectificationStatusValue;
  userName?: string;
  createdAt: string;
}

export interface Rectification {
  id: number;
  document: number;
  status: RectificationStatus[];
  createdAt: string;
}

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface DocumentFile {
  id: number;
  documentType: DocumentType;
  fileUrl: string;
}