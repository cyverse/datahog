from django.shortcuts import render
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework import views
from celery.exceptions import CeleryError

from .models import File, Folder, FileType, UpdateLog
from .serializers import FolderSerializer, FileSerializer, FileTypeSerializer, UpdateLogSerializer
from .celery_tasks import update_database


# Create your views here.

def index(request):
    return render(request, 'index.html')


class UpdateDatabase(views.APIView):
    def get(self, request):
        latest_update = UpdateLog.objects.latest('timestamp')
        if latest_update.in_progress:
            return Response('A database update is already in progress.', status=400)
        
        try:
            update_database.delay()
        except CeleryError:
            return Response('Something went wrong with Celery.', status=500)

        return Response('A database update has begun.')


class GetChildrenOfFolder(views.APIView):
    def get(self, request, folder_id):
        try:
            parent_folder = Folder.objects.get(pk=folder_id)
        except Folder.DoesNotExist:
            return Response('That folder does not exist!', status=404)
        
        child_folders = Folder.objects.filter(parent=parent_folder)
        child_files   = File.objects.filter(parent=parent_folder)

        folder_serializer = FolderSerializer(child_folders.all(), many=True)
        file_serializer   = FileSerializer(child_files.all(), many=True)

        return Response(folder_serializer.data + file_serializer.data)


class GetTopLevelFiles(views.APIView):
    def get(self, request):
        
        top_folders = Folder.objects.filter(parent=None)
        top_files   = File.objects.filter(parent=None)

        folder_serializer = FolderSerializer(top_folders.all(), many=True)
        file_serializer   = FileSerializer(top_files.all(), many=True)

        return Response(folder_serializer.data + file_serializer.data)


class SearchFiles(views.APIView):
    def post(self, request):

        search_terms = ''
        matching_folders = Folder.objects
        matching_files = File.objects

        if 'name' in request.data:
            matching_folders = Folder.objects.filter(name__icontains=request.data['name'])
            matching_files = File.objects.filter(name__icontains=request.data['name'])

        folder_serializer = FolderSerializer(matching_folders.all(), many=True)
        file_serializer   = FileSerializer(matching_files.all(), many=True)

        return Response(folder_serializer.data + file_serializer.data)


class GetBiggestFiles(views.APIView):
    def get(self, request):
        top_ten_files = File.objects.order_by('-size')[:10]
        serializer = FileSerializer(top_ten_files.all(), many=True)
        return Response(serializer.data)


class GetBiggestFolders(views.APIView):
    def get(self, request):
        top_ten_folders = Folder.objects.order_by('-total_size')[:10]
        serializer = FolderSerializer(top_ten_folders.all(), many=True)
        return Response(serializer.data)


class GetBiggestTypes(views.APIView):
    def get(self, request):
        top_ten_types = FileType.objects.order_by('-total_size')[:10]
        serializer = FileTypeSerializer(top_ten_types.all(), many=True)
        return Response(serializer.data)


class GetTotals(views.APIView):
    def get(self, request):
        latest_update = UpdateLog.objects.latest('timestamp')
        serializer = UpdateLogSerializer(latest_update)
        return Response(serializer.data)

