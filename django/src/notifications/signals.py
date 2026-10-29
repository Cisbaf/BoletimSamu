"""
Dispara a notificação de WhatsApp quando um evento de status é criado.

Os três históricos (pedido, retificação e correção) são append-only: toda
mudança — inclusive o status inicial — é uma linha nova. Ouvir o post_save
dessas linhas cobre qualquer origem (API, admin do Django, criação do
pedido) sem espalhar chamadas pelas views.

O envio só roda após o commit (o solicitante do pedido novo é criado depois
do status inicial, na mesma transação) e uma falha aqui nunca afeta a
operação que gerou o evento.
"""
import logging

from django.db import transaction
from django.db.models.signals import post_save

from document_request.models import (
    DocumentCorrectionStatus,
    DocumentRectificationStatus,
    DocumentStatus,
)

from . import client, messages

logger = logging.getLogger("boletim.notifications")

# modelo -> (prefixo da idempotency_key, textos, como chegar ao DocumentRequest)
EVENTS = {
    DocumentStatus: ("doc-status", messages.DOCUMENT_TEXTS, lambda s: s.document),
    DocumentRectificationStatus: ("ret-status", messages.RECTIFICATION_TEXTS, lambda s: s.rectification.document),
    DocumentCorrectionStatus: ("cor-status", messages.CORRECTION_TEXTS, lambda s: s.correction.document),
}


def _notify(model, pk):
    try:
        prefix, texts, get_document = EVENTS[model]
        event = model.objects.get(pk=pk)
        document = get_document(event)
        applicant = getattr(document, "applicant", None)
        if applicant is None:
            return

        phone = client.normalize_phone(applicant.phone)
        if phone is None:
            logger.info("Protocolo %s: sem celular válido para WhatsApp.", document.protocol)
            return

        text = messages.build(
            texts, event.status, document.protocol, applicant.full_name,
            comment=event.comment,
        )
        if text is None:
            return

        client.send_async(phone, text, f"{prefix}-{pk}", ref=document.protocol)
    except Exception:
        logger.exception("Falha ao preparar notificação (%s #%s).", model.__name__, pk)


def _schedule(sender, instance, created, **kwargs):
    if not created or not client.is_enabled():
        return
    transaction.on_commit(lambda: _notify(sender, instance.pk))


for _model in EVENTS:
    post_save.connect(_schedule, sender=_model, dispatch_uid=f"notify-{_model.__name__}")
