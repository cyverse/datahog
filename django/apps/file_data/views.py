import datetime
import csv
import pickle
import json
import os

from django.http import StreamingHttpResponse
from django.core.files.base import ContentFile
from rest_framework.response import Response
from rest_framework import views, pagination, generics, filters

from .models import *
from .serializers import *
from .helpers import *


class GetBiggestFiles(generics.ListAPIView):
    serializer_class = FileSerializer
    pagination_class = pagination.LimitOffsetPagination
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ('size',)
    ordering = ('-size',)

    def get_queryset(self):
        return File.objects.filter(directory=ImportedDirectory.objects.latest('date_viewed')).all()


class GetBiggestFolders(generics.ListAPIView):
    serializer_class = FolderSerializer
    pagination_class = pagination.LimitOffsetPagination
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ('total_size',)
    ordering = ('-total_size',)

    def get_queryset(self):
        return Folder.objects.filter(directory=ImportedDirectory.objects.latest('date_viewed')).all()


class GetBiggestFileTypes(generics.ListAPIView):
    serializer_class = FileTypeSerializer
    pagination_class = pagination.LimitOffsetPagination
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ('total_size',)
    ordering = ('-total_size',)

    def get_queryset(self):
        return FileType.objects.filter(directory=ImportedDirectory.objects.latest('date_viewed')).all()


class GetNewestFiles(generics.ListAPIView):
    serializer_class = FileSerializer
    pagination_class = pagination.LimitOffsetPagination
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ('date_created',)
    ordering = ('-date_created',)

    def get_queryset(self):
        return File.objects.filter(directory=ImportedDirectory.objects.latest('date_viewed')).all()


class GetOldestFiles(generics.ListAPIView):
    serializer_class = FileSerializer
    pagination_class = pagination.LimitOffsetPagination
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ('date_created',)
    ordering = ('date_created',)

    def get_queryset(self):
        return File.objects.filter(directory=ImportedDirectory.objects.latest('date_viewed')).all()


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
        
        top_folders = Folder.objects.filter(directory=ImportedDirectory.objects.latest('date_viewed'), parent=None)
        top_files   = File.objects.filter(directory=ImportedDirectory.objects.latest('date_viewed'), parent=None)

        folder_serializer = FolderSerializer(top_folders.all(), many=True)
        file_serializer   = FileSerializer(top_files.all(), many=True)

        return Response(folder_serializer.data + file_serializer.data)


class SearchFiles(views.APIView):
    def get(self, request):
        matching_files = filter_files(File.objects, request.GET)

        if 'offset' in request.GET:
            offset = int(request.GET['offset'])
            matching_files = matching_files.all()[offset:offset+100]
        else:
            matching_files = matching_files.all()[:100]
        
        files_serialized = FileSerializer(matching_files, many=True)
        return Response(files_serialized.data)


class GetDupeGroups(views.APIView):
    def get(self, request):
        matching_groups = filter_dupe_groups(DupeGroup.objects, request.GET)

        if 'offset' in request.GET:
            offset = int(request.GET['offset'])
            matching_groups = matching_groups.all()[offset:offset+100]
        else:
            matching_groups = matching_groups.all()[:100]

        groups_serialized = DupeGroupSerializer(matching_groups, many=True)
        return Response(groups_serialized.data)


class GetSearchCSV(views.APIView):
    def get(self, request):
        matching_files = filter_files(File.objects, request.GET)
        writer = csv.writer(EchoBuffer())

        def get_csv_rows():
            yield writer.writerow(['Path', 'Date Created', 'Size (Bytes)'])
            for file in matching_files.all():
                yield writer.writerow([
                    file.path,
                    str(file.date_created),
                    str(file.size)
                ])

        response = StreamingHttpResponse(get_csv_rows(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="search_results.csv"'
        return response


class GetImportedDirectories(views.APIView):
    def get(self, request):
        directories = ImportedDirectory.objects.order_by('-date_viewed').all()

        for directory in directories:
            if not directory.size_timeline_data:
                directory.size_timeline_data = create_size_timeline_data(directory)
                directory.save()
            if not directory.type_chart_data:
                directory.type_chart_data = create_type_chart_data(directory)
                directory.save()
        
        directories_serialized = ImportedDirectorySerializer(directories, many=True)
        return Response(directories_serialized.data)


class ViewDirectory(views.APIView):
    def post(self, request):
        try:
            directory = ImportedDirectory.objects.get(id=request.data['id'])
            directory.date_viewed = datetime.datetime.now()
            directory.save()
        except:
            directory = None
        
        directories = ImportedDirectory.objects.order_by('-date_viewed').all()
        directories_serialized = ImportedDirectorySerializer(directories, many=True)
        return Response(directories_serialized.data)


class DeleteDirectory(views.APIView):
    def delete(self, request):
        try:
            directory = ImportedDirectory.objects.get(id=request.data['id'])
            directory.delete()
        except:
            directory = None
        
        directories = ImportedDirectory.objects.order_by('-date_viewed').all()
        directories_serialized = ImportedDirectorySerializer(directories, many=True)
        return Response(directories_serialized.data)


class GetBackupFile(views.APIView):
    def get(self, request):
        directory = ImportedDirectory.objects.latest('date_viewed')
        files = []

        for file in File.objects.filter(directory=directory).all():
            if file.dupe_group:
                checksum = file.dupe_group.checksum
            else:
                checksum = None

            files.append({
                'path': file.path,
                'checksum': checksum,
                'size': file.size,
                'modified': file.date_created.timestamp()
            })

        file_data = {
            'format': 'datahog:0.1',
            'root': summary.root_path,
            'files': files,
            'date_scanned': summary.date_scanned.timestamp()
        }

        backup_file = ContentFile(pickle.dumps(file_data))
        file_name = '{}.datahog'.format(os.path.basename(summary.root_path))

        def get_file_chunks():
            while True:
                data = backup_file.read(1024)
                if not data: break
                yield data

        response = StreamingHttpResponse(get_file_chunks(), content_type='application/octet-stream')
        response['Content-Disposition'] = 'attachment; filename="{}"'.format(file_name)
        return response