import { REQUIRED_DOCUMENTS } from "./documentSchemaForm";
import type { RequiredDocument } from "./documentSchemaForm";

export function getRequiredDocuments(
  applicantType?: string,
  relationship?: string,
  purpose?: string,
): readonly RequiredDocument[] {
  let docs: RequiredDocument[] = [];

  if (applicantType === "PATIENT") {
    docs = [...REQUIRED_DOCUMENTS.PATIENT.default];
  }

  if (applicantType === "REPRESENTATIVE" && relationship) {
    docs = [
      ...REQUIRED_DOCUMENTS.REPRESENTATIVE[
        relationship as keyof typeof REQUIRED_DOCUMENTS.REPRESENTATIVE
      ],
    ];
  }

  // adiciona certidão de óbito se necessário
  if (purpose === "OBITO" && !docs.includes("DEATH_CERTIFICATE")) {
    docs.push("DEATH_CERTIFICATE");
  }

  return docs;
}