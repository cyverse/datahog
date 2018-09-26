from django.urls import path

from .views import index, GetTopLevelFiles, GetChildrenOfFolder, SearchFiles

urlpatterns = [
    path('', index, name='index'),
    path('api/files/top', GetTopLevelFiles.as_view()),
    path('api/files/search', SearchFiles.as_view()),
    path('api/files/<slug:folder_id>/children', GetChildrenOfFolder.as_view())
]