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
    - Aceita apenas números, ponto e hífen
    - Remove pontuação antes de validar
    - Deve ter entre 7 e 9 dígitos numéricos
    """

    if not value:
        return

    # remove pontos e hífen
    rg = re.sub(r"[.\-]", "", value)

    if not rg.isdigit():
        raise ValidationError("RG deve conter apenas números.")

    if len(rg) < 7 or len(rg) > 9:
        raise ValidationError("RG deve conter entre 7 e 9 dígitos.")


def validar_celular(value: str):
    """
    Valida número de celular brasileiro.

    Regras adotadas:
    - Aceita máscara: (11) 99999-9999 ou 11999999999
    - Remove qualquer caractere não numérico
    - Deve conter 11 dígitos (DDD + número)
    - O número deve começar com 9 (padrão celular)
    """

    if not value:
        return

    # Remove tudo que não for número
    celular = re.sub(r"[^0-9]", "", value)

    if len(celular) != 11:
        raise ValidationError("Celular deve conter DDD + número (11 dígitos).")

    ddd = celular[:2]
    numero = celular[2:]

    if not ddd.isdigit() or int(ddd) < 11:
        raise ValidationError("DDD inválido.")

    if numero[0] != "9":
        raise ValidationError("Celular deve começar com 9 após o DDD.")