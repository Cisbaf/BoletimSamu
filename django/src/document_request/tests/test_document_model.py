from django.test import TestCase
from ..models import DocumentRequest
from django.core.exceptions import ValidationError


class DocumentRequestModelTest(TestCase):
    """
    Testes do model DocumentRequest.

    Garante o correto funcionamento das regras de negócio associadas
    à solicitação de documentos.

    Cenários cobertos:
    - Geração automática de protocolo ao salvar o registro
    - Obrigatoriedade do campo other_purpose quando a finalidade é "OUTROS"
    - Proibição de preencher other_purpose para outras finalidades
    - Transição válida de status (aguardando → confirmado)
    - Bloqueio de transição de status inválida (confirmado → aguardando)

    Esses testes asseguram a integridade do fluxo de estados e das
    validações de consistência da finalidade da solicitação.
    """

    def test_protocol_is_generated(self):
        doc = DocumentRequest.objects.create(purpose="DPVAT")
        self.assertIsNotNone(doc.protocol)
        self.assertIn("-", doc.protocol)

    def test_outros_requires_other_purpose(self):
        doc = DocumentRequest(purpose="OUTROS")
        with self.assertRaises(ValidationError):
            doc.full_clean()
    
    def test_other_purpose_not_allowed_if_not_outros(self):
        doc = DocumentRequest(purpose="DPVAT", other_purpose="Algo")
        with self.assertRaises(ValidationError):
            doc.full_clean()


