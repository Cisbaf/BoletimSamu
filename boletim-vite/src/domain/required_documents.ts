import { REQUIRED_DOCUMENTS } from "./documentSchemaForm";
import type { RequiredDocument } from "./documentSchemaForm";

export function getRequiredDocuments(
  applicantType?: string,
  relationship?: string
): readonly RequiredDocument[] {
  if (applicantType === "PATIENT") {
    return ["PATIENT_ID"];
  }

  if (applicantType === "REPRESENTATIVE" && relationship) {
    return REQUIRED_DOCUMENTS.REPRESENTATIVE[
      relationship as keyof typeof REQUIRED_DOCUMENTS.REPRESENTATIVE
    ];
  }

  return [];
}
