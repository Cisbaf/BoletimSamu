import logging
import uuid

from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger("boletim.api")


def api_exception_handler(exc, context):
    """
    Handler de exceções da API.

    O DRF só sabe transformar em JSON as exceções que ele conhece
    (ValidationError, Throttled, NotFound...). Qualquer outra exceção
    virava um HTML de "Server Error (500)" do Django — que o frontend não
    consegue interpretar, resultando em "Ocorreu um erro inesperado." sem
    nenhuma pista do motivo real.

    Aqui garantimos que:
    - toda resposta de erro é JSON com a chave "detail";
    - o traceback vai para o log (stdout do container) com um código curto;
    - o mesmo código é devolvido ao usuário, permitindo casar o relato
      dele com a linha exata do log.
    """
    response = drf_exception_handler(exc, context)

    if response is not None:
        return response

    error_id = uuid.uuid4().hex[:8].upper()
    request = context.get("request")

    logger.exception(
        "Erro não tratado [%s] em %s %s",
        error_id,
        getattr(request, "method", "?"),
        getattr(request, "path", "?"),
    )

    return Response(
        {
            "detail": (
                "Erro interno no servidor ao processar a solicitação. "
                f"Tente novamente; se o problema continuar, informe o código {error_id} ao suporte."
            ),
            "error_id": error_id,
        },
        status=500,
    )
