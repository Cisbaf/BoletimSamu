"""
URL configuration for app project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.urls import re_path
from frontend.views import frontend

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('authjwt.urls')),
    path('document/', include('document_request.urls')),
]

# Está assim pois como o front-end está integrado todas urls precisam vir primeiro!
urlpatterns.append(re_path(r'^.*$', frontend))

