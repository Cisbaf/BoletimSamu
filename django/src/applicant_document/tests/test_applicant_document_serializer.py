from django.test import TestCase, override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
import tempfile
import shutil

from applicant.models import Applicant
from applicant_document.models import DocumentType
from applicant_document.serializers import ApplicantDocumentRequestSerializer


TEMP_MEDIA_ROOT = tempfile.mkdtemp()


def tearDownModule():
    shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class ApplicantDocumentRequestSerializerTest(TestCase):

    def get_test_file(self, name="doc.jpg"):
        return SimpleUploadedFile(
            name=name,
            content=b"fake_image_content",
            content_type="image/jpeg"
        )

    # =========================
    # ✅ CENÁRIOS VÁLIDOS
    # =========================

    def test_patient_valid(self):
        data = {
            "files": [self.get_test_file()],
            "types": [DocumentType.PATIENT_ID],
        }

        serializer = ApplicantDocumentRequestSerializer(
            data=data,
            context={"applicant_type": Applicant.ApplicantType.PATIENT}
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_representative_family_valid(self):
        data = {
            "files": [self.get_test_file(), self.get_test_file()],
            "types": [
                DocumentType.PATIENT_ID,
                DocumentType.APPLICANT_ID
            ],
        }

        serializer = ApplicantDocumentRequestSerializer(
            data=data,
            context={
                "applicant_type": Applicant.ApplicantType.REPRESENTATIVE,
                "relationship_degree": Applicant.RelationshipDegree.FAMILY
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_representative_spouse_valid(self):
        data = {
            "files": [
                self.get_test_file(),
                self.get_test_file(),
                self.get_test_file()
            ],
            "types": [
                DocumentType.PATIENT_ID,
                DocumentType.APPLICANT_ID,
                DocumentType.MARRIAGE_CERTIFICATE
            ],
        }

        serializer = ApplicantDocumentRequestSerializer(
            data=data,
            context={
                "applicant_type": Applicant.ApplicantType.REPRESENTATIVE,
                "relationship_degree": Applicant.RelationshipDegree.SPOUSE
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_representative_attorney_valid(self):
        data = {
            "files": [
                self.get_test_file(),
                self.get_test_file(),
                self.get_test_file()
            ],
            "types": [
                DocumentType.PATIENT_ID,
                DocumentType.APPLICANT_ID,
                DocumentType.POWER_OF_ATTORNEY
            ],
        }

        serializer = ApplicantDocumentRequestSerializer(
            data=data,
            context={
                "applicant_type": Applicant.ApplicantType.REPRESENTATIVE,
                "relationship_degree": Applicant.RelationshipDegree.ATTORNEY
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    # =========================
    # ❌ ERROS DE CONTEXT
    # =========================

    def test_missing_applicant_type(self):
        data = {
            "files": [self.get_test_file()],
            "types": [DocumentType.PATIENT_ID],
        }

        serializer = ApplicantDocumentRequestSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("Tipo de solicitante", str(serializer.errors))

    def test_representative_missing_relationship(self):
        data = {
            "files": [self.get_test_file(), self.get_test_file()],
            "types": [
                DocumentType.PATIENT_ID,
                DocumentType.APPLICANT_ID
            ],
        }

        serializer = ApplicantDocumentRequestSerializer(
            data=data,
            context={
                "applicant_type": Applicant.ApplicantType.REPRESENTATIVE
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("Parentesco é obrigatório", str(serializer.errors))

    # =========================
    # ❌ QUANTIDADE
    # =========================

    def test_files_types_mismatch_more_types(self):
        data = {
            "files": [self.get_test_file()],
            "types": [
                DocumentType.PATIENT_ID,
                DocumentType.APPLICANT_ID
            ],
        }

        serializer = ApplicantDocumentRequestSerializer(
            data=data,
            context={"applicant_type": Applicant.ApplicantType.PATIENT}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("Quantidade de arquivos", str(serializer.errors))

    def test_files_types_mismatch_more_files(self):
        data = {
            "files": [self.get_test_file(), self.get_test_file()],
            "types": [DocumentType.PATIENT_ID],
        }

        serializer = ApplicantDocumentRequestSerializer(
            data=data,
            context={"applicant_type": Applicant.ApplicantType.PATIENT}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("Quantidade de arquivos", str(serializer.errors))

    # =========================
    # ❌ DUPLICIDADE
    # =========================

    def test_duplicate_types(self):
        data = {
            "files": [self.get_test_file(), self.get_test_file()],
            "types": [
                DocumentType.PATIENT_ID,
                DocumentType.PATIENT_ID
            ],
        }

        serializer = ApplicantDocumentRequestSerializer(
            data=data,
            context={"applicant_type": Applicant.ApplicantType.PATIENT}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("duplicados", str(serializer.errors))

    # =========================
    # ❌ DOCUMENTOS INVÁLIDOS
    # =========================

    def test_invalid_document_for_patient(self):
        data = {
            "files": [self.get_test_file()],
            "types": [DocumentType.APPLICANT_ID],
        }

        serializer = ApplicantDocumentRequestSerializer(
            data=data,
            context={"applicant_type": Applicant.ApplicantType.PATIENT}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("não permitido", str(serializer.errors))

    def test_invalid_document_for_family(self):
        data = {
            "files": [self.get_test_file(), self.get_test_file()],
            "types": [
                DocumentType.PATIENT_ID,
                DocumentType.MARRIAGE_CERTIFICATE  # inválido
            ],
        }

        serializer = ApplicantDocumentRequestSerializer(
            data=data,
            context={
                "applicant_type": Applicant.ApplicantType.REPRESENTATIVE,
                "relationship_degree": Applicant.RelationshipDegree.FAMILY
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("não permitido", str(serializer.errors))

    # =========================
    # ❌ DOCUMENTOS FALTANDO
    # =========================

    def test_missing_required_patient_doc(self):
        data = {
            "files": [],
            "types": [],
        }

        serializer = ApplicantDocumentRequestSerializer(
            data=data,
            context={"applicant_type": Applicant.ApplicantType.PATIENT}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("Faltam documentos", str(serializer.errors))

    def test_missing_required_spouse_doc(self):
        data = {
            "files": [
                self.get_test_file(),
                self.get_test_file()
            ],
            "types": [
                DocumentType.PATIENT_ID,
                DocumentType.APPLICANT_ID
            ],
        }

        serializer = ApplicantDocumentRequestSerializer(
            data=data,
            context={
                "applicant_type": Applicant.ApplicantType.REPRESENTATIVE,
                "relationship_degree": Applicant.RelationshipDegree.SPOUSE
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("Faltam documentos", str(serializer.errors))

    # =========================
    # 🔀 EDGE CASES
    # =========================

    def test_empty_lists_patient(self):
        data = {
            "files": [],
            "types": [],
        }

        serializer = ApplicantDocumentRequestSerializer(
            data=data,
            context={"applicant_type": Applicant.ApplicantType.PATIENT}
        )

        self.assertFalse(serializer.is_valid())

    def test_extra_document_not_allowed(self):
        data = {
            "files": [
                self.get_test_file(),
                self.get_test_file()
            ],
            "types": [
                DocumentType.PATIENT_ID,
                DocumentType.APPLICANT_ID  # extra para paciente
            ],
        }

        serializer = ApplicantDocumentRequestSerializer(
            data=data,
            context={"applicant_type": Applicant.ApplicantType.PATIENT}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("não permitido", str(serializer.errors))