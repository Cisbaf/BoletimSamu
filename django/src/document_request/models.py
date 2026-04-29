from django.db import models, transaction
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from protocol_counter.models import ProtocolCounter
from django.contrib.auth.models import User

class DocumentRequest(models.Model):
    """
    Representa uma solicitação de documentos feita ao sistema.

    Armazena a finalidade do pedido, controla o status do fluxo
    (aguardando, confirmado ou cancelado) e gera automaticamente
    um número de protocolo único por ano.

    Regras de negócio:
    - Se a finalidade for "Outros", o campo other_purpose é obrigatório
    - Para as demais finalidades, other_purpose deve permanecer vazio
    - Mudanças de status só podem ocorrer conforme as transições permitidas

    O protocolo é gerado automaticamente no primeiro salvamento,
    utilizando um contador anual com bloqueio transacional.
    """

    protocol = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        db_column="protocolo"
    )

    class Purpose(models.TextChoices):
        OBITO = "OBITO", _("Óbito")
        DPVAT = "DPVAT", _("DPVAT")
        INSS = "INSS", _("Benefício INSS")
        SEGURO = "SEGURO", _("Seguro")
        INVENTARIO = "INVENTARIO", _("Inventário")
        ACAO_JUDICIAL = "ACAO JUDICIAL", _("Ação Judicial")
        OUTROS = "OUTROS", _("Outros")

    purpose = models.CharField(
        _("Finalidade da Documentação"),
        max_length=20,
        choices=Purpose.choices,
        db_column="finalidade"
    )

    other_purpose = models.CharField(
        _("Outro motivo"),
        max_length=255,
        blank=True,
        null=True,
        db_column="outro_motivo"
    )

    created_at = models.DateTimeField(
        _("Criado em"),
        auto_now_add=True,
        db_column="criado_em"
    )

    updated_at = models.DateTimeField(
        _("Atualizado em"),
        auto_now=True,
        db_column="atualizado_em"
    )

    class Meta:
        db_table = "pedido_documento"
        verbose_name = "Solicitação de Documento"
        verbose_name_plural = "Solicitações de Documento"

    def generate_protocol(self):
        year = now().year

        with transaction.atomic():
            counter, _ = ProtocolCounter.objects.select_for_update().get_or_create(year=year)
            counter.last_number += 1
            counter.save()

            return f"{year}-{counter.last_number:04d}"

    def save(self, *args, **kwargs):
        new = False
        if not self.pk:
            new = True
        if not self.protocol:
            self.protocol = self.generate_protocol()
        super().save(*args, **kwargs)
        if new:
            DocumentStatus.objects.create(document=self)

    def clean(self):
        """
        Regra de negócio:
        - Se finalidade for OUTROS → outro_motivo é obrigatório
        - Caso contrário → outro_motivo deve estar vazio
        """
        if self.purpose == self.Purpose.OUTROS and not self.other_purpose:
            raise ValidationError({
                "other_purpose": _("Informe o motivo quando a finalidade for 'Outros'.")
            })

        if self.purpose != self.Purpose.OUTROS and self.other_purpose:
            raise ValidationError({
                "other_purpose": _("Este campo só deve ser preenchido quando a finalidade for 'Outros'.")
            })

    def __str__(self):
        return f"Pedido #{self.protocol} - {self.get_purpose_display()}"
    

class DocumentStatus(models.Model):
    document = models.ForeignKey(to=DocumentRequest, on_delete=models.CASCADE, related_name="status")
    comment = models.TextField(blank=True, null=True)
    # =========================
    # CONTROLE
    # =========================
    class StatusChoices(models.TextChoices):
        AGUARDANDO = "aguardando", "Aguardando"
        CONFIRMADO = "confirmado", "Confirmado"
        CANCELADO = "cancelado", "Cancelado"

    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.AGUARDANDO,
        db_column="status"
    )

    ALLOWED_TRANSACTIONS = {
        StatusChoices.AGUARDANDO: {StatusChoices.CONFIRMADO, StatusChoices.CANCELADO},
        StatusChoices.CONFIRMADO: {StatusChoices.CANCELADO},
        StatusChoices.CANCELADO: set(),  # não pode sair daqui
    }

    created_at = models.DateTimeField(
        _("Criado em"),
        auto_now_add=True,
        db_column="criado_em"
    )

    user = models.ForeignKey(to=User, on_delete=models.DO_NOTHING, blank=True, null=True)

    def change_status(self, new_status):
        if new_status not in dict(self.StatusChoices.choices):
            raise ValidationError("Status inválido.")

        transactions = self.ALLOWED_TRANSACTIONS.get(self.status, set())

        if new_status not in transactions:
            raise ValidationError(
                f"Não é permitido mudar de '{self.status}' para '{new_status}'."
            )

        self.status = new_status
        self.save()
    
    def __str__(self):
        return self.status