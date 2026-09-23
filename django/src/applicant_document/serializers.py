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
_KIND_BY_EXTENSION = {
    ".pdf":  "PDF",
    ".jpg":  "imagem JPG",
    ".jpeg": "imagem JPG",
    ".png":  "imagem PNG",
}


# Leitores de PDF aceitam o cabeçalho "%PDF" em qualquer ponto dos primeiros
# 1024 bytes (alguns geradores deixam BOM ou lixo antes dele). Exigir o header
# no offset 0 rejeitava PDFs que abrem normalmente no celular, então a busca
# segue a mesma tolerância dos leitores. Para imagens a assinatura é exata.
_HEADER_READ_SIZE = 1024


def _has_valid_signature(ext, header):
    magic = _MAGIC_BYTES[ext]
    if ext == ".pdf":
        return magic in header
    return header.startswith(magic)


def _format_size(size):
    if size < 1024:
        return f"{size} B"
    if size < 1024 * 1024:
        return f"{size / 1024:.0f} KB"
    return f"{size / (1024 * 1024):.1f} MB"


def _validate_upload(f):
    """
    Valida um arquivo enviado: extensão, tamanho e assinatura do conteúdo.

    As mensagens são escritas para o cidadão que está preenchendo o
    formulário: além de dizer o que está errado, indicam o que ele pode
    fazer (reexportar o PDF, tirar uma foto do documento, etc.).
    """
    name = f.name or "arquivo"
    ext = os.path.splitext(name)[1].lower()

    if not ext:
        raise ValidationError(
            f"O arquivo '{name}' está sem extensão, então não é possível "
            "identificar o tipo. Renomeie para .pdf, .jpg ou .png, ou envie uma foto do documento."
        )

    if ext not in _ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Tipo de arquivo não permitido: '{name}' ({ext}). Envie PDF, JPG ou PNG."
        )

    if f.size == 0:
        raise ValidationError(
            f"O arquivo '{name}' chegou vazio (0 bytes). Isso costuma acontecer quando o "
            "arquivo é escolhido direto de um app de nuvem (Google Drive, iCloud, WhatsApp). "
            "Baixe o arquivo para o celular antes de anexar, ou envie uma foto do documento."
        )

    if f.size > _MAX_FILE_SIZE:
        raise ValidationError(
            f"Arquivo '{name}' tem {_format_size(f.size)} e excede o tamanho máximo de 10 MB."
        )

    try:
        header = f.read(_HEADER_READ_SIZE)
        f.seek(0)
    except OSError:
        raise ValidationError(
            f"Não foi possível ler o arquivo '{name}'. Tente anexá-lo novamente ou envie uma foto do documento."
        )

    if not _has_valid_signature(ext, header):
        kind = _KIND_BY_EXTENSION[ext]
        raise ValidationError(
            f"O conteúdo de '{name}' não corresponde ao tipo declarado ({ext}): "
            f"o arquivo não começa como um {kind} válido. Ele pode estar corrompido, "
            "protegido por senha ou ter sido apenas renomeado. Abra o arquivo, salve/exporte "
            "novamente como PDF ou envie uma foto do documento."
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