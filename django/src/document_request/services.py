from document_request.models import DocumentRequest
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