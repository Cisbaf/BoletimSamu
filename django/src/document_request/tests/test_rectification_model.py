"""
Testes da máquina de estados do DocumentRectificationStatus e das regras do
modelo DocumentRectification.

Garante que:
- Toda retificação nasce com um evento inicial "solicitada" (append-only)
- Transições válidas criam novos eventos
- Transições inválidas são rejeitadas
- Estados terminais (concluida, cancelada) não permitem nenhuma saída
- has_open_rectification() reflete corretamente o estado mais recente
"""
from django.core.exceptions import ValidationError
from django.test import TestCase
from ..models import DocumentRequest, DocumentRectification, DocumentRectificationStatus


class DocumentRectificationModelTest(TestCase):
    def setUp(self):
        self.doc = DocumentRequest.objects.create(purpose="DPVAT")

    def test_criacao_gera_evento_inicial_solicitada(self):
        rectification = DocumentRectification.objects.create(
            document=self.doc, requested_cpf="18714933748"
        )
        self.assertEqual(rectification.status.count(), 1)
        self.assertEqual(rectification.status.first().status, "solicitada")

    def test_transicao_solicitada_para_agendada(self):
        rectification = DocumentRectification.objects.create(
            document=self.doc, requested_cpf="18714933748"
        )
        last = rectification.status.order_by("-created_at").first()
        new_event = last.change_status("agendada", comment="Agendado para 10/07")

        self.assertEqual(new_event.status, "agendada")
        self.assertEqual(rectification.status.count(), 2)

    def test_transicao_agendada_para_concluida(self):
        rectification = DocumentRectification.objects.create(
            document=self.doc, requested_cpf="18714933748"
        )
        last = rectification.status.order_by("-created_at").first()
        last = last.change_status("agendada")
        new_event = last.change_status("concluida")

        self.assertEqual(new_event.status, "concluida")

    def test_transicao_solicitada_para_cancelada(self):
        rectification = DocumentRectification.objects.create(
            document=self.doc, requested_cpf="18714933748"
        )
        last = rectification.status.order_by("-created_at").first()
        new_event = last.change_status("cancelada")

        self.assertEqual(new_event.status, "cancelada")

    def test_concluida_e_estado_terminal(self):
        rectification = DocumentRectification.objects.create(
            document=self.doc, requested_cpf="18714933748"
        )
        last = rectification.status.order_by("-created_at").first()
        last = last.change_status("agendada").change_status("concluida")

        with self.assertRaises(ValidationError):
            last.change_status("agendada")

    def test_cancelada_e_estado_terminal(self):
        rectification = DocumentRectification.objects.create(
            document=self.doc, requested_cpf="18714933748"
        )
        last = rectification.status.order_by("-created_at").first()
        last = last.change_status("cancelada")

        with self.assertRaises(ValidationError):
            last.change_status("agendada")

    def test_status_invalido_e_rejeitado(self):
        rectification = DocumentRectification.objects.create(
            document=self.doc, requested_cpf="18714933748"
        )
        last = rectification.status.order_by("-created_at").first()

        with self.assertRaises(ValidationError):
            last.change_status("em_analise")

    def test_historico_preservado_append_only(self):
        rectification = DocumentRectification.objects.create(
            document=self.doc, requested_cpf="18714933748"
        )
        last = rectification.status.order_by("-created_at").first()
        last.change_status("agendada").change_status("concluida")

        history = list(
            rectification.status.order_by("created_at").values_list("status", flat=True)
        )
        self.assertEqual(history, ["solicitada", "agendada", "concluida"])


class HasOpenRectificationTest(TestCase):
    def setUp(self):
        self.doc = DocumentRequest.objects.create(purpose="DPVAT")

    def test_sem_retificacao_retorna_false(self):
        self.assertFalse(self.doc.has_open_rectification())

    def test_retificacao_solicitada_retorna_true(self):
        DocumentRectification.objects.create(document=self.doc, requested_cpf="18714933748")
        self.assertTrue(self.doc.has_open_rectification())

    def test_retificacao_agendada_retorna_true(self):
        rectification = DocumentRectification.objects.create(
            document=self.doc, requested_cpf="18714933748"
        )
        rectification.status.first().change_status("agendada")
        self.assertTrue(self.doc.has_open_rectification())

    def test_retificacao_concluida_retorna_false(self):
        rectification = DocumentRectification.objects.create(
            document=self.doc, requested_cpf="18714933748"
        )
        rectification.status.first().change_status("agendada").change_status("concluida")
        self.assertFalse(self.doc.has_open_rectification())

    def test_retificacao_cancelada_retorna_false(self):
        rectification = DocumentRectification.objects.create(
            document=self.doc, requested_cpf="18714933748"
        )
        rectification.status.first().change_status("cancelada")
        self.assertFalse(self.doc.has_open_rectification())
