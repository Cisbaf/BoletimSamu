from django.contrib import admin
from .models import ApplicantDocument


@admin.register(ApplicantDocument)
class ApplicantDocumentAdmin(admin.ModelAdmin):
    pass
