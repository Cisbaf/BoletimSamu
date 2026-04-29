from applicant.models import Applicant
from applicant_document.models import DocumentType

REQUIRED_DOCUMENTS_BY_TYPE = {
    Applicant.ApplicantType.PATIENT: [
        DocumentType.PATIENT_ID,
    ],
    Applicant.ApplicantType.REPRESENTATIVE: {
        Applicant.RelationshipDegree.FAMILY: [
            DocumentType.PATIENT_ID,
            DocumentType.APPLICANT_ID,
        ],
        Applicant.RelationshipDegree.SPOUSE: [
            DocumentType.PATIENT_ID,
            DocumentType.APPLICANT_ID,
            DocumentType.MARRIAGE_CERTIFICATE,
        ],
        Applicant.RelationshipDegree.ATTORNEY: [
            DocumentType.PATIENT_ID,
            DocumentType.APPLICANT_ID,
            DocumentType.POWER_OF_ATTORNEY,
        ],
    }
}
def get_required_docs(applicant_type, purpose, relationship_degree=None):
    if applicant_type == Applicant.ApplicantType.PATIENT:
        return REQUIRED_DOCUMENTS_BY_TYPE[Applicant.ApplicantType.PATIENT]

    if applicant_type == Applicant.ApplicantType.REPRESENTATIVE:
        docs = REQUIRED_DOCUMENTS_BY_TYPE[Applicant.ApplicantType.REPRESENTATIVE][relationship_degree]
        if purpose == "OBITO":
            docs.append(DocumentType.DEATH_CERTIFICATE)
        return docs

    return []
