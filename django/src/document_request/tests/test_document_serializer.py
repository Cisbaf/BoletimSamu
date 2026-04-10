from django.test import TestCase
from ..serializers import DocumentRequestSerializer
from django.core.files.uploadedfile import SimpleUploadedFile
import tempfile
import shutil
from django.test import override_settings

TEMP_MEDIA_ROOT = tempfile.mkdtemp()

def tearDownModule():
    shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)

@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class DocumentRequestSerializerTest(TestCase):
    """
    Testes do DocumentRequestSerializer.

    Valida o comportamento do serializer responsável por criar uma
    solicitação completa de documentos com solicitante, ocorrência
    e arquivos anexados.

    Cenários cobertos:
    - Fluxo válido para paciente com documentos obrigatórios
    - Falha quando documentos obrigatórios não são enviados
    - Falha ao enviar tipo de documento não permitido para o perfil do solicitante
    - Falha quando a quantidade de arquivos difere da quantidade de tipos informados
    - Fluxo válido para representante familiar com múltiplos documentos exigidos
    - Falha quando representante não envia documento obrigatório do paciente

    Os testes garantem que as regras de negócio de validação de documentos
    estão sendo corretamente aplicadas antes da criação dos registros.
    """

    def get_test_file(self, name="doc.jpg"):
        return SimpleUploadedFile(
            name=name,
            content=b"fake_image_content",
            content_type="image/jpeg"
        )

    # -------------------------------------------------
    # 🔧 DADOS BASE VÁLIDOS (PACIENTE)
    # -------------------------------------------------
    def get_valid_document_data(self):
        return {
            "purpose": "DPVAT",
            "applicant": {
                "applicant_type": "PATIENT",
                "full_name": "João da Silva",
                "cpf": "187.149.337-48",
                "rg": "287557672",
                "email": "joao.silva@email.com",
                "address": "Rua A, 123 - Centro - São Paulo/SP",
                "phone": "(11) 99999-9999"
            },
            "incident": {
                "date": "2026-01-29",
                "time": "14:35:00",
                "patient_name": "Maria da Silva",
                "city": "NOVA IGUAÇU",
                "neighborhood": "Centro",
                "address": "Rua Doutor Barros Júnior, 245",
                "reason": "Queda com possível fratura",
                "attendance_location": "OTH",
                "other_location_description": "Estabelecimento comercial",
                "occurrence_number": "OC-2026-000123",
                "notes": "Paciente consciente, relatando dor intensa na perna direita."
            },
            "documents": [self.get_test_file("paciente.jpg")],
            "document_types": ["PATIENT_ID"]
        }

    # -------------------------------------------------
    # ✅ CASO VÁLIDO — DOCUMENTO
    # -------------------------------------------------
    def test_serializer_valid_document(self):
        serializer = DocumentRequestSerializer(data=self.get_valid_document_data())
        self.assertTrue(serializer.is_valid(), serializer.errors)

        document = serializer.save()

        self.assertEqual(document.applicant.documents.count(), 1)
        self.assertEqual(
            document.applicant.documents.first().document_type,
            "PATIENT_ID"
        )

    def test_missing_required_document(self):
        data = self.get_valid_document_data()
        data["documents"] = []
        data["document_types"] = []

        serializer = DocumentRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("Faltam documentos obrigatórios", str(serializer.errors))

    def test_invalid_document_type_for_patient(self):
        data = self.get_valid_document_data()
        data["document_types"] = ["POWER_OF_ATTORNEY"]

        serializer = DocumentRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("não permitido", str(serializer.errors))

    def test_documents_and_types_length_mismatch(self):
        data = self.get_valid_document_data()
        data["documents"] = [self.get_test_file("1.jpg"), self.get_test_file("2.jpg")]
        data["document_types"] = ["PATIENT_ID"]

        serializer = DocumentRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("Quantidade de arquivos diferente", str(serializer.errors))

    def test_valid_family_representative_documents(self):
        data = self.get_valid_document_data()
        data["applicant"]["applicant_type"] = "REPRESENTATIVE"
        data["applicant"]["relationship_degree"] = "FAMILY"

        data["documents"] = [
            self.get_test_file("paciente.jpg"),
            self.get_test_file("responsavel.jpg"),
        ]
        data["document_types"] = ["PATIENT_ID", "APPLICANT_ID"]

        serializer = DocumentRequestSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_representative_missing_patient_id(self):
        data = self.get_valid_document_data()
        data["applicant"]["applicant_type"] = "REPRESENTATIVE"
        data["applicant"]["relationship_degree"] = "FAMILY"

        data["documents"] = [self.get_test_file("responsavel.jpg")]
        data["document_types"] = ["APPLICANT_ID"]

        serializer = DocumentRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("Faltam documentos obrigatórios", str(serializer.errors))
