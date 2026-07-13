from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.forms.models import model_to_dict
from rest_framework import serializers

from document_request.models import DocumentRequest
from applicant.serializers import ApplicantSerializer
from incident.serializers import IncidentSerializer
from applicant_document.models import ApplicantDocument
import requests, json, time

def make_message_for_admin(protocol: str):
    return f"""*NOVA SOLICITAÇÃO DE CÓPIA BOLETIM DE ATENDIMENTO SAMU*\nAcompanhe a solicitação {make_url_follow_admin(protocol)}"""

def make_url_follow_admin(protocol: str):
    return f"https://atendimentocrur.cisbaf.org.br/painel?protocol={protocol}"

def send_message_wpp_to_admin(doc: DocumentRequest):
    data = {
        "to": "21991920338",
        "message": make_message_for_admin(doc.protocol),
    }
    try:
        response = requests.post(
            url="http://192.168.1.10:8001/notification",
            data=json.dumps(data),
            timeout=3
        )
    except Exception as e:
        print(e)
        pass


# =====================================================================
# Correção de Preenchimento
# =====================================================================

def split_correction_field_key(field_key):
    """Divide um field_key ("applicant.cpf") em (model_key, field_name)."""
    return field_key.split(".", 1)


def _merged_data(instance, overrides, exclude=("id", "document")):
    """
    Mescla os valores atuais do model com os novos valores da correção,
    produzindo o payload completo que os serializers existentes esperam.

    Necessário porque ApplicantSerializer/IncidentSerializer validam via
    full_clean() sobre uma instância montada a partir dos attrs — com
    partial=True os campos ausentes fariam a validação falhar. Mesclar
    com os dados atuais permite reutilizar todas as regras sem duplicá-las.
    """
    data = model_to_dict(instance, exclude=list(exclude))
    data.update(overrides)
    return data


def group_correction_values(pairs):
    """
    Agrupa pares (field_key, value) nos dicionários por model de destino.
    Retorna (applicant_data, incident_data, document_data) — campos de
    attachment não entram aqui (são tratados como arquivo).
    """
    applicant_data, incident_data, document_data = {}, {}, {}
    for field_key, value in pairs:
        model_key, field_name = split_correction_field_key(field_key)
        if model_key == "applicant":
            applicant_data[field_name] = value
        elif model_key == "incident":
            incident_data[field_name] = value
        elif model_key == "document":
            document_data[field_name] = value
    return applicant_data, incident_data, document_data


def _validate_document_data(document, document_data):
    """
    Valida campos do próprio DocumentRequest (ex.: other_purpose) usando o
    full_clean() do model sobre a instância, restaurando os valores
    originais em seguida (validação sem efeito colateral).
    """
    original = {k: getattr(document, k) for k in document_data}
    for k, v in document_data.items():
        setattr(document, k, v)
    try:
        document.full_clean()
    except DjangoValidationError as e:
        raise serializers.ValidationError(
            e.message_dict if hasattr(e, "message_dict") else {"detail": e.messages}
        )
    finally:
        for k, v in original.items():
            setattr(document, k, v)


def validate_correction_values(document, applicant_data, incident_data, document_data):
    """
    Valida os novos valores de texto sem salvar nada, reutilizando os
    serializers/validadores existentes (defesa única de regras de negócio).
    """
    if applicant_data:
        s = ApplicantSerializer(data=_merged_data(document.applicant, applicant_data))
        s.is_valid(raise_exception=True)
    if incident_data:
        s = IncidentSerializer(data=_merged_data(document.incident, incident_data))
        s.is_valid(raise_exception=True)
    if document_data:
        _validate_document_data(document, document_data)


def get_pending_correction(document):
    """
    Retorna a correção do pedido cujo último status é "pendente",
    ou None se não houver.
    """
    from document_request.models import DocumentCorrectionStatus

    for correction in document.corrections.all():
        last_status = correction.status.order_by("-created_at").first()
        if last_status and last_status.status == DocumentCorrectionStatus.StatusChoices.PENDENTE:
            return correction
    return None


def _replace_applicant_document(applicant, field):
    """
    Substituição simples do anexo: remove o(s) ApplicantDocument antigo(s)
    daquele document_type e cria um novo apontando para o arquivo enviado
    na correção (decisão confirmada: sem flag de auditoria).
    """
    _, document_type = split_correction_field_key(field.field_key)

    if not field.new_file:
        raise serializers.ValidationError({
            field.field_key: "Arquivo da correção não encontrado."
        })

    ApplicantDocument.objects.filter(
        applicant=applicant, document_type=document_type
    ).delete()
    ApplicantDocument.objects.create(
        applicant=applicant,
        document_type=document_type,
        file=field.new_file,
    )


def apply_document_correction(correction):
    """
    Aplica os valores/arquivos enviados na correção aos models de destino
    (Applicant, Incident, DocumentRequest, ApplicantDocument), revalidando
    tudo pelos serializers existentes (defesa em profundidade).

    Qualquer falha de validação levanta ValidationError (DRF) e reverte a
    transação inteira — nada é aplicado parcialmente.
    """
    document = correction.document

    with transaction.atomic():
        text_pairs = []
        for field in correction.fields.all():
            model_key, _ = split_correction_field_key(field.field_key)
            if model_key == "attachment":
                _replace_applicant_document(document.applicant, field)
            else:
                text_pairs.append((field.field_key, field.new_value))

        applicant_data, incident_data, document_data = group_correction_values(text_pairs)

        if applicant_data:
            s = ApplicantSerializer(
                instance=document.applicant,
                data=_merged_data(document.applicant, applicant_data),
            )
            s.is_valid(raise_exception=True)
            s.save()

        if incident_data:
            s = IncidentSerializer(
                instance=document.incident,
                data=_merged_data(document.incident, incident_data),
            )
            s.is_valid(raise_exception=True)
            s.save()

        if document_data:
            for k, v in document_data.items():
                setattr(document, k, v)
            try:
                document.full_clean()
            except DjangoValidationError as e:
                raise serializers.ValidationError(
                    e.message_dict if hasattr(e, "message_dict") else {"detail": e.messages}
                )
            document.save()