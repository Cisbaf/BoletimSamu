# serializers.py
from rest_framework import serializers
from .models import DocumentRequest, DocumentStatus
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

class DocumentSimpleDetailSerializer(serializers.ModelSerializer):
    applicant_name = serializers.SerializerMethodField()
    status = DocumentStatusDetailSerializer(
        many=True,
        read_only=True
    )

    def get_applicant_name(self, obj):
        return obj.applicant.full_name
    
    class Meta:
        model = DocumentRequest
        fields = ["id", "protocol", "applicant_name", "status", "created_at"]


class DocumentRequestDetailSerializer(serializers.ModelSerializer):
    applicant = ApplicantSerializer(read_only=True)
    incident = IncidentSerializer(read_only=True)
    status = DocumentStatusDetailSerializer(
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
        applicant_data = data.get("applicant", {})
        files = data.get("documents", [])
        types = data.get("document_types", [])
                
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
                "relationship_degree": applicant_data.get("relationship_degree")
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
