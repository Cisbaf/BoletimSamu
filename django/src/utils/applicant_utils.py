import re
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator

validar_email = EmailValidator(message="Informe um e-mail válido.")

def validar_cpf(value):
    cpf = re.sub(r'[^0-9]', '', value)

    if len(cpf) != 11:
        raise ValidationError("CPF deve ter 11 dígitos.")

    if cpf == cpf[0] * 11:
        raise ValidationError("CPF inválido.")

    # Validação dos dígitos verificadores
    for i in range(9, 11):
        soma = sum(int(cpf[num]) * ((i + 1) - num) for num in range(0, i))
        digito = ((soma * 10) % 11) % 10
        if digito != int(cpf[i]):
            raise ValidationError("CPF inválido.")

def validar_rg(value: str):
    """
    Valida RG brasileiro de forma estrutural.

    Regras adotadas:
    - Remove pontos, hífens e barras antes de validar
    - Deve ter entre 7 e 9 caracteres após limpeza
    - Pode conter apenas dígitos, ou dígitos + 'X' como último caractere (padrão SP)
    """

    if not value:
        return

    rg = re.sub(r"[.\-/]", "", value).upper()

    if not re.fullmatch(r"[0-9]{6,8}[0-9X]", rg):
        raise ValidationError(
            "RG inválido. Deve conter de 7 a 9 dígitos (o último pode ser 'X')."
        )


def validar_celular(value: str):
    """
    Valida número de telefone brasileiro (celular ou fixo).

    Regras adotadas:
    - Remove qualquer caractere não numérico antes de validar
    - Celular: DDD (2 dígitos) + 9 + 8 dígitos = 11 dígitos
    - Fixo:    DDD (2 dígitos) + 8 dígitos       = 10 dígitos
    """

    if not value:
        return

    telefone = re.sub(r"[^0-9]", "", value)

    if len(telefone) not in (10, 11):
        raise ValidationError("Telefone inválido. Use DDD + número (10 ou 11 dígitos).")

    if int(telefone[:2]) < 11:
        raise ValidationError("DDD inválido.")

    if len(telefone) == 11 and telefone[2] != "9":
        raise ValidationError("Celular deve começar com 9 após o DDD.")