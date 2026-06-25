import json


def convert_document_multipart_to_json(data, files):
    """
    Converte dados de uma requisição multipart/form-data em um dicionário estruturado.

    Essa função é responsável por transformar os dados recebidos via multipart
    (comumente utilizados em uploads de arquivos) em um formato compatível com
    o serializer da aplicação.

    Principais responsabilidades:
    - Converter campos JSON serializados como string em objetos Python
    - Normalizar listas vindas de QueryDict (ex: document_types)
    - Extrair múltiplos arquivos enviados no campo 'documents'
    - Garantir que o output tenha uma estrutura consistente

    Parâmetros:
        data (QueryDict | dict):
            Dados da requisição. Pode conter:
            - Strings JSON (ex: applicant, incident)
            - Listas (ex: document_types)
            - Arquivos isolados (em alguns casos)

        files (MultiValueDict):
            Arquivos enviados na requisição (request.FILES),
            podendo conter múltiplos arquivos no campo 'documents'.

    Comportamento:
        - 'applicant' e 'incident':
            Se forem strings JSON válidas, serão convertidos para dict.
            Caso contrário, permanecem inalterados.

        - 'document_types':
            Sempre convertido para lista usando getlist() quando disponível.

        - 'documents':
            - Se vier em files: usa getlist()
            - Se vier em data como arquivo único: converte para lista

    Retorno:
        dict com estrutura padronizada:
        {
            "purpose": str | None,
            "applicant": dict,
            "incident": dict,
            "document_types": list[str],
            "documents": list[UploadedFile]
        }

    Observações:
        - A função é tolerante a erros de parsing JSON
        - Garante consistência mesmo com inputs incompletos
        - Não realiza validações de negócio (isso é papel do serializer)

    Exemplo de uso:
        processed_data = convert_document_multipart_to_json(
            request.data,
            request.FILES
        )
    """
    applicant = data.get('applicant', {})
    try:
        applicant = json.loads(applicant)
    except (json.JSONDecodeError, TypeError):
        pass

    incident = data.get('incident', {})
    try:
        incident = json.loads(incident)
    except (json.JSONDecodeError, TypeError):
        pass

    document_types = (
        data.getlist('document_types')
        if hasattr(data, 'getlist')
        else data.get('document_types', [])
    )

    if 'documents' in files:
        documents = files.getlist('documents')
    else:
        raw = data.get('documents')
        documents = [raw] if raw and hasattr(raw, 'file') else []

    return {
        'purpose': data.get('purpose'),
        'other_purpose': data.get('other_purpose', ''),
        'applicant': applicant,
        'incident': incident,
        'document_types': document_types,
        'documents': documents,
    }