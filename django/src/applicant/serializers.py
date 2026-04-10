# serializers.py
from rest_framework import serializers
from .models import Applicant


class ApplicantSerializer(serializers.ModelSerializer):
    """
    Serializer responsável por validar e serializar os dados do solicitante.

    Utilizado durante a criação de uma solicitação de documentos.
    O campo "document" é excluído, pois o vínculo é feito internamente
    após a criação do DocumentRequest.

    Executa as validações de regra de negócio do model Applicant
    através do método full_clean().
    """

    class Meta:
        model = Applicant
        exclude = ["document"]

    def validate(self, attrs):
        instance = Applicant(**attrs)
        instance.full_clean(exclude=["document"])
        return attrs