from django.urls import path

from .views import *

urlpatterns = [
    path('', index, name='index'),
    path('api/files/top', GetTopLevelFiles.as_view()),
    path('api/files/search', SearchFiles.as_view()),
    path('api/files/<slug:folder_id>/children', GetChildrenOfFolder.as_view()),
    path('api/summaries/files', GetBiggestFiles.as_view()),
    path('api/summaries/types', GetBiggestTypes.as_view()),
    path('api/summaries/folders', GetBiggestFolders.as_view())
]