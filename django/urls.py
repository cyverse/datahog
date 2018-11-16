from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('apps.file_data.urls')),
    path('', include('apps.importer.urls')),
]
