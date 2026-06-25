import os
from django.test import TestCase, override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
import tempfile
import shutil

from applicant.models import Applicant
from applicant_document.models import DocumentType
from applicant_document.serializers import ApplicantDocumentRequestSerializer
from document_request.models import DocumentRequest

# Purpose padrão usada nos testes que não testam a finalidade em si
_PURPOSE = DocumentRequest.Purpose.DPVAT


TEMP_MEDIA_ROOT = tempfile.mkdtemp()

# Bytes mágicos mínimos válidos para cada extensão suportada
_MAGIC = {
    ".jpg":  b"\xff\xd8\xff\xe0" + b"\x00" * 16,
    ".jpeg": b"\xff\xd8\xff\xe0" + b"\x00" * 16,
    ".png":  b"\x89PNG\r\n\x1a\n" + b"\x00" * 12,
    ".pdf":  b"%PDF-1.4\n"        + b"\x00" * 11,
}


def tearDownModule():
    shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class ApplicantDocumentRequestSerializerTest(TestCase):

    def get_test_file(self, name="doc.jpg"):
        ext = os.path.splitext(name)[1].lower()
        content = _MAGIC.get(ext, _MAGIC[".jpg"])
        return SimpleUploadedFile(name=name, content=content, content_type="image/jpeg")

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
            context={"applicant_type": Applicant.ApplicantType.PATIENT, "purpose": _PURPOSE}
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
                "relationship_degree": Applicant.RelationshipDegree.FAMILY,
                "purpose": _PURPOSE,
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
                "relationship_degree": Applicant.RelationshipDegree.SPOUSE,
                "purpose": _PURPOSE,
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
                "relationship_degree": Applicant.RelationshipDegree.ATTORNEY,
                "purpose": _PURPOSE,
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
                "applicant_type": Applicant.ApplicantType.REPRESENTATIVE,
                "purpose": _PURPOSE,
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
            context={"applicant_type": Applicant.ApplicantType.PATIENT, "purpose": _PURPOSE}
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
            context={"applicant_type": Applicant.ApplicantType.PATIENT, "purpose": _PURPOSE}
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
            context={"applicant_type": Applicant.ApplicantType.PATIENT, "purpose": _PURPOSE}
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
            context={"applicant_type": Applicant.ApplicantType.PATIENT, "purpose": _PURPOSE}
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
                "relationship_degree": Applicant.RelationshipDegree.FAMILY,
                "purpose": _PURPOSE,
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
            context={"applicant_type": Applicant.ApplicantType.PATIENT, "purpose": _PURPOSE}
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
                "relationship_degree": Applicant.RelationshipDegree.SPOUSE,
                "purpose": _PURPOSE,
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
            context={"applicant_type": Applicant.ApplicantType.PATIENT, "purpose": _PURPOSE}
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
            context={"applicant_type": Applicant.ApplicantType.PATIENT, "purpose": _PURPOSE}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("não permitido", str(serializer.errors))

    # =========================
    # 🔒 VALIDAÇÃO DE UPLOAD
    # =========================

    def test_invalid_extension(self):
        """Extensão fora da allowlist deve ser rejeitada."""
        data = {
            "files": [SimpleUploadedFile("doc.exe", b"MZ\x00\x00", content_type="application/octet-stream")],
            "types": [DocumentType.PATIENT_ID],
        }
        serializer = ApplicantDocumentRequestSerializer(
            data=data,
            context={"applicant_type": Applicant.ApplicantType.PATIENT, "purpose": _PURPOSE}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("não permitido", str(serializer.errors))

    def test_file_too_large(self):
        """Arquivo acima de 10 MB deve ser rejeitado."""
        large_content = _MAGIC[".jpg"] + b"\x00" * (10 * 1024 * 1024)
        data = {
            "files": [SimpleUploadedFile("doc.jpg", large_content, content_type="image/jpeg")],
            "types": [DocumentType.PATIENT_ID],
        }
        serializer = ApplicantDocumentRequestSerializer(
            data=data,
            context={"applicant_type": Applicant.ApplicantType.PATIENT, "purpose": _PURPOSE}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("tamanho máximo", str(serializer.errors))

    def test_wrong_magic_bytes(self):
        """Extensão .jpg com conteúdo de executável deve ser rejeitada."""
        data = {
            "files": [SimpleUploadedFile("malware.jpg", b"MZ\x00\x00fake", content_type="image/jpeg")],
            "types": [DocumentType.PATIENT_ID],
        }
        serializer = ApplicantDocumentRequestSerializer(
            data=data,
            context={"applicant_type": Applicant.ApplicantType.PATIENT, "purpose": _PURPOSE}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("não corresponde", str(serializer.errors))