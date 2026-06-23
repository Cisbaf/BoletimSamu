"""
Testes da máquina de estados do DocumentStatus.

Garante que:
- Transições válidas criam novos eventos (append-only)
- Transições inválidas são rejeitadas com 400
- Estado terminal (cancelado) não permite nenhuma saída
- Documento inexistente retorna 404
- Acesso não autenticado retorna 401
- O histórico completo é preservado a cada transição
"""
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from ..models import DocumentRequest, DocumentStatus


STATUS_URL = "status-create"


def make_user(username="admin"):
    return User.objects.create_user(username=username, password="pass")


def auth_client(client, user):
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")


class DocumentStatusTransitionAPITest(APITestCase):
    """Testes de transição de status via API."""

    def setUp(self):
        self.user = make_user()
        auth_client(self.client, self.user)
        self.doc = DocumentRequest.objects.create(purpose="DPVAT")
        self.url = reverse(STATUS_URL)

    def _post(self, status, comment=""):
        return self.client.post(self.url, {
            "document": self.doc.id,
            "status": status,
            "comment": comment,
        })

    # ------------------------------------------------------------------
    # Transições válidas
    # ------------------------------------------------------------------

    def test_aguardando_para_confirmado(self):
        response = self._post("confirmado", "Aprovado")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "confirmado")
        self.assertEqual(response.data["document"], self.doc.id)

    def test_aguardando_para_cancelado(self):
        response = self._post("cancelado", "Cancelado administrativamente")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "cancelado")

    def test_confirmado_para_cancelado(self):
        self._post("confirmado")
        response = self._post("cancelado", "Cancelado após confirmação")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "cancelado")

    # ------------------------------------------------------------------
    # Transições inválidas
    # ------------------------------------------------------------------

    def test_confirmado_para_aguardando_invalido(self):
        self._post("confirmado")
        response = self._post("aguardando")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Transição", response.data["detail"])

    def test_cancelado_para_confirmado_invalido(self):
        self._post("cancelado")
        response = self._post("confirmado")
        self.assertEqual(response.status_code, 400)

    def test_cancelado_para_aguardando_invalido(self):
        self._post("cancelado")
        response = self._post("aguardando")
        self.assertEqual(response.status_code, 400)

    def test_status_inexistente_invalido(self):
        response = self._post("em_analise")
        self.assertEqual(response.status_code, 400)
        self.assertIn("inválido", response.data["detail"])

    # ------------------------------------------------------------------
    # Segurança e casos de borda
    # ------------------------------------------------------------------

    def test_documento_inexistente_retorna_404(self):
        response = self.client.post(self.url, {
            "document": 99999,
            "status": "confirmado",
        })
        self.assertEqual(response.status_code, 404)

    def test_sem_autenticacao_retorna_401(self):
        self.client.credentials()  # remove token
        response = self._post("confirmado")
        self.assertEqual(response.status_code, 401)

    # ------------------------------------------------------------------
    # Append-only: histórico preservado
    # ------------------------------------------------------------------

    def test_historico_completo_preservado(self):
        """Cada transição cria uma nova linha; o histórico nunca é sobrescrito."""
        self._post("confirmado", "Aprovado")
        self._post("cancelado", "Cancelado")

        statuses = list(
            self.doc.status.order_by("created_at").values_list("status", flat=True)
        )
        self.assertEqual(statuses, ["aguardando", "confirmado", "cancelado"])

    def test_cada_transicao_cria_nova_linha(self):
        count_antes = self.doc.status.count()  # 1 (inicial)
        self._post("confirmado")
        self.assertEqual(self.doc.status.count(), count_antes + 1)
        self._post("cancelado")
        self.assertEqual(self.doc.status.count(), count_antes + 2)

    def test_usuario_registrado_no_evento(self):
        response = self._post("confirmado")
        new_status_id = response.data["id"]
        evento = DocumentStatus.objects.get(pk=new_status_id)
        self.assertEqual(evento.user, self.user)

    def test_comentario_registrado_no_evento(self):
        response = self._post("confirmado", "Documentação conferida")
        new_status_id = response.data["id"]
        evento = DocumentStatus.objects.get(pk=new_status_id)
        self.assertEqual(evento.comment, "Documentação conferida")
