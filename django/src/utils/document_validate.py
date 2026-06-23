from applicant.models import Applicant
from applicant_document.models import DocumentType

# Dicionário de documentos obrigatórios por tipo de solicitante e parentesco.
# NUNCA mute estas listas diretamente — get_required_docs sempre retorna cópias.
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
    """
    Retorna a lista de documentos obrigatórios para o tipo de solicitante e finalidade.

    Sempre retorna uma *cópia* da lista base — nunca uma referência ao dicionário
    de módulo. Isso impede que lógicas condicionais (ex: acréscimo da certidão de
    óbito) contaminem as listas originais entre requisições distintas.

    O `purpose` é comparado contra o enum `DocumentRequest.Purpose` para evitar
    acoplamento a strings literais.
    """
    # Importação lazy para evitar importação circular durante o load do Django.
    from document_request.models import DocumentRequest

    if applicant_type == Applicant.ApplicantType.PATIENT:
        return list(REQUIRED_DOCUMENTS_BY_TYPE[Applicant.ApplicantType.PATIENT])

    if applicant_type == Applicant.ApplicantType.REPRESENTATIVE:
        docs = list(
            REQUIRED_DOCUMENTS_BY_TYPE[Applicant.ApplicantType.REPRESENTATIVE][relationship_degree]
        )
        if purpose == DocumentRequest.Purpose.OBITO:
            docs.append(DocumentType.DEATH_CERTIFICATE)
        return docs

    return []
