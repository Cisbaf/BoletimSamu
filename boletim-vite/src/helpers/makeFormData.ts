import type { DocumentFormData } from "../domain/documentSchemaForm";



export default function MakeFormData(data: DocumentFormData) {
    const formData = new FormData();

    formData.append("applicant", JSON.stringify(data.applicant));
    formData.append("incident", JSON.stringify(data.incident));
    formData.append("purpose", data.purpose);
    if (data.other_purpose) formData.append("other_purpose", data.other_purpose);

    if (data.documents) {
        Object.entries(data.documents).forEach(([type, file]) => {
        if (!file) return;

        formData.append("documents", file);
        formData.append("document_types", type);
        });
    }

    return formData;
}