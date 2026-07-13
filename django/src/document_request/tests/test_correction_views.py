"""
Testes da API de correção de preenchimento:
- Abertura administrativa da correção (campos apontados + comentário)
- Envio público das respostas pelo cidadão (protocolo + CPF, multipart)
- Atualização de status da correção (aprovar aplica os valores; rejeitar)
- Correções embutidas nos endpoints de detalhe público e administrativo
"""
import json
import shutil
import tempfile
from random import random

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User

from ..models import (
    DocumentRequest,
    DocumentRectification,
    DocumentCorrection,
    DocumentCorrectionField,
)
from ..correction_fields import CorrectionFieldKey
from applicant.models import Applicant
from incident.models import Incident
from applicant_document.models import ApplicantDocument


CORRECTION_CREATE_URL = "document-correction-create"
CORRECTION_SUBMIT_URL = "document-correction-submit"
CORRECTION_STATUS_URL = "correction-status-create"

TEMP_MEDIA_ROOT = tempfile.mkdtemp()


def tearDownModule():
    shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)


def make_user(username=None):
    return User.objects.create_user(
        username=username or str(int(random() * 1_000_000)), password="pass"
    )


def auth_client(client, user):
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")


def png_file(name="doc.png"):
    return SimpleUploadedFile(
        name, b"\x89PNG\r\n\x1a\n" + b"conteudo-fake", content_type="image/png"
    )


def make_document(cpf="18714933748", purpose="DPVAT", other_purpose=None):
    doc = DocumentRequest.objects.create(purpose=purpose, other_purpose=other_purpose)
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
    Incident.objects.create(
        document=doc,
        date="2026-01-10",
        time="10:30",
        patient_name="João da Silva",
        city="MESQUITA",
        neighborhood="Centro",
        address="Rua A, 10",
        reason="Queda",
        attendance_location="RES",
    )
    return doc


def make_attachment(doc, document_type="PATIENT_ID"):
    return ApplicantDocument.objects.create(
        applicant=doc.applicant,
        document_type=document_type,
        file=png_file(),
    )


def make_correction(doc, field_keys=("applicant.full_name",), comment="Corrigir"):
    correction = DocumentCorrection.objects.create(document=doc)
    for key in field_keys:
        DocumentCorrectionField.objects.create(
            correction=correction,
            field_key=key,
            field_label=CorrectionFieldKey(key).label,
            admin_comment=comment,
        )
    return correction


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class DocumentCorrectionCreateAPITest(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = make_user()
        auth_client(self.client, self.user)
        self.url = reverse(CORRECTION_CREATE_URL)

    def _post(self, document_id, fields):
        return self.client.post(
            self.url, {"document": document_id, "fields": fields}, format="json"
        )

    def test_criacao_com_sucesso(self):
        doc = make_document()
        make_attachment(doc, "PATIENT_ID")

        response = self._post(doc.id, [
            {"field_key": "applicant.cpf", "comment": "CPF inválido"},
            {"field_key": "attachment.PATIENT_ID", "comment": "Documento ilegível"},
        ])

        self.assertEqual(response.status_code, 201)
        self.assertEqual(DocumentCorrection.objects.count(), 1)

        correction = DocumentCorrection.objects.first()
        self.assertEqual(correction.document, doc)
        self.assertEqual(correction.fields.count(), 2)
        self.assertEqual(response.data["status"][0]["status"], "pendente")

        cpf_field = correction.fields.get(field_key="applicant.cpf")
        self.assertEqual(cpf_field.field_label, "CPF")
        self.assertEqual(cpf_field.admin_comment, "CPF inválido")

    def test_pedido_nao_aguardando_retorna_400(self):
        doc = make_document()
        doc.status.first().change_status("confirmado")

        response = self._post(doc.id, [
            {"field_key": "applicant.cpf", "comment": "CPF inválido"},
        ])

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.data)
        self.assertEqual(DocumentCorrection.objects.count(), 0)

    def test_correcao_ja_aberta_retorna_400(self):
        doc = make_document()
        make_correction(doc)

        response = self._post(doc.id, [
            {"field_key": "applicant.cpf", "comment": "CPF inválido"},
        ])

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.data)
        self.assertEqual(DocumentCorrection.objects.count(), 1)

    def test_retificacao_em_andamento_retorna_400(self):
        doc = make_document()
        DocumentRectification.objects.create(document=doc, requested_cpf="18714933748")

        response = self._post(doc.id, [
            {"field_key": "applicant.cpf", "comment": "CPF inválido"},
        ])

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.data)
        self.assertEqual(DocumentCorrection.objects.count(), 0)

    def test_field_key_fora_da_whitelist_retorna_400(self):
        doc = make_document()

        response = self._post(doc.id, [
            {"field_key": "applicant.senha", "comment": "campo inexistente"},
        ])

        self.assertEqual(response.status_code, 400)
        self.assertEqual(DocumentCorrection.objects.count(), 0)

    def test_field_key_duplicado_retorna_400(self):
        doc = make_document()

        response = self._post(doc.id, [
            {"field_key": "applicant.cpf", "comment": "CPF inválido"},
            {"field_key": "applicant.cpf", "comment": "De novo"},
        ])

        self.assertEqual(response.status_code, 400)
        self.assertIn("fields", response.data)
        self.assertEqual(DocumentCorrection.objects.count(), 0)

    def test_lista_vazia_retorna_400(self):
        doc = make_document()

        response = self._post(doc.id, [])

        self.assertEqual(response.status_code, 400)
        self.assertEqual(DocumentCorrection.objects.count(), 0)

    def test_comentario_vazio_retorna_400(self):
        doc = make_document()

        response = self._post(doc.id, [
            {"field_key": "applicant.cpf", "comment": "   "},
        ])

        self.assertEqual(response.status_code, 400)
        self.assertEqual(DocumentCorrection.objects.count(), 0)

    def test_attachment_inexistente_no_pedido_retorna_400(self):
        doc = make_document()  # sem anexos

        response = self._post(doc.id, [
            {"field_key": "attachment.PATIENT_ID", "comment": "Documento ilegível"},
        ])

        self.assertEqual(response.status_code, 400)
        self.assertIn("fields", response.data)
        self.assertEqual(DocumentCorrection.objects.count(), 0)

    def test_pedido_inexistente_retorna_404(self):
        response = self._post(99999, [
            {"field_key": "applicant.cpf", "comment": "CPF inválido"},
        ])

        self.assertEqual(response.status_code, 404)

    def test_sem_autenticacao_retorna_401(self):
        doc = make_document()
        self.client.credentials()

        response = self._post(doc.id, [
            {"field_key": "applicant.cpf", "comment": "CPF inválido"},
        ])

        self.assertEqual(response.status_code, 401)
        self.assertEqual(DocumentCorrection.objects.count(), 0)


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class DocumentCorrectionSubmitAPITest(APITestCase):
    def setUp(self):
        cache.clear()
        self.url = reverse(CORRECTION_SUBMIT_URL)

    def test_envio_com_sucesso_texto_e_arquivo(self):
        doc = make_document(cpf="18714933748")
        make_attachment(doc, "PATIENT_ID")
        correction = make_correction(
            doc, field_keys=("applicant.full_name", "attachment.PATIENT_ID")
        )

        response = self.client.post(self.url, {
            "protocol": doc.protocol,
            "cpf": "187.149.337-48",
            "answers": json.dumps([
                {"field_key": "applicant.full_name", "value": "João Corrigido da Silva"},
            ]),
            "attachment.PATIENT_ID": png_file("novo.png"),
        }, format="multipart")

        self.assertEqual(response.status_code, 201)
        self.assertNotIn("cpf", response.data)

        text_field = correction.fields.get(field_key="applicant.full_name")
        self.assertEqual(text_field.new_value, "João Corrigido da Silva")
        self.assertIsNotNone(text_field.submitted_at)

        file_field = correction.fields.get(field_key="attachment.PATIENT_ID")
        self.assertTrue(file_field.new_file)
        self.assertIsNotNone(file_field.submitted_at)

        last_status = correction.status.order_by("-created_at").first()
        self.assertEqual(last_status.status, "enviada")

    def test_cpf_errado_retorna_400(self):
        doc = make_document(cpf="18714933748")
        make_correction(doc)

        response = self.client.post(self.url, {
            "protocol": doc.protocol,
            "cpf": "07193369024",
            "answers": json.dumps([
                {"field_key": "applicant.full_name", "value": "João Corrigido"},
            ]),
        }, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertIn("cpf", response.data)

    def test_protocolo_inexistente_retorna_404(self):
        response = self.client.post(self.url, {
            "protocol": "2026-9999",
            "cpf": "18714933748",
            "answers": "[]",
        }, format="multipart")

        self.assertEqual(response.status_code, 404)

    def test_sem_correcao_pendente_retorna_400(self):
        doc = make_document(cpf="18714933748")

        response = self.client.post(self.url, {
            "protocol": doc.protocol,
            "cpf": "18714933748",
            "answers": "[]",
        }, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.data)

    def test_correcao_ja_enviada_retorna_400(self):
        doc = make_document(cpf="18714933748")
        correction = make_correction(doc)
        field = correction.fields.first()
        field.new_value = "João Corrigido"
        field.save()
        correction.status.first().change_status("enviada")

        response = self.client.post(self.url, {
            "protocol": doc.protocol,
            "cpf": "18714933748",
            "answers": json.dumps([
                {"field_key": "applicant.full_name", "value": "Outro Nome"},
            ]),
        }, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.data)

    def test_campo_apontado_sem_resposta_retorna_400(self):
        doc = make_document(cpf="18714933748")
        correction = make_correction(
            doc, field_keys=("applicant.full_name", "incident.patient_name")
        )

        response = self.client.post(self.url, {
            "protocol": doc.protocol,
            "cpf": "18714933748",
            "answers": json.dumps([
                {"field_key": "applicant.full_name", "value": "João Corrigido"},
            ]),
        }, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertIn("answers", response.data)

        field = correction.fields.get(field_key="applicant.full_name")
        self.assertIsNone(field.new_value)
        self.assertIsNone(field.submitted_at)

    def test_campo_nao_apontado_retorna_400(self):
        doc = make_document(cpf="18714933748")
        make_correction(doc, field_keys=("applicant.full_name",))

        response = self.client.post(self.url, {
            "protocol": doc.protocol,
            "cpf": "18714933748",
            "answers": json.dumps([
                {"field_key": "applicant.full_name", "value": "João Corrigido"},
                {"field_key": "applicant.email", "value": "novo@email.com"},
            ]),
        }, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertIn("answers", response.data)

    def test_arquivo_faltando_retorna_400(self):
        doc = make_document(cpf="18714933748")
        make_attachment(doc, "PATIENT_ID")
        make_correction(doc, field_keys=("attachment.PATIENT_ID",))

        response = self.client.post(self.url, {
            "protocol": doc.protocol,
            "cpf": "18714933748",
            "answers": "[]",
        }, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertIn("files", response.data)

    def test_valor_invalido_retorna_400(self):
        doc = make_document(cpf="18714933748")
        correction = make_correction(doc, field_keys=("applicant.cpf",))

        response = self.client.post(self.url, {
            "protocol": doc.protocol,
            "cpf": "18714933748",
            "answers": json.dumps([
                {"field_key": "applicant.cpf", "value": "123"},
            ]),
        }, format="multipart")

        self.assertEqual(response.status_code, 400)

        # Nada foi gravado e a correção continua pendente
        field = correction.fields.first()
        self.assertIsNone(field.new_value)
        self.assertIsNone(field.submitted_at)
        last_status = correction.status.order_by("-created_at").first()
        self.assertEqual(last_status.status, "pendente")

    def test_answers_json_invalido_retorna_400(self):
        doc = make_document(cpf="18714933748")
        make_correction(doc)

        response = self.client.post(self.url, {
            "protocol": doc.protocol,
            "cpf": "18714933748",
            "answers": "não é json",
        }, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertIn("answers", response.data)


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class DocumentCorrectionStatusAPITest(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = make_user()
        auth_client(self.client, self.user)
        self.url = reverse(CORRECTION_STATUS_URL)

    def _post(self, correction_id, status, comment=""):
        return self.client.post(self.url, {
            "correction": correction_id,
            "status": status,
            "comment": comment,
        })

    def _submit_text(self, correction, values):
        """Grava respostas de texto e muda a correção para 'enviada'."""
        for key, value in values.items():
            field = correction.fields.get(field_key=key)
            field.new_value = value
            field.save()
        correction.status.order_by("-created_at").first().change_status("enviada")

    def test_aprovar_aplica_valores_no_applicant_incident_e_documento(self):
        doc = make_document(cpf="18714933748", purpose="OUTROS", other_purpose="Motivo antigo")
        correction = make_correction(doc, field_keys=(
            "applicant.full_name",
            "incident.patient_name",
            "document.other_purpose",
        ))
        self._submit_text(correction, {
            "applicant.full_name": "João Corrigido da Silva",
            "incident.patient_name": "Maria dos Santos",
            "document.other_purpose": "Motivo novo",
        })

        response = self._post(correction.id, "aprovada", "Tudo certo")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "aprovada")

        doc.refresh_from_db()
        doc.applicant.refresh_from_db()
        doc.incident.refresh_from_db()
        self.assertEqual(doc.applicant.full_name, "João Corrigido da Silva")
        self.assertEqual(doc.incident.patient_name, "Maria dos Santos")
        self.assertEqual(doc.other_purpose, "Motivo novo")

    def test_aprovar_substitui_anexo(self):
        doc = make_document(cpf="18714933748")
        old_attachment = make_attachment(doc, "PATIENT_ID")
        correction = make_correction(doc, field_keys=("attachment.PATIENT_ID",))

        field = correction.fields.first()
        field.new_file = png_file("corrigido.png")
        field.save()
        correction.status.first().change_status("enviada")

        response = self._post(correction.id, "aprovada")

        self.assertEqual(response.status_code, 201)

        attachments = ApplicantDocument.objects.filter(
            applicant=doc.applicant, document_type="PATIENT_ID"
        )
        self.assertEqual(attachments.count(), 1)
        self.assertNotEqual(attachments.first().pk, old_attachment.pk)

    def test_aprovar_com_dado_invalido_retorna_400_e_nada_muda(self):
        doc = make_document(cpf="18714933748")
        correction = make_correction(doc, field_keys=("applicant.cpf",))
        self._submit_text(correction, {"applicant.cpf": "123"})

        response = self._post(correction.id, "aprovada")

        self.assertEqual(response.status_code, 400)

        doc.applicant.refresh_from_db()
        self.assertEqual(doc.applicant.cpf, "18714933748")

        # Status não mudou — continua "enviada"
        last_status = correction.status.order_by("-created_at").first()
        self.assertEqual(last_status.status, "enviada")

    def test_aprovar_pendente_retorna_400(self):
        doc = make_document(cpf="18714933748")
        correction = make_correction(doc)

        response = self._post(correction.id, "aprovada")

        self.assertEqual(response.status_code, 400)
        last_status = correction.status.order_by("-created_at").first()
        self.assertEqual(last_status.status, "pendente")

    def test_rejeitar_pendente(self):
        doc = make_document(cpf="18714933748")
        correction = make_correction(doc)

        response = self._post(correction.id, "rejeitada", "Cancelado pelo admin")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "rejeitada")

    def test_rejeitar_enviada(self):
        doc = make_document(cpf="18714933748")
        correction = make_correction(doc)
        self._submit_text(correction, {"applicant.full_name": "João Corrigido"})

        response = self._post(correction.id, "rejeitada", "Valores incorretos")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "rejeitada")

    def test_correcao_inexistente_retorna_404(self):
        response = self._post(99999, "rejeitada")
        self.assertEqual(response.status_code, 404)

    def test_sem_autenticacao_retorna_401(self):
        doc = make_document(cpf="18714933748")
        correction = make_correction(doc)
        self.client.credentials()

        response = self._post(correction.id, "rejeitada")
        self.assertEqual(response.status_code, 401)

    def test_usuario_registrado_no_evento(self):
        doc = make_document(cpf="18714933748")
        correction = make_correction(doc)

        response = self._post(correction.id, "rejeitada")

        from ..models import DocumentCorrectionStatus
        evento = DocumentCorrectionStatus.objects.get(pk=response.data["id"])
        self.assertEqual(evento.user, self.user)


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class DocumentCorrectionInTimelineAPITest(APITestCase):
    """
    Garante que a correção aparece embutida na consulta pública e no
    detalhe administrativo de um pedido.
    """

    def setUp(self):
        cache.clear()
        self.doc = make_document(cpf="18714933748")
        make_correction(self.doc)

    def test_correcao_aparece_na_consulta_publica(self):
        url = reverse("public-requests-list")
        response = self.client.get(url, {"protocol": self.doc.protocol})

        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(len(results[0]["corrections"]), 1)
        self.assertEqual(results[0]["corrections"][0]["status"][0]["status"], "pendente")
        self.assertEqual(len(results[0]["corrections"][0]["fields"]), 1)

    def test_correcao_aparece_no_detalhe_administrativo(self):
        user = make_user()
        auth_client(self.client, user)

        url = reverse("admin-requests-detail", kwargs={"protocol": self.doc.protocol})
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["corrections"]), 1)
