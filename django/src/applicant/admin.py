from django.contrib import admin
from .models import Applicant
from applicant_document.models import ApplicantDocument

class ApplicantDocumentInline(admin.StackedInline):
    model = ApplicantDocument
    verbose_name = "Documentos"
    extra = 1
    min_num = 1          # 🔥 obriga 1 solicitante
    can_delete = False
    
@admin.register(Applicant)
class ApplicantAdmin(admin.ModelAdmin):
    inlines = [ApplicantDocumentInline]

