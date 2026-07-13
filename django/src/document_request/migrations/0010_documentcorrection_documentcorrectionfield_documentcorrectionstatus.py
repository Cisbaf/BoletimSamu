# Generated manually on 2026-07-10

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('document_request', '0009_documentrectification_reason'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DocumentCorrection',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_column='criado_em', verbose_name='Criado em')),
                ('document', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='corrections', to='document_request.documentrequest')),
            ],
            options={
                'verbose_name': 'Correção de Preenchimento',
                'verbose_name_plural': 'Correções de Preenchimento',
                'db_table': 'correcao_preenchimento',
                'ordering': ['created_at'],
            },
        ),
        migrations.CreateModel(
            name='DocumentCorrectionField',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('field_key', models.CharField(
                    choices=[
                        ('applicant.full_name', 'Nome Completo'),
                        ('applicant.cpf', 'CPF'),
                        ('applicant.rg', 'RG'),
                        ('applicant.email', 'E-mail'),
                        ('applicant.address', 'Endereço'),
                        ('applicant.phone', 'Telefone'),
                        ('incident.date', 'Data da Ocorrência'),
                        ('incident.time', 'Hora da Ocorrência'),
                        ('incident.patient_name', 'Nome do Paciente'),
                        ('incident.city', 'Município'),
                        ('incident.neighborhood', 'Bairro'),
                        ('incident.address', 'Endereço da Ocorrência'),
                        ('incident.reason', 'Motivo da Solicitação da Ambulância'),
                        ('incident.attendance_location', 'Local do Atendimento'),
                        ('incident.other_location_description', 'Descrição do Outro Local'),
                        ('incident.occurrence_number', 'Número da Ocorrência'),
                        ('incident.notes', 'Observações'),
                        ('document.other_purpose', 'Outro Motivo'),
                        ('attachment.PATIENT_ID', 'Documento com foto do paciente'),
                        ('attachment.APPLICANT_ID', 'Documento com foto do solicitante'),
                        ('attachment.MARRIAGE_CERTIFICATE', 'Certidão de casamento / União estável'),
                        ('attachment.POWER_OF_ATTORNEY', 'Procuração específica'),
                        ('attachment.DEATH_CERTIFICATE', 'Certidão de Óbito'),
                    ],
                    db_column='campo_chave',
                    max_length=60,
                    verbose_name='Campo',
                )),
                ('field_label', models.CharField(db_column='campo_rotulo', help_text='Snapshot do rótulo legível no momento da criação.', max_length=100, verbose_name='Rótulo do campo')),
                ('admin_comment', models.TextField(db_column='comentario_admin', verbose_name='Comentário do administrador')),
                ('new_value', models.TextField(blank=True, db_column='novo_valor', null=True, verbose_name='Novo valor')),
                ('new_file', models.FileField(blank=True, db_column='novo_arquivo', null=True, upload_to='corrections/%Y/%m/', verbose_name='Novo arquivo')),
                ('submitted_at', models.DateTimeField(blank=True, db_column='enviado_em', null=True, verbose_name='Enviado em')),
                ('correction', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='fields', to='document_request.documentcorrection')),
            ],
            options={
                'verbose_name': 'Campo da Correção',
                'verbose_name_plural': 'Campos da Correção',
                'db_table': 'correcao_preenchimento_campo',
            },
        ),
        migrations.CreateModel(
            name='DocumentCorrectionStatus',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comment', models.TextField(blank=True, null=True)),
                ('status', models.CharField(
                    choices=[
                        ('pendente', 'Pendente'),
                        ('enviada', 'Enviada'),
                        ('aprovada', 'Aprovada'),
                        ('rejeitada', 'Rejeitada'),
                    ],
                    db_column='status',
                    default='pendente',
                    max_length=20,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True, db_column='criado_em', verbose_name='Criado em')),
                ('correction', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='status', to='document_request.documentcorrection')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Status da Correção',
                'verbose_name_plural': 'Status das Correções',
                'db_table': 'status_correcao',
                'ordering': ['created_at'],
            },
        ),
    ]
