"""
Testes da API de retificação:
- Abertura pública do protocolo de retificação (CPF + protocolo)
- Atualização de status da retificação (uso administrativo)
"""
import json
from random import random

from django.core.cache import cache
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User

from ..models import DocumentRequest, DocumentRectification
from applicant.models import Applicant


RECTIFICATION_CREATE_URL = "document-rectification-create"
RECTIFICATION_STATUS_URL = "rectification-status-create"


def make_user(username=None):
    return User.objects.create_user(
        username=username or str(int(random() * 1_000_000)), password="pass"
    )


def auth_client(client, user):
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")


def make_pending_document(cpf="18714933748"):
    doc = DocumentRequest.objects.create(purpose="DPVAT")
    Applicant.objects.create(
        document=doc,
        applicant_type=Applicant.ApplicantType.PATIENT,
        full_name="João da Silva",
        cpf=cpf,
        rg="287557672",
        email="joao@email.com",
        address="Rua A",
        phone="11999999999",
    )
    return doc


def make_confirmed_document(cpf="18714933748"):
    doc = make_pending_document(cpf=cpf)
    doc.status.first().change_status("confirmado", comment="Aprovado")
    return doc


class DocumentRectificationCreateAPITest(APITestCase):
    def setUp(self):
        cache.clear()
        self.url = reverse(RECTIFICATION_CREATE_URL)

    def test_criacao_com_sucesso(self):
        doc = make_confirmed_document(cpf="18714933748")

        response = self.client.post(self.url, {
            "protocol": doc.protocol,
            "cpf": "187.149.337-48",
        })

        self.assertEqual(response.status_code, 201)
        self.assertEqual(DocumentRectification.objects.count(), 1)
        self.assertEqual(response.data["status"][0]["status"], "solicitada")

        rectification = DocumentRectification.objects.first()
        self.assertEqual(rectification.requested_cpf, "18714933748")
        self.assertEqual(rectification.document, doc)

    def test_cpf_nao_confere_retorna_400(self):
        doc = make_confirmed_document(cpf="18714933748")

        response = self.client.post(self.url, {
            "protocol": doc.protocol,
            "cpf": "99999999999",
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn("cpf", response.data)
        self.assertEqual(DocumentRectification.objects.count(), 0)

    def test_documento_nao_confirmado_retorna_400(self):
        doc = DocumentRequest.objects.create(purpose="DPVAT")
        Applicant.objects.create(
            document=doc,
            applicant_type=Applicant.ApplicantType.PATIENT,
            full_name="João da Silva",
            cpf="18714933748",
            rg="287557672",
            email="joao@email.com",
            address="Rua A",
            phone="11999999999",
        )

        response = self.client.post(self.url, {
            "protocol": doc.protocol,
            "cpf": "18714933748",
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.data)
        self.assertEqual(DocumentRectification.objects.count(), 0)

    def test_protocolo_inexistente_retorna_404(self):
        response = self.client.post(self.url, {
            "protocol": "2026-9999",
            "cpf": "18714933748",
        })

        self.assertEqual(response.status_code, 404)

    def test_retificacao_ja_em_andamento_retorna_400(self):
        doc = make_confirmed_document(cpf="18714933748")
        DocumentRectification.objects.create(document=doc, requested_cpf="18714933748")

        response = self.client.post(self.url, {
            "protocol": doc.protocol,
            "cpf": "18714933748",
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.data)
        self.assertEqual(DocumentRectification.objects.count(), 1)

    def test_cpf_invalido_estruturalmente_retorna_400(self):
        doc = make_confirmed_document(cpf="18714933748")

        response = self.client.post(self.url, {
            "protocol": doc.protocol,
            "cpf": "123",
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn("cpf", response.data)

    def test_nova_retificacao_permitida_apos_conclusao_da_anterior(self):
        doc = make_confirmed_document(cpf="18714933748")
        previous = DocumentRectification.objects.create(document=doc, requested_cpf="18714933748")
        previous.status.first().change_status("agendada").change_status("concluida")

        response = self.client.post(self.url, {
            "protocol": doc.protocol,
            "cpf": "18714933748",
        })

        self.assertEqual(response.status_code, 201)
        self.assertEqual(DocumentRectification.objects.count(), 2)


class DocumentRectificationStatusAPITest(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = make_user()
        auth_client(self.client, self.user)
        self.doc = make_confirmed_document(cpf="18714933748")
        self.rectification = DocumentRectification.objects.create(
            document=self.doc, requested_cpf="18714933748"
        )
        self.url = reverse(RECTIFICATION_STATUS_URL)

    def _post(self, status, comment=""):
        return self.client.post(self.url, {
            "rectification": self.rectification.id,
            "status": status,
            "comment": comment,
        })

    def test_solicitada_para_agendada(self):
        response = self._post("agendada", "Agendado para amanhã")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "agendada")

    def test_transicao_invalida_retorna_400(self):
        self._post("agendada")
        self._post("concluida")
        response = self._post("agendada")
        self.assertEqual(response.status_code, 400)

    def test_retificacao_inexistente_retorna_404(self):
        response = self.client.post(self.url, {
            "rectification": 99999,
            "status": "agendada",
        })
        self.assertEqual(response.status_code, 404)

    def test_sem_autenticacao_retorna_401(self):
        self.client.credentials()
        response = self._post("agendada")
        self.assertEqual(response.status_code, 401)

    def test_usuario_registrado_no_evento(self):
        response = self._post("agendada")
        new_status_id = response.data["id"]
        from ..models import DocumentRectificationStatus
        evento = DocumentRectificationStatus.objects.get(pk=new_status_id)
        self.assertEqual(evento.user, self.user)


class DocumentRectificationInTimelineAPITest(APITestCase):
    """
    Garante que a retificação aparece embutida na consulta pública/detalhe
    de um pedido, permitindo o acompanhamento na mesma linha do tempo.
    """

    def setUp(self):
        cache.clear()
        self.doc = make_confirmed_document(cpf="18714933748")
        DocumentRectification.objects.create(document=self.doc, requested_cpf="18714933748")

    def test_retificacao_aparece_na_consulta_publica(self):
        url = reverse("public-requests-list")
        response = self.client.get(url, {"protocol": self.doc.protocol})

        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(len(results[0]["rectifications"]), 1)
        self.assertEqual(results[0]["rectifications"][0]["status"][0]["status"], "solicitada")

    def test_retificacao_aparece_no_detalhe_administrativo(self):
        user = make_user()
        auth_client(self.client, user)

        url = reverse("admin-requests-detail", kwargs={"protocol": self.doc.protocol})
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["rectifications"]), 1)


class DocumentRetificandoFilterAPITest(APITestCase):
    """
    Testes do filtro `?status=retificando`, usado pela aba "Retificações"
    do painel para listar (e contar) pedidos com retificação em andamento.
    """

    def setUp(self):
        cache.clear()
        self.list_url = reverse("public-requests-list")

        # Pedido confirmado sem retificação — não deve aparecer.
        self.confirmed_only = make_confirmed_document(cpf="18714933748")

        # Pedido com retificação solicitada — deve aparecer.
        self.with_open_rectification = make_confirmed_document(cpf="07193369024")
        DocumentRectification.objects.create(
            document=self.with_open_rectification, requested_cpf="07193369024"
        )

        # Pedido com retificação já concluída — não deve aparecer.
        self.with_closed_rectification = make_confirmed_document(cpf="62528256035")
        closed = DocumentRectification.objects.create(
            document=self.with_closed_rectification, requested_cpf="62528256035"
        )
        closed.status.first().change_status("agendada").change_status("concluida")

        # Pedido ainda aguardando — não deve aparecer.
        self.pending = make_pending_document(cpf="84241038077")

    def test_filtra_apenas_pedidos_com_retificacao_em_aberto(self):
        response = self.client.get(self.list_url, {"status": "retificando"})
        results = response.data.get("results", response.data)

        protocols = {item["protocol"] for item in results}
        self.assertEqual(response.data["count"], 1)
        self.assertIn(self.with_open_rectification.protocol, protocols)
        self.assertNotIn(self.confirmed_only.protocol, protocols)
        self.assertNotIn(self.with_closed_rectification.protocol, protocols)

    def test_retificacao_agendada_tambem_conta_como_em_aberto(self):
        self.with_open_rectification.rectifications.first().status.order_by("created_at").first().change_status("agendada")

        response = self.client.get(self.list_url, {"status": "retificando"})
        self.assertEqual(response.data["count"], 1)

    def test_status_aguardando_nao_inclui_retificacoes(self):
        response = self.client.get(self.list_url, {"status": "aguardando"})
        results = response.data.get("results", response.data)

        protocols = {item["protocol"] for item in results}
        self.assertNotIn(self.with_open_rectification.protocol, protocols)
