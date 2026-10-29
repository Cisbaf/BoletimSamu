"""
Cliente do serviço de notificações por WhatsApp (contrato v1).

Regras de uso (da documentação do serviço):
- nunca bloquear a ação do usuário: o envio roda em thread própria, com
  timeout curto (3 s conecta / 8 s lê);
- nunca derrubar o app por falha de notificação: toda exceção é capturada;
- toda mensagem leva uma idempotency_key por evento, então o retry nunca
  duplica o envio;
- 429 respeita o Retry-After; 5xx/timeout tentam de novo com espera crescente;
- sem dado pessoal no log nem na `ref`.
"""
import logging
import re
import threading
import time

import requests
from django.conf import settings

logger = logging.getLogger("boletim.notifications")

CONNECT_TIMEOUT = 3
READ_TIMEOUT = 8
MAX_ATTEMPTS = 3
BACKOFF_SECONDS = (2, 5)
MAX_RETRY_AFTER = 30


def normalize_phone(phone):
    """
    Devolve só os dígitos do celular, ou None se não der para receber
    WhatsApp (vazio, tamanho inválido ou telefone fixo).
    """
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) not in (10, 11):
        return None
    # Fixo (DDD + 8 dígitos começando em 2-5) não recebe WhatsApp.
    if len(digits) == 10 and digits[2] in "2345":
        return None
    return digits


def is_enabled():
    return bool(getattr(settings, "NOTIFY_URL", ""))


def _retry_delay(response, attempt):
    if response is not None and response.status_code == 429:
        try:
            return min(int(response.headers.get("Retry-After", 5)), MAX_RETRY_AFTER)
        except (TypeError, ValueError):
            return BACKOFF_SECONDS[min(attempt, len(BACKOFF_SECONDS) - 1)]
    return BACKOFF_SECONDS[min(attempt, len(BACKOFF_SECONDS) - 1)]


def deliver(to, text, idempotency_key, ref=None):
    """
    Envia a mensagem de forma síncrona (com retry). Devolve True se o
    serviço aceitou (202/200). Nunca levanta exceção.
    """
    url = f"{settings.NOTIFY_URL.rstrip('/')}/v1/messages"
    headers = {"Authorization": f"Bearer {settings.NOTIFY_API_KEY}"}
    payload = {"to": to, "text": text, "idempotency_key": idempotency_key}
    if ref:
        payload["ref"] = ref

    for attempt in range(MAX_ATTEMPTS):
        response = None
        try:
            response = requests.post(
                url,
                json=payload,
                headers=headers,
                timeout=(CONNECT_TIMEOUT, READ_TIMEOUT),
            )
        except requests.RequestException as exc:
            logger.warning("Notificação %s: falha de rede (%s).", idempotency_key, type(exc).__name__)
        except Exception:
            logger.exception("Notificação %s: erro inesperado.", idempotency_key)
            return False
        else:
            if response.status_code in (200, 202):
                return True
            retryable = response.status_code == 429 or response.status_code >= 500
            if not retryable:
                # 400/401/403/413...: repetir não adianta.
                logger.error(
                    "Notificação %s recusada: HTTP %s %s.",
                    idempotency_key, response.status_code, _error_code(response),
                )
                return False
            logger.warning("Notificação %s: HTTP %s, tentando de novo.", idempotency_key, response.status_code)

        if attempt < MAX_ATTEMPTS - 1:
            time.sleep(_retry_delay(response, attempt))

    logger.error("Notificação %s não enviada após %s tentativas.", idempotency_key, MAX_ATTEMPTS)
    return False


def _error_code(response):
    try:
        return response.json()["error"]["code"]
    except Exception:
        return ""


def send_async(to, text, idempotency_key, ref=None):
    """Dispara o envio em segundo plano, sem bloquear quem chamou."""
    if not is_enabled():
        return
    threading.Thread(
        target=deliver,
        args=(to, text, idempotency_key, ref),
        name=f"notify-{idempotency_key}",
        daemon=True,
    ).start()
