from django.urls import path

from .views import *

urlpatterns = [
    path('api/updates/latest', GetLastUpdate.as_view()),
    path('api/updates/uploadfile', UpdateFromFile.as_view()),
    path('api/updates/irodslogin', UpdateFromIrods.as_view()),
    path('api/updates/list', GetRecentUpdates.as_view()),
    path('api/updates/restore', RestoreFromUpdate.as_view())
]