from django.db import models
from applicant.models import Applicant
from django.core.exceptions import ValidationError


class DocumentType(models.TextChoices):
    """
    Representa um documento enviado pelo solicitante.

    Cada registro armazena:
    - O tipo do documento (ex: identidade, procuração, certidão)
    - O arquivo enviado
    - A data de upload

    Os documentos são vinculados ao solicitante e utilizados
    para validar se todos os arquivos obrigatórios foram fornecidos.
    """

    PATIENT_ID = "PATIENT_ID", "Documento com foto do paciente"
    APPLICANT_ID = "APPLICANT_ID", "Documento com foto do solicitante"
    MARRIAGE_CERTIFICATE = "MARRIAGE_CERTIFICATE", "Certidão de casamento / União estável"
    POWER_OF_ATTORNEY = "POWER_OF_ATTORNEY", "Procuração específica"


class ApplicantDocument(models.Model):
    applicant = models.ForeignKey(
        Applicant,
        on_delete=models.CASCADE,
        related_name="documents"
    )

    document_type = models.CharField(
        "Tipo de documento",
        max_length=40,
        choices=DocumentType.choices
    )

    file = models.FileField(
        "Arquivo",
        upload_to="applicants/documents/%Y/%m/"
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.document_type} > {self.applicant.full_name}"
    
    class Meta:
        verbose_name = "Documento do solicitante"
        verbose_name_plural = "Documentos do solicitante"
