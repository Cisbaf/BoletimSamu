from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DocumentPublicViewSet,
    DocumentDetailViewSet,
    DocumentRequestCreateAPIView,
    DocumentStatusCreateAPIView,
    DocumentRectificationCreateAPIView,
    DocumentRectificationStatusCreateAPIView,
    DocumentCorrectionCreateAPIView,
    DocumentCorrectionSubmitAPIView,
    DocumentCorrectionStatusCreateAPIView,
)

# 🔓 Router público
public_router = DefaultRouter()
public_router.register(
    r'requests',
    DocumentPublicViewSet,
    basename='public-requests'
)

# 🔒 Router privado (admin / detalhado)
admin_router = DefaultRouter()
admin_router.register(
    r'requests',
    DocumentDetailViewSet,
    basename='admin-requests'
)

urlpatterns = [
    # 🔹 criação (pode deixar público ou proteger)
    path(
        'create/',
        DocumentRequestCreateAPIView.as_view(),
        name='document-request-create'
    ),

    # 🔹 rotas públicas
    path('', include(public_router.urls)),

    # 🔹 rotas privadas
    path('admin/', include(admin_router.urls)),

    path('status/', DocumentStatusCreateAPIView.as_view(), name="status-create"),

    # 🔹 retificação
    path(
        'rectifications/create/',
        DocumentRectificationCreateAPIView.as_view(),
        name="document-rectification-create"
    ),
    path(
        'rectifications/status/',
        DocumentRectificationStatusCreateAPIView.as_view(),
        name="rectification-status-create"
    ),

    # 🔹 correção de preenchimento
    path(
        'corrections/create/',
        DocumentCorrectionCreateAPIView.as_view(),
        name="document-correction-create"
    ),
    path(
        'corrections/submit/',
        DocumentCorrectionSubmitAPIView.as_view(),
        name="document-correction-submit"
    ),
    path(
        'corrections/status/',
        DocumentCorrectionStatusCreateAPIView.as_view(),
        name="correction-status-create"
    ),
]