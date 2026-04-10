from django.test import TestCase
from ..serializers import IncidentSerializer


class IncidentSerializerTest(TestCase):
    """
    Testes do IncidentSerializer.

    Valida as regras de serialização e validação dos dados de ocorrência
    que serão vinculados a uma solicitação de documentos.

    Cenários cobertos:
    - Fluxo válido com todos os campos obrigatórios preenchidos
    - Erro quando o local de atendimento é "Outro" sem descrição adicional
    - Erro ao informar um município fora das opções permitidas
    - Erro quando um campo obrigatório não é enviado
    - Erro quando o motivo ultrapassa o limite de 50 caracteres
    - Erro quando as observações ultrapassam o limite de 150 caracteres
    - Validação de que não é necessário informar descrição adicional
    quando o atendimento ocorre em residência

    Os testes garantem que as restrições de formato, tamanho e regras
    condicionais do model Incident estão sendo corretamente aplicadas.
    """


    def get_valid_data(self):
        return {
            "date": "2026-01-29",
            "time": "14:35:00",
            "patient_name": "Maria da Silva",
            "city": "NOVA IGUAÇU",
            "neighborhood": "Centro",
            "address": "Rua Doutor Barros Júnior, 245",
            "reason": "Queda com possível fratura",
            "attendance_location": "OTH",
            "other_location_description": "Estabelecimento comercial",
            "occurrence_number": "OC-2026-000123",
            "notes": "Paciente consciente, relatando dor intensa na perna direita."
        }

    # ----------------------------
    # ✅ CASO VÁLIDO
    # ----------------------------
    def test_serializer_valid(self):
        serializer = IncidentSerializer(data=self.get_valid_data())
        self.assertTrue(serializer.is_valid(), serializer.errors)

    # ----------------------------
    # ❌ OTH sem descrição
    # ----------------------------
    def test_other_location_without_description(self):
        data = self.get_valid_data()
        data["other_location_description"] = ""
        serializer = IncidentSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("other_location_description", serializer.errors)

    # ----------------------------
    # ❌ Cidade inválida
    # ----------------------------
    def test_invalid_city_choice(self):
        data = self.get_valid_data()
        data["city"] = "RIO DE JANEIRO"

        serializer = IncidentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("city", serializer.errors)

    # ----------------------------
    # ❌ Campo obrigatório ausente
    # ----------------------------
    def test_missing_required_field(self):
        data = self.get_valid_data()
        del data["patient_name"]

        serializer = IncidentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("patient_name", serializer.errors)

    # ----------------------------
    # ❌ Motivo com mais de 50 caracteres
    # ----------------------------
    def test_reason_max_length(self):
        data = self.get_valid_data()
        data["reason"] = "A" * 51

        serializer = IncidentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("reason", serializer.errors)

    # ----------------------------
    # ❌ Observações com mais de 150 caracteres
    # ----------------------------
    def test_notes_max_length(self):
        data = self.get_valid_data()
        data["notes"] = "B" * 151

        serializer = IncidentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("notes", serializer.errors)

    # ----------------------------
    # ✅ RES não precisa de descrição
    # ----------------------------
    def test_residence_without_other_description(self):
        data = self.get_valid_data()
        data["attendance_location"] = "RES"
        data["other_location_description"] = ""

        serializer = IncidentSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
