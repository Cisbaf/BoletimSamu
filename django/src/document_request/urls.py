from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DocumentPublicViewSet,
    DocumentDetailViewSet,
    DocumentRequestCreateAPIView,
    DocumentStatusCreateAPIView
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

    path('status/', DocumentStatusCreateAPIView.as_view(), name="status-create")
]