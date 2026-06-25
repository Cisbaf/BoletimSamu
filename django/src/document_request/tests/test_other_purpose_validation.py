"""
Testes de validação de other_purpose na API (P0.3).

Garante que a regra definida em DocumentRequest.clean() também é aplicada
na criação via API — onde objects.create() não chama full_clean() automaticamente.

Regras cobertas:
- Finalidade OUTROS exige other_purpose preenchido
- Finalidade OUTROS com other_purpose vazio/em branco → 400
- Outras finalidades com other_purpose preenchido → 400
- Fluxo feliz: OUTROS + other_purpose → 201
- Fluxo feliz: finalidade normal sem other_purpose → 201 (regressão)
"""
import json
import tempfile
import shutil

from django.urls import reverse
from django.test import override_settings
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from document_request.models import DocumentRequest

TEMP_MEDIA_ROOT = tempfile.mkdtemp()


def tearDownModule():
    shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)


_JPEG_HEADER = b"\xff\xd8\xff\xe0" + b"\x00" * 16


def get_test_file():
    return SimpleUploadedFile("doc.jpg", _JPEG_HEADER, content_type="image/jpeg")


def base_payload(**overrides):
    payload = {
        "purpose": "DPVAT",
        "applicant": json.dumps({
            "applicant_type": "PATIENT",
            "full_name": "João da Silva",
            "cpf": "187.149.337-48",
            "rg": "287557672",
            "email": "joao@email.com",
            "address": "Rua A, 123",
            "phone": "11999999999",
        }),
        "incident": json.dumps({
            "date": "2026-01-29",
            "time": "14:35:00",
            "patient_name": "Maria da Silva",
            "city": "NOVA IGUAÇU",
            "neighborhood": "Centro",
            "address": "Rua X",
            "reason": "Queda",
            "attendance_location": "OTH",
            "other_location_description": "Loja",
            "occurrence_number": "OC-123",
            "notes": "",
        }),
        "document_types": ["PATIENT_ID"],
        "documents": [get_test_file()],
    }
    payload.update(overrides)
    return payload


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class OtherPurposeValidationAPITest(APITestCase):

    def setUp(self):
        cache.clear()
        self.url = reverse("document-request-create")

    # ------------------------------------------------------------------
    # Casos de erro
    # ------------------------------------------------------------------

    def test_outros_sem_other_purpose_retorna_400(self):
        """OUTROS sem other_purpose deve ser rejeitado."""
        payload = base_payload(purpose="OUTROS")
        response = self.client.post(self.url, payload, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertIn("other_purpose", response.data)

    def test_outros_com_other_purpose_em_branco_retorna_400(self):
        """OUTROS com other_purpose em branco (só espaços) deve ser rejeitado."""
        payload = base_payload(purpose="OUTROS", other_purpose="   ")
        response = self.client.post(self.url, payload, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertIn("other_purpose", response.data)

    def test_finalidade_normal_com_other_purpose_preenchido_retorna_400(self):
        """Finalidades que não são OUTROS não devem aceitar other_purpose."""
        payload = base_payload(purpose="DPVAT", other_purpose="Algo indevido")
        response = self.client.post(self.url, payload, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertIn("other_purpose", response.data)

    # ------------------------------------------------------------------
    # Casos de sucesso
    # ------------------------------------------------------------------

    def test_outros_com_other_purpose_valido_retorna_201(self):
        """OUTROS + other_purpose preenchido deve criar o pedido."""
        payload = base_payload(purpose="OUTROS", other_purpose="Processo trabalhista")
        response = self.client.post(self.url, payload, format="multipart")

        self.assertEqual(response.status_code, 201)
        self.assertIn("protocol", response.data)

        doc = DocumentRequest.objects.get(protocol=response.data["protocol"])
        self.assertEqual(doc.purpose, DocumentRequest.Purpose.OUTROS)
        self.assertEqual(doc.other_purpose, "Processo trabalhista")

    def test_finalidade_normal_sem_other_purpose_retorna_201(self):
        """Regressão: criação normal (sem other_purpose) continua funcionando."""
        payload = base_payload(purpose="DPVAT")
        response = self.client.post(self.url, payload, format="multipart")

        self.assertEqual(response.status_code, 201)
        self.assertIn("protocol", response.data)
