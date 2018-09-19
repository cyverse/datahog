from django.urls import path

from .views import index, GetTopLevelFiles, GetChildrenOfFolder

urlpatterns = [
    path('', index, name='index'),
    path('api/files/top', GetTopLevelFiles.as_view()),
    path('api/files/<int:folder_id>/children', GetChildrenOfFolder.as_view())
]