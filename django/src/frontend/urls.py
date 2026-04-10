from django.urls import re_path
from .views import frontend

urlpatterns = [
    re_path(r'^.*$', frontend),
]