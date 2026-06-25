from django.test import TestCase
from ..serializers import DocumentRequestSerializer, DocumentSimpleDetailSerializer
from ..models import DocumentRequest
from django.core.files.uploadedfile import SimpleUploadedFile
import tempfile
import shutil
from django.test import override_settings

TEMP_MEDIA_ROOT = tempfile.mkdtemp()

def tearDownModule():
    shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)

@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class DocumentSimpleDetailSerializerTest(TestCase):
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

    _JPEG_HEADER = b"\xff\xd8\xff\xe0" + b"\x00" * 16

    def get_test_file(self, name="doc.jpg"):
        return SimpleUploadedFile(name=name, content=self._JPEG_HEADER, content_type="image/jpeg")

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

        serializer_detail = DocumentSimpleDetailSerializer(document)

