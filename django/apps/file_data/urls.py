from django.urls import path

from .views import *

urlpatterns = [
    path('api/files/top', GetTopLevelFiles.as_view()),
    path('api/files/search', SearchFiles.as_view()),
    path('api/files/<slug:folder_id>/children', GetChildrenOfFolder.as_view()),
    path('api/files/summary', GetSummary.as_view())
]