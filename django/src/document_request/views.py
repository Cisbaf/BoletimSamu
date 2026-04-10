from django.db.models import Prefetch
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.views import APIView, Response
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import DocumentRequest, DocumentStatus
from applicant_document.models import ApplicantDocument
from .serializers import DocumentRequestSerializer, DocumentRequestDetailSerializer, DocumentSimpleDetailSerializer, DocumentStatusSerializer
from utils.formart import convert_document_multipart_to_json
from django.db.models import OuterRef, Subquery
#from .services import send_message_wpp_to_admin
#from django.views.decorators.csrf import csrf_exempt
#from app.utils import CsrfExemptSessionAuthentication


class DocumentStatusCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentStatusSerializer

    def post(self, request):
        data = request.data.copy()
        data['user'] = request.user.pk
        serializer = DocumentStatusSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(data=serializer.data)
    

class DocumentRequestCreateAPIView(APIView):
    """
    Endpoint público para criação de uma solicitação de documentos.

    Aceita requisições multipart/form-data contendo:
    - Dados da solicitação
    - Dados do solicitante
    - Dados da ocorrência
    - Arquivos e seus respectivos tipos

    Os dados multipart são convertidos para estrutura JSON antes da validação.
    A criação é delegada ao DocumentRequestSerializer, que garante todas
    as regras de negócio e integridade transacional.

    Retorna o número de protocolo gerado para acompanhamento da solicitação.
    """

    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        data = request.data.copy()
        processed_data = convert_document_multipart_to_json(data, request.FILES)
        serializer = DocumentRequestSerializer(data=processed_data)
        serializer.is_valid(raise_exception=True)
        document = serializer.save()
        #send_message_wpp_to_admin(document)
        response = {
            "protocol": document.protocol,
            "message": "Documento criado com sucesso!",
            "text_helper": f"""
                Cópia solicitada com sucesso, acompanhe a sua solicitação pesquisando pelo protocolo ${document.protocol}
            """
        }
        return Response(status=201, data=response)


class BaseDocumentRequestViewSet(ReadOnlyModelViewSet):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    filterset_fields = {
        "created_at": ["gte", "lte"],
        "applicant__cpf": ["icontains"],
        "applicant__full_name": ["icontains"],
        "incident__patient_name": ["icontains"],
        "protocol": ["exact"],
    }

    search_fields = [
        "created_at",
        "applicant__full_name",
        "applicant__cpf",
        "incident__patient_name",
        "protocol",
    ]

    ordering_fields = ["created_at", "id"]
    ordering = ["-created_at"]

class DocumentPublicViewSet(BaseDocumentRequestViewSet):
    permission_classes = [AllowAny]
    serializer_class = DocumentSimpleDetailSerializer
    lookup_field = "protocol"

    ordering = ["created_at"]

    def get_queryset(self):
        last_status = DocumentStatus.objects.filter(
            document=OuterRef("pk")
        ).order_by("-created_at")

        base = (
            DocumentRequest.objects
            .annotate(current_status=Subquery(last_status.values("status")[:1]))
            .select_related("applicant")
        )

        status = self.request.query_params.get("status")

        if status:
            base = base.filter(current_status=status)

        return base
    
class DocumentDetailViewSet(BaseDocumentRequestViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentRequestDetailSerializer
    lookup_field = "protocol"

    def get_queryset(self):
        last_status = DocumentStatus.objects.filter(
            document=OuterRef("pk")
        ).order_by("-created_at")

        base = (
            DocumentRequest.objects
            .annotate(current_status=Subquery(last_status.values("status")[:1]))
            .select_related("applicant", "incident")
            .prefetch_related(
                Prefetch(
                    "applicant__documents",
                    queryset=ApplicantDocument.objects.all()
                )
            )
        )

        status = self.request.query_params.get("status")

        if status:
            base = base.filter(current_status=status)
        
        return base

    