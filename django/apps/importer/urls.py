from django.urls import path

from .views import *

urlpatterns = [
    path('api/import/latest', GetLastAttempt.as_view()),
    path('api/import/irodslogin', ImportFromIrods.as_view()),
    path('api/import/cyverselogin', ImportFromCyverse.as_view()),
    path('api/import/loadfile', ImportFromFile.as_view())
]