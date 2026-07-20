# serializers.py
import json
import re
from rest_framework import serializers
from .models import (
    DocumentRequest,
    DocumentStatus,
    DocumentRectification,
    DocumentRectificationStatus,
    DocumentCorrection,
    DocumentCorrectionField,
    DocumentCorrectionStatus,
)
from .correction_fields import CorrectionFieldKey
from .services import (
    get_pending_correction,
    group_correction_values,
    split_correction_field_key,
    validate_correction_values,
)
from applicant.serializers import ApplicantSerializer, Applicant
from incident.serializers import IncidentSerializer, Incident
from applicant_document.models import DocumentType, ApplicantDocument
from applicant_document.serializers import ApplicantDocumentDetailSerializer, ApplicantDocumentRequestSerializer, _validate_upload
from django.db import transaction
from django.utils.timezone import now


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


class DocumentCorrectionFieldDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentCorrectionField
        fields = [
            "id",
            "correction",
            "field_key",
            "field_label",
            "admin_comment",
            "new_value",
            "new_file",
            "submitted_at",
        ]


class DocumentCorrectionStatusDetailSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", default=None)

    class Meta:
        model = DocumentCorrectionStatus
        fields = ["id", "correction", "comment", "status", "user_name", "created_at"]


class DocumentCorrectionDetailSerializer(serializers.ModelSerializer):
    """
    Representação de uma correção de preenchimento para exibição na linha
    do tempo do pedido (pública e administrativa).
    """
    fields = DocumentCorrectionFieldDetailSerializer(many=True, read_only=True)
    status = DocumentCorrectionStatusDetailSerializer(many=True, read_only=True)

    class Meta:
        model = DocumentCorrection
        fields = ["id", "document", "fields", "status", "created_at"]


class CorrectionFieldInputSerializer(serializers.Serializer):
    field_key = serializers.ChoiceField(choices=CorrectionFieldKey.choices)
    comment = serializers.CharField(max_length=1000)

    def validate_comment(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Informe o comentário do campo.")
        return value.strip()


class DocumentCorrectionCreateSerializer(serializers.Serializer):
    """
    Valida e abre uma correção de preenchimento para um pedido aguardando.

    A view resolve o DocumentRequest a partir do PK (retornando 404 se não
    encontrado) e injeta o documento no contexto. Regras de negócio:
    - o pedido precisa estar com o último status "aguardando"
    - não pode haver outra correção nem retificação em andamento
    - pelo menos um campo apontado, sem field_key duplicado
    - campos attachment.<TYPE> só se existir anexo daquele tipo no pedido
    """
    fields = CorrectionFieldInputSerializer(many=True, allow_empty=False)

    def validate(self, data):
        document = self.context["document"]

        last_status = document.status.order_by("-created_at").first()
        if last_status is None or last_status.status != DocumentStatus.StatusChoices.AGUARDANDO:
            raise serializers.ValidationError({
                "detail": "Somente pedidos aguardando análise podem receber correção de preenchimento."
            })

        if document.has_open_correction():
            raise serializers.ValidationError({
                "detail": "Já existe uma correção de preenchimento em andamento para este pedido."
            })

        if document.has_open_rectification():
            raise serializers.ValidationError({
                "detail": "Já existe uma retificação em andamento para este pedido."
            })

        field_keys = [item["field_key"] for item in data["fields"]]
        if len(field_keys) != len(set(field_keys)):
            raise serializers.ValidationError({
                "fields": "Campos duplicados na correção."
            })

        applicant = getattr(document, "applicant", None)
        for field_key in field_keys:
            model_key, type_name = split_correction_field_key(field_key)
            if model_key != "attachment":
                continue
            has_attachment = applicant is not None and ApplicantDocument.objects.filter(
                applicant=applicant, document_type=type_name
            ).exists()
            if not has_attachment:
                raise serializers.ValidationError({
                    "fields": f"O pedido não possui anexo do tipo '{type_name}'."
                })

        return data

    def create(self, validated_data):
        document = self.context["document"]

        with transaction.atomic():
            correction = DocumentCorrection.objects.create(document=document)
            for item in validated_data["fields"]:
                DocumentCorrectionField.objects.create(
                    correction=correction,
                    field_key=item["field_key"],
                    field_label=CorrectionFieldKey(item["field_key"]).label,
                    admin_comment=item["comment"],
                )
        return correction


class DocumentCorrectionSubmitSerializer(serializers.Serializer):
    """
    Valida e registra o envio, pelo cidadão, das respostas de uma correção
    de preenchimento pendente.

    A view resolve o DocumentRequest pelo protocolo (identificador público)
    e injeta documento e arquivos no contexto. Regras:
    - o CPF informado precisa conferir com o do solicitante cadastrado
    - precisa existir correção com último status "pendente"
    - todos os campos apontados devem ser respondidos (texto ou arquivo,
      conforme o tipo) e nenhum campo não-apontado é aceito
    - valores de texto são validados pelos serializers/validadores
      existentes; arquivos pela mesma validação de upload dos anexos
    """
    cpf = serializers.CharField(write_only=True)
    answers = serializers.CharField(write_only=True, required=False, allow_blank=True, default="[]")

    def validate_cpf(self, value):
        digits = re.sub(r"\D", "", value or "")
        if len(digits) != 11:
            raise serializers.ValidationError("CPF inválido.")
        return digits

    def validate_answers(self, value):
        try:
            parsed = json.loads(value or "[]")
        except (TypeError, json.JSONDecodeError):
            raise serializers.ValidationError("Formato inválido: answers deve ser um JSON válido.")

        if not isinstance(parsed, list):
            raise serializers.ValidationError("Formato inválido: answers deve ser uma lista.")

        for item in parsed:
            if not isinstance(item, dict) or "field_key" not in item or "value" not in item:
                raise serializers.ValidationError(
                    "Cada resposta deve conter 'field_key' e 'value'."
                )
        return parsed

    def validate(self, data):
        document = self.context["document"]
        files = self.context.get("files") or {}

        applicant = getattr(document, "applicant", None)
        applicant_cpf = re.sub(r"\D", "", applicant.cpf) if applicant and applicant.cpf else ""

        if not applicant_cpf or data["cpf"] != applicant_cpf:
            raise serializers.ValidationError({
                "cpf": "O CPF informado não confere com o solicitante desta solicitação."
            })

        correction = get_pending_correction(document)
        if correction is None:
            raise serializers.ValidationError({
                "detail": "Não há correção de preenchimento pendente para este pedido."
            })

        fields_by_key = {f.field_key: f for f in correction.fields.all()}
        text_keys = {
            key for key in fields_by_key
            if split_correction_field_key(key)[0] != "attachment"
        }
        attachment_keys = set(fields_by_key) - text_keys

        answers_list = data.get("answers", [])
        answers = {item["field_key"]: item["value"] for item in answers_list}
        if len(answers) != len(answers_list):
            raise serializers.ValidationError({
                "answers": "Respostas duplicadas para o mesmo campo."
            })

        extra_answers = set(answers) - text_keys
        if extra_answers:
            raise serializers.ValidationError({
                "answers": f"Campo(s) não apontado(s) na correção: {', '.join(sorted(extra_answers))}."
            })

        missing_answers = text_keys - set(answers)
        if missing_answers:
            raise serializers.ValidationError({
                "answers": f"Faltam respostas para: {', '.join(sorted(missing_answers))}."
            })

        for key, value in answers.items():
            if not isinstance(value, str) or not value.strip():
                raise serializers.ValidationError({
                    "answers": f"Informe um valor para '{key}'."
                })

        file_keys = set(files.keys())
        extra_files = file_keys - attachment_keys
        if extra_files:
            raise serializers.ValidationError({
                "files": f"Arquivo(s) não apontado(s) na correção: {', '.join(sorted(extra_files))}."
            })

        missing_files = attachment_keys - file_keys
        if missing_files:
            raise serializers.ValidationError({
                "files": f"Faltam arquivos para: {', '.join(sorted(missing_files))}."
            })

        for key in attachment_keys:
            _validate_upload(files[key])

        # Reutiliza os serializers/validadores existentes (sem salvar nada)
        cleaned_answers = {key: value.strip() for key, value in answers.items()}
        applicant_data, incident_data, document_data = group_correction_values(
            cleaned_answers.items()
        )
        validate_correction_values(document, applicant_data, incident_data, document_data)

        data["_correction"] = correction
        data["_answers"] = cleaned_answers
        data["_files"] = {key: files[key] for key in attachment_keys}
        return data

    def create(self, validated_data):
        correction = validated_data["_correction"]
        answers = validated_data["_answers"]
        files = validated_data["_files"]

        with transaction.atomic():
            submitted_at = now()
            for field in correction.fields.all():
                if field.field_key in files:
                    field.new_file = files[field.field_key]
                else:
                    field.new_value = answers[field.field_key]
                field.submitted_at = submitted_at
                field.save()

            last_status = correction.status.order_by("-created_at").first()
            last_status.change_status(DocumentCorrectionStatus.StatusChoices.ENVIADA)

        return correction


class DocumentSimpleDetailSerializer(serializers.ModelSerializer):
    applicant_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    status = DocumentStatusDetailSerializer(
        many=True,
        read_only=True
    )
    rectifications = DocumentRectificationDetailSerializer(
        many=True,
        read_only=True
    )
    corrections = DocumentCorrectionDetailSerializer(
        many=True,
        read_only=True
    )

    def get_applicant_name(self, obj):
        return obj.applicant.full_name

    def get_patient_name(self, obj):
        incident = getattr(obj, "incident", None)
        return incident.patient_name if incident else None

    class Meta:
        model = DocumentRequest
        fields = ["id", "protocol", "applicant_name", "patient_name", "status", "rectifications", "corrections", "created_at"]


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
    corrections = DocumentCorrectionDetailSerializer(
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
