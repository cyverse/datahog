from django.shortcuts import render
from django.http import HttpResponse
from rest_framework.response import Response
from .models import File, Folder
from .serializers import FolderSerializer, FileSerializer

from rest_framework import views
# Create your views here.

def index(request):
    return render(request, 'index.html')


class GetChildrenOfFolder(views.APIView):
    def get(self, request, folder_id):
        try:
            parent_folder = Folder.objects.get(pk=folder_id)
        except Folder.DoesNotExist:
            return Response('That folder does not exist!', status=404)
        
        child_folders = Folder.objects.filter(parent=parent_folder)
        child_files   = File.objects.filter(parent=parent_folder)

        child_folders = FolderSerializer(child_folders.all(), many=True)
        child_files   = FileSerializer(child_files.all(), many=True)

        return Response(child_folders.data + child_files.data)


class GetTopLevelFiles(views.APIView):
    def get(self, request):
        
        top_folders = Folder.objects.filter(parent=None)
        top_files   = File.objects.filter(parent=None)

        top_folders = FolderSerializer(top_folders.all(), many=True)
        top_files   = FileSerializer(top_files.all(), many=True)

        return Response(top_folders.data + top_files.data)

