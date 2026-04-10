# api/urls.py
from django.urls import path
from .views import LoginView, UserView, LogoutView, VerifyTokenView, RefreshTokenView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('user/', UserView.as_view(), name='user'),
    path('refresh/', RefreshTokenView.as_view(), name='refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('verify/', VerifyTokenView.as_view(), name='logout'),
]