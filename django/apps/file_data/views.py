from rest_framework.response import Response
from rest_framework import views

from .models import *
from .serializers import FolderSerializer, FileSerializer, FileTypeSerializer

from apps.importer.helpers import get_last_update
from apps.importer.serializers import UpdateLogSerializer

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


class GetSummary(views.APIView):
    def get(self, request):
        last_update = get_last_update()
        top_ten_files = File.objects.order_by('-size')[:10]
        top_ten_folders = Folder.objects.order_by('-total_size')[:10]
        top_ten_types = FileType.objects.order_by('-total_size')[:10]

        files_serialized = FileSerializer(top_ten_files.all(), many=True)
        folders_serialized = FolderSerializer(top_ten_folders.all(), many=True)
        types_serialized = FileTypeSerializer(top_ten_types.all(), many=True)
        update_serialized = UpdateLogSerializer(last_update)

        response_object = {
            'last_update': update_serialized.data,
            'top_ten_files': files_serialized.data,
            'top_ten_folders': folders_serialized.data,
            'top_ten_types': types_serialized.data
        }

        return Response(response_object)
