from django.urls import path
from . import views

urlpatterns = [
    path('api/browse/status', views.BrowseStatus.as_view()),
    path('api/browse/login', views.BrowseLogin.as_view()),
    path('api/browse/logout', views.BrowseLogout.as_view()),
    path('api/browse/ls', views.BrowseList.as_view()),
    path('api/browse/stat', views.BrowseStat.as_view()),
    path('api/browse/metadata', views.BrowseMetadata.as_view()),
    path('api/browse/analyze', views.BrowseAnalyze.as_view()),
]
