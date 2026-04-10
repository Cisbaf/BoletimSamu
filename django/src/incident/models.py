from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from document_request.models import DocumentRequest


class Incident(models.Model):
    """
    Representa a ocorrência que originou a solicitação de documentos.

    Armazena data, hora, paciente informado, local do atendimento,
    endereço, município e demais detalhes do evento.

    Regras de negócio:
    - Se o local de atendimento for "Outro", a descrição do local é obrigatória

    Cada ocorrência está vinculada a uma única solicitação de documento.
    """

    # =========================
    # DATA E HORA
    # =========================
    date = models.DateField(
        _("Data da ocorrência"),
        db_column="data_ocorrencia"
    )

    time = models.TimeField(
        _("Hora da ocorrência"),
        db_column="hora_ocorrencia"
    )

    # =========================
    # PACIENTE (texto digitado)
    # =========================
    patient_name = models.CharField(
        _("Paciente"),
        max_length=150,
        db_column="paciente_nome"
    )


    # =========================
    # MUNICÍPIO (CHOICES FIXOS)
    # =========================
    class CityChoices(models.TextChoices):
        BELFORD_ROXO = "BELFORD ROXO", "BELFORD ROXO"
        DUQUE_DE_CAXIAS = "DUQUE DE CAXIAS", "DUQUE DE CAXIAS"
        ITAGUAI = "ITAGUAÍ", "ITAGUAÍ"
        JAPERI = "JAPERI", "JAPERI"
        MAGE = "MAGE", "MAGE"
        MESQUITA = "MESQUITA", "MESQUITA"
        NILOPOLIS = "NILÓPOLIS", "NILÓPOLIS"
        NOVA_IGUACU = "NOVA IGUAÇU", "NOVA IGUAÇU"
        PARACAMBI = "PARACAMBI", "PARACAMBI"
        QUEIMADOS = "QUEIMADOS", "QUEIMADOS"
        SAO_JOAO_DE_MERITI = "SAO JOAO DE MERITI", "SAO JOAO DE MERITI"
        SEROPEDICA = "SEROPÉDICA", "SEROPÉDICA"

    city = models.CharField(
        _("Município"),
        max_length=30,
        choices=CityChoices.choices,
        db_column="municipio"
    )

    neighborhood = models.CharField(
        _("Bairro"),
        max_length=100,
        db_column="bairro"
    )

    address = models.CharField(
        _("Endereço"),
        max_length=200,
        db_column="endereco"
    )

    # =========================
    # MOTIVO
    # =========================
    reason = models.CharField(
        _("Motivo da solicitação da ambulância"),
        max_length=50,
        db_column="motivo_solicitacao",
        help_text=_("Máximo de 50 caracteres")
    )

    # =========================
    # LOCAL DO ATENDIMENTO
    # =========================
    class AttendanceLocation(models.TextChoices):
        RESIDENCE = "RES", _("Residência")
        PUBLIC_ROAD = "PUB", _("Via Pública")
        OTHER = "OTH", _("Outro")

    attendance_location = models.CharField(
        _("Local do atendimento"),
        max_length=3,
        choices=AttendanceLocation.choices,
        db_column="local_atendimento"
    )

    other_location_description = models.CharField(
        _("Outro local"),
        max_length=100,
        blank=True,
        null=True,
        db_column="outro_local",
        help_text=_("Preencher apenas se 'Outro' for selecionado")
    )

    # =========================
    # IDENTIFICAÇÃO OPCIONAL
    # =========================
    occurrence_number = models.CharField(
        _("Número da ocorrência"),
        max_length=30,
        blank=True,
        null=True,
        db_column="numero_ocorrencia"
    )

    # =========================
    # OBSERVAÇÕES
    # =========================
    notes = models.CharField(
        _("Observações"),
        max_length=150,
        blank=True,
        null=True,
        db_column="observacoes",
        help_text=_("Máximo de 150 caracteres")
    )

    document = models.OneToOneField(DocumentRequest, on_delete=models.CASCADE)

    class Meta:
        db_table = "ocorrencia"
        verbose_name = _("Ocorrência")
        verbose_name_plural = _("Ocorrências")
        ordering = ["-date", "-time"]

    # =========================
    # REGRA DE NEGÓCIO
    # =========================
    def clean(self):
        if (
            self.attendance_location == self.AttendanceLocation.OTHER
            and not self.other_location_description
        ):
            raise ValidationError({
                "other_location_description": _("Informe o local quando 'Outro' for selecionado.")
            })

    class Meta:
        db_table = "ocorrencia"
        verbose_name = _("Ocorrência")
        verbose_name_plural = _("Ocorrências")
        ordering = ["-date", "-time"]

    def __str__(self):
        return f"Ocorrência {self.date} {self.time} - {self.city}"