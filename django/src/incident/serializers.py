# serializers.py
from rest_framework import serializers
from .models import Incident

class IncidentSerializer(serializers.ModelSerializer):
    """
    Serializer responsável por validar e serializar os dados da ocorrência.

    Utilizado na criação de uma solicitação de documentos, vinculando
    a ocorrência ao DocumentRequest posteriormente.

    O campo "document" é excluído e as validações do model Incident
    são executadas via full_clean().
    """

    class Meta:
        model = Incident
        exclude = ["document"]

    def validate(self, attrs):
        instance = Incident(**attrs)
        instance.full_clean(exclude=["document"])
        return attrs