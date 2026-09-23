from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient


class ApiExceptionHandlerTest(TestCase):
    """
    Qualquer erro não previsto precisa chegar ao frontend como JSON.

    Antes, uma exceção inesperada virava a página HTML de "Server Error (500)"
    do Django: o frontend não conseguia interpretar o corpo e mostrava apenas
    "Ocorreu um erro inesperado.", sem nenhuma pista do motivo — nem no log,
    já que o traceback também não era registrado.
    """

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("document-request-create")

    def test_unhandled_exception_returns_json_with_error_id(self):
        with patch(
            "document_request.views.DocumentRequestSerializer",
            side_effect=RuntimeError("boom"),
        ):
            with self.assertLogs("boletim.api", level="ERROR") as logs:
                response = self.client.post(self.url, {}, format="multipart")

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response["Content-Type"], "application/json")

        error_id = response.json()["error_id"]
        self.assertIn(error_id, response.json()["detail"])
        # O mesmo código precisa estar no log, junto do traceback.
        self.assertIn(error_id, "\n".join(logs.output))
        self.assertIn("RuntimeError: boom", "\n".join(logs.output))
