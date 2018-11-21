from django.urls import path

from .views import *

urlpatterns = [
    path('api/updates/latest', GetLastUpdate.as_view()),
    path('api/updates/irodslogin', UpdateFromIrods.as_view())
]