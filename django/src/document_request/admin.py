from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import (
    DocumentRequest,
    DocumentStatus,
    DocumentRectification,
    DocumentRectificationStatus,
    DocumentCorrection,
    DocumentCorrectionField,
    DocumentCorrectionStatus,
)
from applicant.models import Applicant
from incident.models import Incident


class ApplicantInline(admin.StackedInline):
    model = Applicant
    verbose_name = "Dados do Solicitante"
    extra = 1
    min_num = 1          # 🔥 obriga 1 solicitante
    max_num = 1          # 🔥 OneToOne real
    can_delete = False

class IncidentInline(admin.StackedInline):
    model = Incident
    verbose_name = "Detalhes da Ocorrência"
    extra = 1
    min_num = 1          # 🔥 obriga 1 solicitante
    max_num = 1          # 🔥 OneToOne real
    can_delete = False
    

@admin.register(DocumentRequest)
class DocumentRequestAdmin(admin.ModelAdmin):
    inlines = [ApplicantInline,  IncidentInline]

    fields = ("protocol", "purpose", "other_purpose")

    readonly_fields = ("protocol", "created_at",)

@admin.register(DocumentStatus)
class DocumentStatusAdmin(admin.ModelAdmin):
    pass

@admin.register(DocumentRectification)
class DocumentRectificationAdmin(admin.ModelAdmin):
    list_display = ("id", "document", "created_at")
    readonly_fields = ("created_at",)

@admin.register(DocumentRectificationStatus)
class DocumentRectificationStatusAdmin(admin.ModelAdmin):
    list_display = ("id", "rectification", "status", "created_at")

@admin.register(DocumentCorrection)
class DocumentCorrectionAdmin(admin.ModelAdmin):
    list_display = ("id", "document", "created_at")
    readonly_fields = ("created_at",)

@admin.register(DocumentCorrectionField)
class DocumentCorrectionFieldAdmin(admin.ModelAdmin):
    list_display = ("id", "correction", "field_key", "field_label", "submitted_at")

@admin.register(DocumentCorrectionStatus)
class DocumentCorrectionStatusAdmin(admin.ModelAdmin):
    list_display = ("id", "correction", "status", "created_at")
