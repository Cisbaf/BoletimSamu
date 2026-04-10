import json
import tempfile
import shutil
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from django.test import override_settings
from rest_framework.test import APITestCase
from ..models import DocumentRequest
from incident.models import Incident
from applicant.models import Applicant
from applicant_document.models import ApplicantDocument
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from random import random

TEMP_MEDIA_ROOT = tempfile.mkdtemp()

def tearDownModule():
    shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class DocumentRequestDetailAPITest(APITestCase):
    """
    Testes da API de consulta de solicitações de documentos.
    """

    def get_results(self, response):
        """
        Helper para suportar respostas com ou sem paginação
        """
        return response.data.get("results", response.data)

    def create_request(self, cpf="18714933748", name="João da Silva", purpose="DPVAT"):
        payload = get_valid_payload()

        applicant = json.loads(payload["applicant"])
        applicant["cpf"] = cpf
        applicant["full_name"] = name
        payload["applicant"] = json.dumps(applicant)
        payload["purpose"] = purpose

        return self.client.post(
            reverse("document-request-create"),
            data=payload,
            format="multipart"
        )

    def setUp(self):
        self.create_request(cpf="071.933.690-24", name="João da Silva", purpose="DPVAT")
        self.create_request(cpf="625.282.560-35", name="Maria Oliveira", purpose="SEGURO")
        self.create_request(cpf="842.410.380-77", name="Carlos Souza", purpose="DPVAT")

        self.list_url = reverse("admin-requests-list")
        refresh = RefreshToken.for_user(User.objects.create(
            username=str(int(random() * 1000000))
        ))
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    

    def test_list_default(self):
        response = self.client.get(self.list_url)
    
        results = self.get_results(response)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 3)
        self.assertEqual(len(results), 3)


    def test_filter_by_cpf(self):
        response = self.client.get(self.list_url, {"applicant__cpf": "07193369024"})
        results = self.get_results(response)

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["applicant"]["cpf"], "07193369024")

    def test_search_by_name(self):
        response = self.client.get(self.list_url, {"search": "Maria"})
        results = self.get_results(response)

        self.assertEqual(len(results), 1)
        self.assertIn("Maria", results[0]["applicant"]["full_name"])

    def test_filter_created_at_gte(self):
        today = timezone.now().date().isoformat()
        response = self.client.get(self.list_url, {"created_at__gte": today})
        results = self.get_results(response)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(results) >= 1)

    def test_ordering_by_created_at(self):
        response = self.client.get(self.list_url, {"ordering": "created_at"})
        results = self.get_results(response)

        self.assertEqual(response.status_code, 200)
    
        dates = [item["created_at"] for item in results]
        self.assertEqual(dates, sorted(dates))

    def test_ordering_desc(self):
        response = self.client.get(self.list_url, {"ordering": "-created_at"})
        results = self.get_results(response)

        dates = [item["created_at"] for item in results]
        self.assertEqual(dates, sorted(dates, reverse=True))

    def test_filter_no_results(self):
        response = self.client.get(self.list_url, {"applicant__cpf": "00000000000"})
        results = self.get_results(response)

        self.assertEqual(len(results), 0)


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class DocumentRequestCreateAPITest(APITestCase):
    """
    Testes da API de criação de solicitações de documentos.
    """

    def setUp(self):
        self.url = reverse("document-request-create")
        self.data = get_valid_payload()
        return super().setUp()

    def test_create_request_patient_success(self):
        response = self.client.post(self.url, self.data, format="multipart")
        self.assertEqual(response.status_code, 201)

        self.assertEqual(DocumentRequest.objects.count(), 1)
        self.assertEqual(Applicant.objects.count(), 1)
        self.assertEqual(Incident.objects.count(), 1)

        request_obj = DocumentRequest.objects.first()
        self.assertEqual(request_obj.purpose, "DPVAT")
        self.assertTrue(request_obj.protocol.startswith(str(request_obj.created_at.year)))

    def test_error_when_file_count_differs_from_types(self):
        self.data["documents"] = [get_test_file(), get_test_file()]

        response = self.client.post(self.url, self.data, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Quantidade de arquivos diferente", str(response.data))

    def test_error_when_invalid_document_type_sent(self):
        self.data["document_types"] = ["INVALID_DOC"]

        response = self.client.post(self.url, self.data, format="multipart")
        self.assertEqual(response.status_code, 400)

    def test_error_when_required_document_missing(self):
        self.data["document_types"] = []
        self.data["documents"] = []

        response = self.client.post(self.url, self.data, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Faltam documentos obrigatórios", str(response.data))

    def test_atomic_transaction_on_error(self):
        self.data["document_types"] = []

        response = self.client.post(self.url, self.data, format="multipart")
        self.assertEqual(response.status_code, 400)

        self.assertEqual(DocumentRequest.objects.count(), 0)
        self.assertEqual(Applicant.objects.count(), 0)
        self.assertEqual(Incident.objects.count(), 0)


def get_test_file(name="doc.jpg"):
    return SimpleUploadedFile(name, b"img", content_type="image/jpeg")


def get_valid_payload():
    return {
        "purpose": "DPVAT",
        "applicant": json.dumps({
            "applicant_type": "PATIENT",
            "full_name": "João da Silva",
            "cpf": "18714933748",
            "rg": "287557672",
            "email": "joao@email.com",
            "address": "Rua A",
            "phone": "11999999999"
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
            "notes": "Paciente consciente"
        }),
        "document_types": ["PATIENT_ID"],
        "documents": [get_test_file()],
    }