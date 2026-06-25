from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from document_request.models import DocumentRequest
import re
from utils.applicant_utils import validar_cpf, validar_rg, validar_celular, validar_email

class Applicant(models.Model):
    """
    Representa o solicitante vinculado a uma solicitação de documentos.

    Pode ser o próprio paciente ou um representante. Armazena dados
    pessoais e de contato, além do grau de parentesco quando aplicável.

    Regras de negócio:
    - Representantes devem informar o grau de parentesco
    - Pacientes não podem informar grau de parentesco
    - Para solicitações de óbito, o solicitante não pode ser o paciente
    - CPF, RG e telefone são normalizados para conter apenas números

    As validações são executadas automaticamente antes de salvar o modelo.
    """

    class ApplicantType(models.TextChoices):
        """
        Define o tipo de solicitante.
        """
        PATIENT = "PATIENT", _("Paciente")
        REPRESENTATIVE = "REPRESENTATIVE", _("Representante")

    class RelationshipDegree(models.TextChoices):
        """
        Define o grau de parentesco quando o solicitante
        não é o próprio paciente.
        """
        FAMILY = "FAMILY", _("Pais / Demais familiares")
        SPOUSE = "SPOUSE", _("Cônjuge ou Companheiro")
        ATTORNEY = "ATTORNEY", _("Procurador")

    applicant_type = models.CharField(
        _("Solicitante é"),
        max_length=20,
        choices=ApplicantType.choices,
        db_column="tipo_solicitante",
        help_text=_("Informe se o solicitante é o próprio paciente ou um representante.")
    )

    relationship_degree = models.CharField(
        _("Grau de parentesco"),
        max_length=20,
        choices=RelationshipDegree.choices,
        db_column="grau_parentesco",
        blank=True,
        null=True,
        help_text=_("Obrigatório apenas quando o solicitante for um representante.")
    )

    full_name = models.CharField(
        _("Nome"),
        max_length=255,
        db_column="nome",
        help_text=_("Nome completo do solicitante.")
    )

    cpf = models.CharField(
        _("CPF"),
        max_length=14,
        db_column="cpf",
        help_text=_("CPF do solicitante."),
        validators=[validar_cpf]
    )

    rg = models.CharField(
        _("RG"),
        max_length=20,
        db_column="rg",
        help_text=_("RG do solicitante"),
        validators=[validar_rg]
    )

    email = models.EmailField(
        _("E-mail"),
        db_column="email",
        help_text=_("Endereço de e-mail para contato."),
        validators=[validar_email]
    )

    address = models.CharField(
        _("Endereço"),
        max_length=500,
        db_column="endereco",
        help_text=_("Endereço completo do solicitante.")
    )

    phone = models.CharField(
        _("Telefone"),
        max_length=20,
        db_column="telefone",
        help_text=_("Telefone para contato."),
        validators=[validar_celular]
    )

    document = models.OneToOneField(DocumentRequest, on_delete=models.CASCADE)

    class Meta:
        """
        Metadados do model Applicant.
        """
        db_table = "solicitante"
        verbose_name = "Solicitante"
        verbose_name_plural = "Solicitantes"

    def __str__(self):
        """
        Retorna uma representação legível do solicitante.
        """
        return self.full_name

    def clean(self):
        """
        Valida regras de negócio relacionadas ao tipo de solicitante.

        - Exige o grau de parentesco quando o solicitante é um representante.
        - Impede o preenchimento do grau de parentesco quando o solicitante é o paciente.

        Este método é executado automaticamente em:
        - Django Admin
        - ModelForms
        - Chamadas explícitas a full_clean()
        """

        if self.cpf:
            self.cpf = re.sub(r"\D", "", self.cpf)
        
        if self.rg:
            self.rg = re.sub(r"[.\-/]", "", self.rg).upper()
        
        if self.phone:
            self.phone = re.sub(r"\D", "", self.phone)

        if (
            self.applicant_type == self.ApplicantType.REPRESENTATIVE
            and not self.relationship_degree
        ):
            raise ValidationError({
                "relationship_degree": _("Informe o grau de parentesco.")
            })

        if (
            self.applicant_type == self.ApplicantType.PATIENT
            and self.relationship_degree
        ):
            raise ValidationError({
                "relationship_degree": _("Este campo só deve ser preenchido para representantes.")
            })
        
        
    def save(self, *args, **kwargs):
        self.full_clean(exclude=["document"])
        super().save(*args, **kwargs)

