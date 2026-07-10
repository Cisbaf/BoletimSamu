# serializers.py
import re
from rest_framework import serializers
from .models import (
    DocumentRequest,
    DocumentStatus,
    DocumentRectification,
    DocumentRectificationStatus,
)
from applicant.serializers import ApplicantSerializer, Applicant
from incident.serializers import IncidentSerializer, Incident
from applicant_document.models import DocumentType, ApplicantDocument
from applicant_document.serializers import ApplicantDocumentDetailSerializer, ApplicantDocumentRequestSerializer
from django.db import transaction


class DocumentStatusDetailSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", default=None)

    class Meta:
        model = DocumentStatus
        fields = ["id", "document", "comment", "status", "user_name", "created_at"]

class DocumentStatusSerializer(serializers.ModelSerializer):

    class Meta:
        model = DocumentStatus
        fields = "__all__"

class DocumentRectificationStatusDetailSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", default=None)

    class Meta:
        model = DocumentRectificationStatus
        fields = ["id", "rectification", "comment", "status", "user_name", "created_at"]


class DocumentRectificationDetailSerializer(serializers.ModelSerializer):
    """
    Representação de uma retificação para exibição na linha do tempo do
    pedido (pública e administrativa). O CPF usado para confirmar a
    identidade não é exposto na resposta.
    """
    status = DocumentRectificationStatusDetailSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = DocumentRectification
        fields = ["id", "document", "status", "reason", "created_at"]


class DocumentRectificationCreateSerializer(serializers.Serializer):
    """
    Valida e abre um protocolo de retificação para um pedido já confirmado.

    A view resolve o DocumentRequest a partir do protocolo (retornando 404
    se não encontrado) e injeta o documento no contexto. Este serializer
    cuida apenas das regras de negócio da abertura da retificação:
    - o pedido precisa estar confirmado
    - o CPF informado precisa conferir com o do solicitante cadastrado
    - não pode haver outra retificação em andamento para o mesmo pedido
    - o motivo da retificação é obrigatório
    """
    cpf = serializers.CharField(write_only=True)
    reason = serializers.CharField(write_only=True, max_length=500)

    def validate_cpf(self, value):
        digits = re.sub(r"\D", "", value or "")
        if len(digits) != 11:
            raise serializers.ValidationError("CPF inválido.")
        return digits

    def validate_reason(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Informe o motivo da retificação.")
        return value.strip()

    def validate(self, data):
        document = self.context["document"]

        last_status = document.status.order_by("-created_at").first()
        if last_status is None or last_status.status != DocumentStatus.StatusChoices.CONFIRMADO:
            raise serializers.ValidationError({
                "detail": "Somente pedidos confirmados podem ser retificados."
            })

        applicant = getattr(document, "applicant", None)
        applicant_cpf = re.sub(r"\D", "", applicant.cpf) if applicant and applicant.cpf else ""

        if not applicant_cpf or data["cpf"] != applicant_cpf:
            raise serializers.ValidationError({
                "cpf": "O CPF informado não confere com o solicitante desta solicitação."
            })

        if document.has_open_rectification():
            raise serializers.ValidationError({
                "detail": "Já existe uma retificação em andamento para este pedido."
            })

        return data

    def create(self, validated_data):
        document = self.context["document"]
        return DocumentRectification.objects.create(
            document=document,
            requested_cpf=validated_data["cpf"],
            reason=validated_data["reason"],
        )


class DocumentSimpleDetailSerializer(serializers.ModelSerializer):
    applicant_name = serializers.SerializerMethodField()
    status = DocumentStatusDetailSerializer(
        many=True,
        read_only=True
    )
    rectifications = DocumentRectificationDetailSerializer(
        many=True,
        read_only=True
    )

    def get_applicant_name(self, obj):
        return obj.applicant.full_name

    class Meta:
        model = DocumentRequest
        fields = ["id", "protocol", "applicant_name", "status", "rectifications", "created_at"]


class DocumentRequestDetailSerializer(serializers.ModelSerializer):
    applicant = ApplicantSerializer(read_only=True)
    incident = IncidentSerializer(read_only=True)
    status = DocumentStatusDetailSerializer(
        many=True,
        read_only=True
    )
    rectifications = DocumentRectificationDetailSerializer(
        many=True,
        read_only=True
    )
    documents = ApplicantDocumentDetailSerializer(
        source="applicant.documents",
        many=True,
        read_only=True
    )

    class Meta:
        model = DocumentRequest
        fields = "__all__"


class DocumentRequestSerializer(serializers.ModelSerializer):
    """
    Serializers responsáveis pela criação de solicitações de documentos.

    O DocumentRequestSerializer permite criar, em uma única requisição:
    - A solicitação (DocumentRequest)
    - O solicitante (Applicant)
    - O incidente (Incident)
    - Os documentos enviados (ApplicantDocument)

    Também realiza validações importantes:
    - Garante que a quantidade de arquivos enviados é igual à quantidade de tipos informados
    - Impede tipos de documentos duplicados
    - Verifica se os documentos enviados são permitidos para o tipo de solicitante
    - Confere se todos os documentos obrigatórios foram enviados

    A criação é feita de forma atômica (transaction.atomic), garantindo integridade
    dos dados caso ocorra qualquer erro durante o processo.
    """

    applicant = ApplicantSerializer()
    incident = IncidentSerializer()

    documents = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )

    document_types = serializers.ListField(
        child=serializers.ChoiceField(choices=DocumentType.choices),
        write_only=True,
        required=False
    )

    class Meta:
        model = DocumentRequest
        fields = "__all__"

    def validate(self, data):
        purpose = data.get("purpose")
        other_purpose = data.get("other_purpose") or ""
        applicant_data = data.get("applicant", {})
        files = data.get("documents", [])
        types = data.get("document_types", [])

        # Regra de other_purpose — espelha DocumentRequest.clean() para que
        # a validação também rode na criação via API (objects.create não chama full_clean).
        if purpose == DocumentRequest.Purpose.OUTROS and not other_purpose.strip():
            raise serializers.ValidationError({
                "other_purpose": "Informe o motivo quando a finalidade for 'Outros'."
            })

        if purpose != DocumentRequest.Purpose.OUTROS and other_purpose.strip():
            raise serializers.ValidationError({
                "other_purpose": "Este campo só deve ser preenchido quando a finalidade for 'Outros'."
            })

        if (
            purpose == DocumentRequest.Purpose.OBITO
            and applicant_data.get("applicant_type") == Applicant.ApplicantType.PATIENT
            ):
            raise serializers.ValidationError({
                "relationship_degree": "O paciente não pode preencher um óbito!"
            })
        
        doc_serializer = ApplicantDocumentRequestSerializer(
            data={
                "files": files,
                "types": types
            },
            context={
                "applicant_type": applicant_data.get("applicant_type"),
                "relationship_degree": applicant_data.get("relationship_degree"),
                "purpose": purpose
            }
        )
        
        doc_serializer.is_valid(raise_exception=True)
       
        return data
    
    def create(self, validated_data):
        applicant_data = validated_data.pop("applicant")
        incident = validated_data.pop("incident")
        documents = validated_data.pop("documents", [])
        document_types = validated_data.pop("document_types", [])

        with transaction.atomic():
            document = DocumentRequest.objects.create(**validated_data)
            applicant = Applicant.objects.create(
                document=document,
                **applicant_data
            )
            Incident.objects.create(
                document=document,
                **incident
            )
            # salva os arquivos vinculados ao applicant
            for file, doc_type in zip(documents, document_types):
                ApplicantDocument.objects.create(
                    applicant=applicant,
                    document_type=doc_type,
                    file=file
                )

        return document
