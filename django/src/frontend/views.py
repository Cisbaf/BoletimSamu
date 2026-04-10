from django.shortcuts import render
from django.conf import settings
import os
from django.http import FileResponse


def frontend(request):
    path = os.path.join(settings.BASE_DIR, 'static/frontend/index.html')
    return FileResponse(open(path, 'rb'))