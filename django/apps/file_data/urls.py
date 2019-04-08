from django.urls import path

from .views import *

urlpatterns = [
    path('api/files/top', GetTopLevelFiles.as_view()),
    path('api/files/search', SearchFiles.as_view()),
    path('api/files/searchcsv', GetSearchCSV.as_view()),
    path('api/files/<slug:folder_id>/children', GetChildrenOfFolder.as_view()),
    path('api/files/directories', GetImportedDirectories.as_view()),
    path('api/files/viewdirectory', ViewDirectory.as_view()),
    path('api/files/deletedirectory', DeleteDirectory.as_view()),
    path('api/files/biggestfiles', GetBiggestFiles.as_view()),
    path('api/files/biggestfolders', GetBiggestFolders.as_view()),
    path('api/files/newestfiles', GetNewestFiles.as_view()),
    path('api/files/oldestfiles', GetOldestFiles.as_view()),
    path('api/files/biggestfiletypes', GetBiggestFileTypes.as_view()),
    path('api/files/duplicates', GetDuplicates.as_view()),
    path('api/files/savefile', GetBackupFile.as_view())
]