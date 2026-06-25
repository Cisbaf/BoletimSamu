import os

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from .models import ApplicantDocument
from applicant.serializers import Applicant
from applicant_document.models import ApplicantDocument, DocumentType
from utils.document_validate import get_required_docs

_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
_ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
_MAGIC_BYTES = {
    ".pdf":  b"%PDF",
    ".jpg":  b"\xff\xd8\xff",
    ".jpeg": b"\xff\xd8\xff",
    ".png":  b"\x89PNG",
}


def _validate_upload(f):
    ext = os.path.splitext(f.name)[1].lower()
    if ext not in _ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Tipo de arquivo não permitido: '{f.name}'. Envie PDF, JPG ou PNG."
        )
    if f.size > _MAX_FILE_SIZE:
        raise ValidationError(
            f"Arquivo '{f.name}' excede o tamanho máximo de 10 MB."
        )
    header = f.read(8)
    f.seek(0)
    if not header.startswith(_MAGIC_BYTES[ext]):
        raise ValidationError(
            f"O conteúdo de '{f.name}' não corresponde ao tipo declarado ({ext})."
        )


class ApplicantDocumentDetailSerializer(serializers.ModelSerializer):
    fileUrl = serializers.FileField(source="file")

    class Meta:
        model = ApplicantDocument
        fields = ["id", "document_type", "fileUrl"]
        

class ApplicantDocumentRequestSerializer(serializers.Serializer):
    files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )

    types = serializers.ListField(
        child=serializers.ChoiceField(choices=DocumentType.choices),
        write_only=True,
        required=False
    )
    
    def validate(self, attrs):
        files = attrs.get("files", [])
        types = attrs.get("types", [])

        for f in files:
            _validate_upload(f)

        # 👇 agora vem do context
        applicant_type = self.context.get("applicant_type")
        purpose = self.context.get("purpose")
        relationship_degree = self.context.get("relationship_degree")

        if not applicant_type:
            raise ValidationError("Tipo de solicitante não informado.")
        
        if not purpose:
            raise ValidationError("Purpose não informado.")
        
        if applicant_type == Applicant.ApplicantType.REPRESENTATIVE and not relationship_degree:
            raise ValidationError("Parentesco é obrigatório para representante.")

        required_docs = set(get_required_docs(applicant_type, purpose, relationship_degree))
        sent_docs = set(types)

        # 1️⃣ quantidade
        if len(files) != len(types):
            raise ValidationError("Quantidade de arquivos diferente da quantidade de tipos de documento.")

        # 2️⃣ duplicidade
        if len(types) != len(set(types)):
            raise ValidationError("Tipos de documento duplicados.")
        
        # 3️⃣ inválidos
        invalid = sent_docs - required_docs
        if invalid:
            readable = ", ".join(dict(DocumentType.choices)[d] for d in invalid)
            raise ValidationError(f"Documento(s) não permitido(s): {readable}")
        
        # 4️⃣ faltando
        missing = required_docs - sent_docs
        if missing:
            readable = ", ".join(dict(DocumentType.choices)[d] for d in missing)
            raise ValidationError(f"Faltam documentos obrigatórios: {readable}")

        return attrs