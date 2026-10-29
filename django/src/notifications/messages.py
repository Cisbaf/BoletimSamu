"""
Textos das mensagens de WhatsApp enviadas ao solicitante.

Sem dados sensíveis: só primeiro nome, protocolo, o recado do atendimento
(o mesmo que já aparece na página pública de acompanhamento) e o link.
"""
from django.conf import settings

from document_request.models import (
    DocumentCorrectionStatus,
    DocumentRectificationStatus,
    DocumentStatus,
)

MAX_COMMENT_CHARS = 1200

_DOC = DocumentStatus.StatusChoices
_RET = DocumentRectificationStatus.StatusChoices
_COR = DocumentCorrectionStatus.StatusChoices

# status -> (título, corpo). {protocol} é substituído; o recado do
# atendimento (comentário) e o link entram depois, em build().
DOCUMENT_TEXTS = {
    _DOC.AGUARDANDO: (
        "✅ *Solicitação recebida*",
        "Recebemos sua solicitação de cópia do Boletim de Atendimento SAMU. "
        "Guarde o protocolo para acompanhar o andamento.",
    ),
    _DOC.CONFIRMADO: (
        "✅ *Solicitação aprovada*",
        "Sua solicitação foi aprovada.",
    ),
    _DOC.CANCELADO: (
        "❌ *Solicitação não atendida*",
        "Não foi possível dar andamento à sua solicitação.",
    ),
}

RECTIFICATION_TEXTS = {
    _RET.SOLICITADA: (
        "📝 *Retificação solicitada*",
        "Recebemos seu pedido de retificação do documento.",
    ),
    _RET.AGENDADA: (
        "📅 *Retificação agendada*",
        "Sua retificação foi agendada.",
    ),
    _RET.CONCLUIDA: (
        "✅ *Retificação concluída*",
        "Sua retificação foi concluída.",
    ),
    _RET.CANCELADA: (
        "❌ *Retificação cancelada*",
        "Sua solicitação de retificação foi cancelada.",
    ),
}

CORRECTION_TEXTS = {
    _COR.PENDENTE: (
        "⚠️ *Precisamos que você corrija informações*",
        "Identificamos dados que precisam ser corrigidos na sua solicitação. "
        "Acesse o link abaixo, informe o protocolo e envie as correções.",
    ),
    _COR.ENVIADA: (
        "📨 *Correção recebida*",
        "Recebemos as correções enviadas e vamos analisá-las.",
    ),
    _COR.APROVADA: (
        "✅ *Correção aprovada*",
        "As correções enviadas foram aceitas.",
    ),
    _COR.REJEITADA: (
        "❌ *Correção não aceita*",
        "As correções enviadas não puderam ser aceitas.",
    ),
}


def tracking_url(protocol):
    return f"{settings.NOTIFY_SITE_URL.rstrip('/')}/acompanhar?protocol={protocol}"


def first_name(full_name):
    parts = (full_name or "").split()
    return parts[0].capitalize() if parts else ""


def build(texts, status, protocol, applicant_name, comment=None):
    """Monta a mensagem final. Devolve None se o status não notifica."""
    entry = texts.get(status)
    if entry is None:
        return None
    title, body = entry

    greeting = f"Olá, {first_name(applicant_name)}!" if first_name(applicant_name) else "Olá!"
    parts = [f"{greeting}\n{title}", body, f"*Protocolo:* {protocol}"]

    comment = (comment or "").strip()
    if comment:
        if len(comment) > MAX_COMMENT_CHARS:
            comment = comment[:MAX_COMMENT_CHARS].rstrip() + "…"
        parts.append(f"_Mensagem do atendimento:_\n{comment}")

    parts.append(f"Acompanhe: {tracking_url(protocol)}")
    parts.append("_CISBAF_")
    return "\n\n".join(parts)
