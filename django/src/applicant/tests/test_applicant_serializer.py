from django.test import TestCase
from ..serializers import ApplicantSerializer


class ApplicantSerializerTest(TestCase):
    """
    Testes do ApplicantSerializer.

    Verifica as validações aplicadas aos dados do solicitante durante
    o processo de criação de uma solicitação de documentos.

    Cenários cobertos:
    - Fluxo válido quando o solicitante é o próprio paciente
    - Erro quando campos obrigatórios não são informados
    - Erro quando o solicitante é representante e não informa grau de parentesco
    - Erro quando o solicitante é paciente e informa grau de parentesco
    - Erro ao informar CPF inválido
    - Erro ao informar RG em formato inválido
    - Erro ao informar e-mail inválido
    - Erro ao informar telefone em formato inválido

    Esses testes asseguram que as regras de negócio e validações de formato
    dos dados pessoais do solicitante estão sendo corretamente aplicadas.
    """

    # -------------------------------------------------
    # 🔧 DADOS BASE VÁLIDOS (PACIENTE)
    # -------------------------------------------------
    def get_valid_patient_data(self):
        return {
            "applicant_type": "PATIENT",
            "full_name": "João da Silva",
            "cpf": "187.149.337-48",
            "rg": "287557672",
            "email": "joao.silva@email.com",
            "address": "Rua A, 123 - Centro - São Paulo/SP",
            "phone": "(11) 99999-9999"
        }

    # -------------------------------------------------
    # ✅ CASO VÁLIDO — PACIENTE
    # -------------------------------------------------
    def test_serializer_valid_patient(self):
        serializer = ApplicantSerializer(data=self.get_valid_patient_data())
        self.assertTrue(serializer.is_valid(), serializer.errors)

    # -------------------------------------------------
    # ❌ SEM CAMPOS OBRIGATÓRIOS
    # -------------------------------------------------
    def test_serializer_without_required_fields(self):
        serializer = ApplicantSerializer(data={})

        self.assertFalse(serializer.is_valid())
        self.assertIn("applicant_type", serializer.errors)
        self.assertIn("full_name", serializer.errors)
        self.assertIn("cpf", serializer.errors)
        self.assertIn("rg", serializer.errors)
        self.assertIn("email", serializer.errors)
        self.assertIn("address", serializer.errors)
        self.assertIn("phone", serializer.errors)

    # -------------------------------------------------
    # ❌ REPRESENTANTE SEM GRAU DE PARENTESCO
    # Regra de negócio:
    # Se applicant_type = REPRESENTATIVE, relationship_degree é obrigatório
    # -------------------------------------------------
    def test_representative_without_relationship_degree(self):
        data = self.get_valid_patient_data()
        data["applicant_type"] = "REPRESENTATIVE"

        serializer = ApplicantSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("relationship_degree", serializer.errors)

    # -------------------------------------------------
    # ❌ PACIENTE NÃO PODE TER GRAU DE PARENTESCO
    # Regra de negócio:
    # relationship_degree só deve existir para REPRESENTATIVE
    # -------------------------------------------------
    def test_patient_with_relationship_degree(self):
        data = self.get_valid_patient_data()
        data["relationship_degree"] = "FAMILY"

        serializer = ApplicantSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("relationship_degree", serializer.errors)

    # -------------------------------------------------
    # ❌ CPF INVÁLIDO
    # Deve falhar na validação de CPF (dígitos verificadores)
    # -------------------------------------------------
    def test_invalid_cpf(self):
        data = self.get_valid_patient_data()
        data["cpf"] = "111.111.111-11"

        serializer = ApplicantSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("cpf", serializer.errors)

    # -------------------------------------------------
    # ❌ RG INVÁLIDO (tamanho/formato incorreto)
    # -------------------------------------------------
    def test_invalid_rg(self):
        data = self.get_valid_patient_data()
        data["rg"] = "123456"  # menor que o esperado

        serializer = ApplicantSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("rg", serializer.errors)

    # -------------------------------------------------
    # ❌ EMAIL INVÁLIDO
    # -------------------------------------------------
    def test_invalid_email(self):
        data = self.get_valid_patient_data()
        data["email"] = "email-invalido"

        serializer = ApplicantSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    # -------------------------------------------------
    # ❌ TELEFONE INVÁLIDO
    # (caso exista validação de formato)
    # -------------------------------------------------
    def test_invalid_phone(self):
        data = self.get_valid_patient_data()
        data["phone"] = "999999"

        serializer = ApplicantSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("phone", serializer.errors)
