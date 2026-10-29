"""
Testes das notificações por WhatsApp.

Cobrem: texto das mensagens, escolha de destinatário, disparo pelos três
históricos de status (incluindo o status inicial), desligamento por
NOTIFY_URL vazio e o comportamento do cliente (retry, 4xx, nunca levantar).
"""
from unittest import mock

import requests
from django.contrib.auth.models import User
from django.test import SimpleTestCase, TestCase, override_settings

from applicant.models import Applicant
from document_request.models import (
    DocumentCorrection,
    DocumentRectification,
    DocumentRequest,
)
from notifications import client, messages

NOTIFY = {"NOTIFY_URL": "http://notify.test", "NOTIFY_API_KEY": "chave-teste"}


def make_document(phone="21999990000", cpf="18714933748"):
    doc = DocumentRequest.objects.create(purpose="DPVAT")
    Applicant.objects.create(
        document=doc,
        applicant_type=Applicant.ApplicantType.PATIENT,
        full_name="MARIA DA SILVA",
        cpf=cpf,
        rg="287557672",
        email="maria@email.com",
        address="Rua A",
        phone=phone,
    )
    return doc


class NormalizePhoneTest(SimpleTestCase):
    def test_celular_com_mascara(self):
        self.assertEqual(client.normalize_phone("(21) 99999-0000"), "21999990000")

    def test_fixo_nao_recebe_whatsapp(self):
        self.assertIsNone(client.normalize_phone("2133334444"))

    def test_celular_antigo_de_10_digitos_passa(self):
        self.assertEqual(client.normalize_phone("2198887777"), "2198887777")

    def test_vazio_ou_tamanho_invalido(self):
        self.assertIsNone(client.normalize_phone(""))
        self.assertIsNone(client.normalize_phone(None))
        self.assertIsNone(client.normalize_phone("123"))


@override_settings(NOTIFY_SITE_URL="https://site.test")
class BuildMessageTest(SimpleTestCase):
    def test_inclui_nome_protocolo_e_link(self):
        text = messages.build(
            messages.DOCUMENT_TEXTS, "aguardando", "2026-0001", "MARIA DA SILVA"
        )
        self.assertIn("Olá, Maria!", text)
        self.assertIn("2026-0001", text)
        self.assertIn("https://site.test/acompanhar?protocol=2026-0001", text)
        self.assertNotIn("Mensagem do atendimento", text)

    def test_inclui_recado_do_atendimento(self):
        text = messages.build(
            messages.DOCUMENT_TEXTS, "confirmado", "2026-0001", "Maria", comment="Retire na unidade."
        )
        self.assertIn("Mensagem do atendimento", text)
        self.assertIn("Retire na unidade.", text)

    def test_recado_muito_longo_e_truncado(self):
        text = messages.build(
            messages.DOCUMENT_TEXTS, "cancelado", "2026-0001", "Maria", comment="x" * 5000
        )
        self.assertLess(len(text), 2000)

    def test_status_sem_texto_devolve_none(self):
        self.assertIsNone(messages.build(messages.DOCUMENT_TEXTS, "inexistente", "1", "Maria"))

    def test_textos_cobrem_todos_os_status(self):
        from document_request.models import (
            DocumentCorrectionStatus,
            DocumentRectificationStatus,
            DocumentStatus,
        )
        for texts, model in (
            (messages.DOCUMENT_TEXTS, DocumentStatus),
            (messages.RECTIFICATION_TEXTS, DocumentRectificationStatus),
            (messages.CORRECTION_TEXTS, DocumentCorrectionStatus),
        ):
            self.assertEqual(set(texts), {v for v, _ in model.StatusChoices.choices})


@override_settings(**NOTIFY)
class StatusSignalsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("admin", password="x")
        patcher = mock.patch("notifications.client.send_async")
        self.send = patcher.start()
        self.addCleanup(patcher.stop)

    def _create_document(self, **kwargs):
        with self.captureOnCommitCallbacks(execute=True):
            return make_document(**kwargs)

    def test_criacao_envia_confirmacao_com_protocolo(self):
        doc = self._create_document()

        self.send.assert_called_once()
        to, text = self.send.call_args.args[:2]
        self.assertEqual(to, "21999990000")
        self.assertIn(doc.protocol, text)
        self.assertEqual(self.send.call_args.kwargs["ref"], doc.protocol)
        self.assertTrue(self.send.call_args.args[2].startswith("doc-status-"))

    def test_mudanca_de_status_do_pedido_notifica_com_recado(self):
        doc = self._create_document()
        self.send.reset_mock()

        with self.captureOnCommitCallbacks(execute=True):
            doc.status.order_by("-created_at").first().change_status(
                "confirmado", user=self.user, comment="Retire na unidade."
            )

        self.send.assert_called_once()
        text = self.send.call_args.args[1]
        self.assertIn("aprovada", text)
        self.assertIn("Retire na unidade.", text)

    def test_chave_de_idempotencia_e_unica_por_evento(self):
        doc = self._create_document()
        with self.captureOnCommitCallbacks(execute=True):
            doc.status.order_by("-created_at").first().change_status("cancelado", user=self.user)

        keys = [call.args[2] for call in self.send.call_args_list]
        self.assertEqual(len(keys), 2)
        self.assertEqual(len(set(keys)), 2)

    def test_retificacao_notifica_abertura_e_andamento(self):
        doc = self._create_document()
        self.send.reset_mock()

        with self.captureOnCommitCallbacks(execute=True):
            rect = DocumentRectification.objects.create(
                document=doc, requested_cpf="18714933748", reason="Endereço"
            )
        self.assertIn("Retificação solicitada", self.send.call_args.args[1])

        with self.captureOnCommitCallbacks(execute=True):
            rect.status.order_by("-created_at").first().change_status(
                "agendada", user=self.user, comment="Dia 10 às 10h"
            )
        text = self.send.call_args.args[1]
        self.assertIn("agendada", text)
        self.assertIn("Dia 10 às 10h", text)

    def test_correcao_pendente_avisa_que_precisa_agir(self):
        doc = self._create_document()
        self.send.reset_mock()

        with self.captureOnCommitCallbacks(execute=True):
            DocumentCorrection.objects.create(document=doc)

        self.assertIn("corrija", self.send.call_args.args[1])

    def test_sem_celular_valido_nao_envia(self):
        self._create_document(phone="2133334444")
        self.send.assert_not_called()

    def test_nada_e_enviado_antes_do_commit(self):
        make_document()
        self.send.assert_not_called()

    def test_falha_ao_preparar_nao_derruba_a_operacao(self):
        with mock.patch("notifications.messages.build", side_effect=RuntimeError("boom")):
            doc = self._create_document()
        self.assertTrue(DocumentRequest.objects.filter(pk=doc.pk).exists())
        self.send.assert_not_called()

    @override_settings(NOTIFY_URL="")
    def test_url_vazia_desliga_o_envio(self):
        self._create_document()
        self.send.assert_not_called()


@override_settings(**NOTIFY)
class DeliverTest(SimpleTestCase):
    def setUp(self):
        patcher = mock.patch("notifications.client.time.sleep")
        self.sleep = patcher.start()
        self.addCleanup(patcher.stop)

    @staticmethod
    def _response(status, headers=None):
        resp = mock.Mock(status_code=status, headers=headers or {})
        resp.json.return_value = {"error": {"code": "x"}}
        return resp

    def test_envia_payload_e_chave_do_app(self):
        with mock.patch("requests.post", return_value=self._response(202)) as post:
            self.assertTrue(client.deliver("21999990000", "oi", "doc-status-1", ref="2026-0001"))

        args, kwargs = post.call_args
        self.assertEqual(args[0], "http://notify.test/v1/messages")
        self.assertEqual(kwargs["headers"], {"Authorization": "Bearer chave-teste"})
        self.assertEqual(kwargs["json"], {
            "to": "21999990000", "text": "oi",
            "idempotency_key": "doc-status-1", "ref": "2026-0001",
        })
        self.assertEqual(kwargs["timeout"], (3, 8))

    def test_repeticao_idempotente_200_conta_como_sucesso(self):
        with mock.patch("requests.post", return_value=self._response(200)):
            self.assertTrue(client.deliver("21999990000", "oi", "k"))

    def test_5xx_tenta_de_novo_ate_funcionar(self):
        responses = [self._response(503), self._response(202)]
        with mock.patch("requests.post", side_effect=responses) as post:
            self.assertTrue(client.deliver("21999990000", "oi", "k"))
        self.assertEqual(post.call_count, 2)
        self.sleep.assert_called_once()

    def test_timeout_tenta_de_novo_e_desiste_sem_levantar(self):
        with mock.patch("requests.post", side_effect=requests.Timeout) as post:
            self.assertFalse(client.deliver("21999990000", "oi", "k"))
        self.assertEqual(post.call_count, client.MAX_ATTEMPTS)

    def test_429_respeita_retry_after(self):
        responses = [self._response(429, {"Retry-After": "7"}), self._response(202)]
        with mock.patch("requests.post", side_effect=responses):
            self.assertTrue(client.deliver("21999990000", "oi", "k"))
        self.sleep.assert_called_once_with(7)

    def test_retry_after_e_limitado(self):
        responses = [self._response(429, {"Retry-After": "9999"}), self._response(202)]
        with mock.patch("requests.post", side_effect=responses):
            client.deliver("21999990000", "oi", "k")
        self.sleep.assert_called_once_with(client.MAX_RETRY_AFTER)

    def test_4xx_nao_repete(self):
        with mock.patch("requests.post", return_value=self._response(401)) as post:
            self.assertFalse(client.deliver("21999990000", "oi", "k"))
        self.assertEqual(post.call_count, 1)

    def test_erro_inesperado_nao_levanta(self):
        with mock.patch("requests.post", side_effect=RuntimeError("boom")):
            self.assertFalse(client.deliver("21999990000", "oi", "k"))

    @override_settings(NOTIFY_URL="")
    def test_send_async_desligado_nao_cria_thread(self):
        with mock.patch("notifications.client.threading.Thread") as thread:
            client.send_async("21999990000", "oi", "k")
        thread.assert_not_called()
