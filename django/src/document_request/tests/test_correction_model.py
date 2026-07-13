"""
Testes da máquina de estados do DocumentCorrectionStatus e das regras do
modelo DocumentCorrection.

Garante que:
- Toda correção nasce com um evento inicial "pendente" (append-only)
- Transições válidas criam novos eventos
- Transições inválidas são rejeitadas
- Estados terminais (aprovada, rejeitada) não permitem nenhuma saída
- has_open_correction() reflete corretamente o estado mais recente
"""
from django.core.exceptions import ValidationError
from django.test import TestCase
from ..models import DocumentRequest, DocumentCorrection, DocumentCorrectionStatus


class DocumentCorrectionModelTest(TestCase):
    def setUp(self):
        self.doc = DocumentRequest.objects.create(purpose="DPVAT")

    def test_criacao_gera_evento_inicial_pendente(self):
        correction = DocumentCorrection.objects.create(document=self.doc)
        self.assertEqual(correction.status.count(), 1)
        self.assertEqual(correction.status.first().status, "pendente")

    def test_transicao_pendente_para_enviada(self):
        correction = DocumentCorrection.objects.create(document=self.doc)
        last = correction.status.order_by("-created_at").first()
        new_event = last.change_status("enviada", comment="Cidadão enviou os dados")

        self.assertEqual(new_event.status, "enviada")
        self.assertEqual(correction.status.count(), 2)

    def test_transicao_enviada_para_aprovada(self):
        correction = DocumentCorrection.objects.create(document=self.doc)
        last = correction.status.order_by("-created_at").first()
        last = last.change_status("enviada")
        new_event = last.change_status("aprovada")

        self.assertEqual(new_event.status, "aprovada")

    def test_transicao_enviada_para_rejeitada(self):
        correction = DocumentCorrection.objects.create(document=self.doc)
        last = correction.status.order_by("-created_at").first()
        last = last.change_status("enviada")
        new_event = last.change_status("rejeitada")

        self.assertEqual(new_event.status, "rejeitada")

    def test_transicao_pendente_para_rejeitada(self):
        correction = DocumentCorrection.objects.create(document=self.doc)
        last = correction.status.order_by("-created_at").first()
        new_event = last.change_status("rejeitada")

        self.assertEqual(new_event.status, "rejeitada")

    def test_aprovada_e_estado_terminal(self):
        correction = DocumentCorrection.objects.create(document=self.doc)
        last = correction.status.order_by("-created_at").first()
        last = last.change_status("enviada").change_status("aprovada")

        with self.assertRaises(ValidationError):
            last.change_status("enviada")

    def test_rejeitada_e_estado_terminal(self):
        correction = DocumentCorrection.objects.create(document=self.doc)
        last = correction.status.order_by("-created_at").first()
        last = last.change_status("rejeitada")

        with self.assertRaises(ValidationError):
            last.change_status("enviada")

    def test_status_invalido_e_rejeitado(self):
        correction = DocumentCorrection.objects.create(document=self.doc)
        last = correction.status.order_by("-created_at").first()

        with self.assertRaises(ValidationError):
            last.change_status("em_analise")

    def test_historico_preservado_append_only(self):
        correction = DocumentCorrection.objects.create(document=self.doc)
        last = correction.status.order_by("-created_at").first()
        last.change_status("enviada").change_status("aprovada")

        history = list(
            correction.status.order_by("created_at").values_list("status", flat=True)
        )
        self.assertEqual(history, ["pendente", "enviada", "aprovada"])


class HasOpenCorrectionTest(TestCase):
    def setUp(self):
        self.doc = DocumentRequest.objects.create(purpose="DPVAT")

    def test_sem_correcao_retorna_false(self):
        self.assertFalse(self.doc.has_open_correction())

    def test_correcao_pendente_retorna_true(self):
        DocumentCorrection.objects.create(document=self.doc)
        self.assertTrue(self.doc.has_open_correction())

    def test_correcao_enviada_retorna_true(self):
        correction = DocumentCorrection.objects.create(document=self.doc)
        correction.status.first().change_status("enviada")
        self.assertTrue(self.doc.has_open_correction())

    def test_correcao_aprovada_retorna_false(self):
        correction = DocumentCorrection.objects.create(document=self.doc)
        correction.status.first().change_status("enviada").change_status("aprovada")
        self.assertFalse(self.doc.has_open_correction())

    def test_correcao_rejeitada_retorna_false(self):
        correction = DocumentCorrection.objects.create(document=self.doc)
        correction.status.first().change_status("rejeitada")
        self.assertFalse(self.doc.has_open_correction())
