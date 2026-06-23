"""
Testes unitários de get_required_docs (utils/document_validate.py).

Foco no bug P0.2: a função mutava a lista base do dicionário de módulo,
contaminando chamadas subsequentes. Após a correção, cada chamada deve
retornar uma cópia independente, e o dicionário de módulo deve permanecer
intacto entre requisições.
"""
from django.test import TestCase

from applicant.models import Applicant
from applicant_document.models import DocumentType
from document_request.models import DocumentRequest
from utils.document_validate import REQUIRED_DOCUMENTS_BY_TYPE, get_required_docs


class GetRequiredDocsIsolationTest(TestCase):
    """Garante que chamadas não contaminam o estado compartilhado."""

    def test_obito_nao_contamina_lista_de_family(self):
        """
        Bug original: a primeira chamada com purpose=OBITO acrescentava
        DEATH_CERTIFICATE à lista base de FAMILY, fazendo chamadas normais
        subsequentes exigirem a certidão de óbito indevidamente.
        """
        family = Applicant.RelationshipDegree.FAMILY

        # Chamada com óbito — deve incluir DEATH_CERTIFICATE
        docs_obito = get_required_docs(
            Applicant.ApplicantType.REPRESENTATIVE,
            DocumentRequest.Purpose.OBITO,
            family,
        )
        self.assertIn(DocumentType.DEATH_CERTIFICATE, docs_obito)

        # Chamada normal após óbito — NÃO deve incluir DEATH_CERTIFICATE
        docs_normal = get_required_docs(
            Applicant.ApplicantType.REPRESENTATIVE,
            DocumentRequest.Purpose.DPVAT,
            family,
        )
        self.assertNotIn(DocumentType.DEATH_CERTIFICATE, docs_normal)

    def test_multiplas_chamadas_obito_nao_acumulam_death_certificate(self):
        """
        Bug original: cada chamada com OBITO fazia mais um append,
        acumulando duplicatas na lista base.
        """
        family = Applicant.RelationshipDegree.FAMILY

        for _ in range(3):
            docs = get_required_docs(
                Applicant.ApplicantType.REPRESENTATIVE,
                DocumentRequest.Purpose.OBITO,
                family,
            )

        self.assertEqual(
            docs.count(DocumentType.DEATH_CERTIFICATE),
            1,
            "DEATH_CERTIFICATE deve aparecer exatamente uma vez, mesmo após múltiplas chamadas.",
        )

    def test_lista_base_do_modulo_nao_e_mutada(self):
        """A lista original no REQUIRED_DOCUMENTS_BY_TYPE nunca deve ser alterada."""
        family = Applicant.RelationshipDegree.FAMILY
        original = list(
            REQUIRED_DOCUMENTS_BY_TYPE[Applicant.ApplicantType.REPRESENTATIVE][family]
        )

        get_required_docs(
            Applicant.ApplicantType.REPRESENTATIVE,
            DocumentRequest.Purpose.OBITO,
            family,
        )

        atual = REQUIRED_DOCUMENTS_BY_TYPE[Applicant.ApplicantType.REPRESENTATIVE][family]
        self.assertEqual(original, list(atual), "A lista base foi mutada — isso é um bug.")

    def test_retorno_e_copia_independente(self):
        """Mutações no retorno não devem afetar chamadas futuras."""
        docs = get_required_docs(
            Applicant.ApplicantType.PATIENT,
            DocumentRequest.Purpose.DPVAT,
        )
        docs.append("CONTAMINACAO")

        docs2 = get_required_docs(
            Applicant.ApplicantType.PATIENT,
            DocumentRequest.Purpose.DPVAT,
        )
        self.assertNotIn("CONTAMINACAO", docs2)


class GetRequiredDocsCorretnessTest(TestCase):
    """Garante que os documentos retornados são os corretos para cada perfil."""

    def test_paciente_exige_apenas_patient_id(self):
        docs = get_required_docs(
            Applicant.ApplicantType.PATIENT,
            DocumentRequest.Purpose.DPVAT,
        )
        self.assertEqual(set(docs), {DocumentType.PATIENT_ID})

    def test_representante_familiar_sem_obito(self):
        docs = get_required_docs(
            Applicant.ApplicantType.REPRESENTATIVE,
            DocumentRequest.Purpose.INSS,
            Applicant.RelationshipDegree.FAMILY,
        )
        self.assertEqual(
            set(docs),
            {DocumentType.PATIENT_ID, DocumentType.APPLICANT_ID},
        )

    def test_representante_familiar_com_obito(self):
        docs = get_required_docs(
            Applicant.ApplicantType.REPRESENTATIVE,
            DocumentRequest.Purpose.OBITO,
            Applicant.RelationshipDegree.FAMILY,
        )
        self.assertEqual(
            set(docs),
            {DocumentType.PATIENT_ID, DocumentType.APPLICANT_ID, DocumentType.DEATH_CERTIFICATE},
        )

    def test_representante_conjuge_sem_obito(self):
        docs = get_required_docs(
            Applicant.ApplicantType.REPRESENTATIVE,
            DocumentRequest.Purpose.SEGURO,
            Applicant.RelationshipDegree.SPOUSE,
        )
        self.assertEqual(
            set(docs),
            {DocumentType.PATIENT_ID, DocumentType.APPLICANT_ID, DocumentType.MARRIAGE_CERTIFICATE},
        )

    def test_representante_conjuge_com_obito(self):
        docs = get_required_docs(
            Applicant.ApplicantType.REPRESENTATIVE,
            DocumentRequest.Purpose.OBITO,
            Applicant.RelationshipDegree.SPOUSE,
        )
        self.assertIn(DocumentType.DEATH_CERTIFICATE, docs)
        self.assertIn(DocumentType.MARRIAGE_CERTIFICATE, docs)

    def test_representante_procurador_sem_obito(self):
        docs = get_required_docs(
            Applicant.ApplicantType.REPRESENTATIVE,
            DocumentRequest.Purpose.ACAO_JUDICIAL,
            Applicant.RelationshipDegree.ATTORNEY,
        )
        self.assertEqual(
            set(docs),
            {DocumentType.PATIENT_ID, DocumentType.APPLICANT_ID, DocumentType.POWER_OF_ATTORNEY},
        )

    def test_tipo_invalido_retorna_lista_vazia(self):
        docs = get_required_docs("TIPO_DESCONHECIDO", DocumentRequest.Purpose.DPVAT)
        self.assertEqual(docs, [])
