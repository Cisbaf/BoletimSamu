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

    def has_open_rectification(self):
        """
        Indica se já existe uma retificação em andamento (solicitada ou
        agendada) para este pedido, impedindo a abertura de duplicatas.
        """
        open_statuses = {
            DocumentRectificationStatus.StatusChoices.SOLICITADA,
            DocumentRectificationStatus.StatusChoices.AGENDADA,
        }
        for rectification in self.rectifications.all():
            last_status = rectification.status.order_by("-created_at").first()
            if last_status and last_status.status in open_statuses:
                return True
        return False


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

    created_at = models.DateTimeField(
        _("Criado em"),
        auto_now_add=True,
        db_column="criado_em"
    )

    user = models.ForeignKey(to=User, on_delete=models.SET_NULL, blank=True, null=True)

    ALLOWED_TRANSITIONS = {
        StatusChoices.AGUARDANDO: {StatusChoices.CONFIRMADO, StatusChoices.CANCELADO},
        StatusChoices.CONFIRMADO: {StatusChoices.CANCELADO},
        StatusChoices.CANCELADO: set(),  # estado terminal
    }

    def change_status(self, new_status, user=None, comment=None):
        """
        Valida a transição e cria um novo evento de status (append-only).
        Nunca muta o registro atual — cada mudança gera uma nova linha imutável.
        """
        if new_status not in dict(self.StatusChoices.choices):
            raise ValidationError(f"Status inválido: '{new_status}'.")

        allowed = self.ALLOWED_TRANSITIONS.get(self.status, set())

        if new_status not in allowed:
            raise ValidationError(
                f"Transição de '{self.status}' para '{new_status}' não é permitida."
            )

        return DocumentStatus.objects.create(
            document=self.document,
            status=new_status,
            user=user,
            comment=comment,
        )

    class Meta:
        db_table = "status_documento"
        ordering = ["created_at"]
        verbose_name = "Status do Documento"
        verbose_name_plural = "Status dos Documentos"

    def __str__(self):
        return self.status


class DocumentRectification(models.Model):
    """
    Representa um protocolo de retificação aberto sobre um DocumentRequest
    já confirmado.

    Quando o solicitante retira o documento presencialmente e identifica
    alguma informação incorreta, é aberto um protocolo de retificação
    vinculado ao pedido original. A identidade de quem solicita é conferida
    por CPF antes da abertura (ver DocumentRectificationCreateSerializer).

    Assim como o pedido tem seu DocumentStatus, a retificação tem seu
    próprio histórico append-only (DocumentRectificationStatus), permitindo
    acompanhar e futuramente agendar o atendimento da retificação pela
    mesma linha do tempo exibida ao solicitante.
    """

    document = models.ForeignKey(
        to=DocumentRequest,
        on_delete=models.CASCADE,
        related_name="rectifications",
    )

    requested_cpf = models.CharField(
        _("CPF de confirmação"),
        max_length=14,
        db_column="cpf_confirmacao",
        help_text=_("CPF informado para confirmar a identidade de quem solicitou a retificação."),
    )

    created_at = models.DateTimeField(
        _("Criado em"),
        auto_now_add=True,
        db_column="criado_em",
    )

    class Meta:
        db_table = "retificacao_documento"
        ordering = ["created_at"]
        verbose_name = "Retificação de Documento"
        verbose_name_plural = "Retificações de Documento"

    def save(self, *args, **kwargs):
        new = self.pk is None
        super().save(*args, **kwargs)
        if new:
            DocumentRectificationStatus.objects.create(rectification=self)

    def __str__(self):
        return f"Retificação #{self.pk} - {self.document.protocol}"


class DocumentRectificationStatus(models.Model):
    """
    Evento imutável do andamento de uma retificação (append-only), no mesmo
    espírito de DocumentStatus: cada mudança gera uma nova linha e o
    histórico completo é preservado.
    """

    rectification = models.ForeignKey(
        to=DocumentRectification,
        on_delete=models.CASCADE,
        related_name="status",
    )

    comment = models.TextField(blank=True, null=True)

    class StatusChoices(models.TextChoices):
        SOLICITADA = "solicitada", "Solicitada"
        AGENDADA = "agendada", "Agendada"
        CONCLUIDA = "concluida", "Concluída"
        CANCELADA = "cancelada", "Cancelada"

    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.SOLICITADA,
        db_column="status",
    )

    created_at = models.DateTimeField(
        _("Criado em"),
        auto_now_add=True,
        db_column="criado_em",
    )

    user = models.ForeignKey(to=User, on_delete=models.SET_NULL, blank=True, null=True)

    ALLOWED_TRANSITIONS = {
        StatusChoices.SOLICITADA: {StatusChoices.AGENDADA, StatusChoices.CANCELADA},
        StatusChoices.AGENDADA: {StatusChoices.CONCLUIDA, StatusChoices.CANCELADA},
        StatusChoices.CONCLUIDA: set(),   # estado terminal
        StatusChoices.CANCELADA: set(),   # estado terminal
    }

    def change_status(self, new_status, user=None, comment=None):
        """
        Valida a transição e cria um novo evento de status (append-only).
        Nunca muta o registro atual — cada mudança gera uma nova linha imutável.
        """
        if new_status not in dict(self.StatusChoices.choices):
            raise ValidationError(f"Status inválido: '{new_status}'.")

        allowed = self.ALLOWED_TRANSITIONS.get(self.status, set())

        if new_status not in allowed:
            raise ValidationError(
                f"Transição de '{self.status}' para '{new_status}' não é permitida."
            )

        return DocumentRectificationStatus.objects.create(
            rectification=self.rectification,
            status=new_status,
            user=user,
            comment=comment,
        )

    class Meta:
        db_table = "status_retificacao"
        ordering = ["created_at"]
        verbose_name = "Status da Retificação"
        verbose_name_plural = "Status das Retificações"

    def __str__(self):
        return self.status