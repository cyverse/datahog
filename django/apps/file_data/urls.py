from django.urls import path

from .views import *

urlpatterns = [
    path('api/filedata/files', GetFiles.as_view()),
    path('api/filedata/folders', GetFolders.as_view()),
    path('api/filedata/types', GetFileTypes.as_view()),
    path('api/filedata/owners', GetFileOwners.as_view()),
    path('api/filedata/groups', GetFileGroups.as_view()),
    path('api/filedata/top', GetTopLevelFiles.as_view()),
    path('api/filedata/searchcsv', GetSearchCSV.as_view()),
    path('api/filedata/children/<slug:folder_id>', GetChildrenOfFolder.as_view()),
    path('api/filedata/sources', GetSources.as_view()),
    path('api/filedata/changesource', ViewSource.as_view()),
    path('api/filedata/duplicates', GetDuplicates.as_view()),
    path('api/filedata/backup', GetBackupFile.as_view())
]