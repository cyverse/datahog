import datetime
import csv
import pickle
import json
import os

from django.http import StreamingHttpResponse
from django.core.files.base import ContentFile
from rest_framework.response import Response
from rest_framework import views, pagination, generics, filters
from django.db.models import Count, F, ExpressionWrapper, IntegerField

from .models import *
from .serializers import *
from .helpers import *


class GetFiles(views.APIView):
    def get(self, request):
        matching_files = filter_files(File.objects, request.GET)

        if 'limit' in request.GET:
            total = matching_files.count()
            limit = int(request.GET['limit'])
            offset = int(request.GET.get('offset', 0))
            matching_files = matching_files.all()[offset:offset+limit]
            files_serialized = FileSerializer(matching_files, many=True)
            return Response({
                'page': files_serialized.data,
                'total': total
            })
        else:
            files_serialized = FileSerializer(matching_files, many=True)
            return Response(files_serialized.data)


class GetFolders(views.APIView):
    def get(self, request):
        matching_folders = filter_folders(Folder.objects, request.GET)

        if 'limit' in request.GET:
            total = matching_folders.count()
            limit = int(request.GET['limit'])
            offset = int(request.GET.get('offset', 0))
            matching_folders = matching_folders.all()[offset:offset+limit]
            folders_serialized = FolderSerializer(matching_folders, many=True)
            return Response({
                'page': folders_serialized.data,
                'total': total
            })
        else:
            folders_serialized = FolderSerializer(matching_folders, many=True)
            return Response(folders_serialized.data)


class GetFileTypes(views.APIView):
    def get(self, request):
        file_types = FileType.objects

        if 'source' in request.GET:
            file_types = file_types.filter(directory__id=request.GET['source'])

        if 'limit' in request.GET:
            total = int(file_types.count())
            limit = int(request.GET['limit'])
            offset = int(request.GET.get('offset', 0))
            file_types = file_types.order_by('-total_size').all()[offset:offset+limit]
            types_serialized = FileTypeSerializer(file_types, many=True)
            return Response({
                'page': types_serialized.data,
                'total': total
            })
        else:
            types_serialized = FileTypeSerializer(file_types, many=True)
            return Response(types_serialized.data)


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
        dirs = request.GET.getlist('sources[]')
        if len(dirs):
            top_folders = Folder.objects.filter(parent=None, directory__id__in=dirs)
            top_files   = File.objects.filter(parent=None, directory__id__in=dirs)
            folders_serialized = FolderSerializer(top_folders.all(), many=True)
            files_serialized   = FileSerializer(top_files.all(), many=True)
            return Response(folders_serialized.data + files_serialized.data)
        else:
            return Response([])


class GetDuplicates(views.APIView):
    def get(self, request):
        dirs = request.GET.getlist('sources[]')
        if not len(dirs): return Response([])
        
        diff_names = request.GET.get('allow_different_names', 'true') == 'true'
        files = File.objects.filter(directory__id__in=dirs)
        
        if diff_names:
            dupe_groups = files.values('checksum', 'size')
        else:
            dupe_groups = files.values('checksum', 'size', 'name')

        dupe_groups = dupe_groups.annotate(
            dupe_count=Count('id')
        ).annotate(
            total_size=ExpressionWrapper(
                F('dupe_count') * F('size'),
                output_field=IntegerField()
            )
        ).filter(
            dupe_count__gt=1
        )
        
        sort = request.GET.get('sort', None)
        if sort in ('dupe_count', '-dupe_count', 'total_size', '-total_size', 'size', '-size'):
            dupe_groups = dupe_groups.order_by(sort)

        limit = int(request.GET.get('limit', 10))
        total = dupe_groups.count()
        offset = int(request.GET.get('offset', 0))
        dupe_groups = dupe_groups[offset:offset+limit]
        
        duped_files = files.filter(checksum__in=[group['checksum'] for group in dupe_groups]).order_by('checksum', 'name')
        files_serialized = FileSerializer(duped_files, many=True)
        
        return Response({
            'page': files_serialized.data,
            'total': total
        })


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


class GetBackupFile(views.APIView):
    def get(self, request):
        
        source_id = request.GET.get('source', None)
        directory = ImportedDirectory.objects.get(id=source_id)
        files = []

        for file in File.objects.filter(directory__id=source_id).all():
            files.append({
                'path': file.path,
                'checksum': file.checksum,
                'size': file.size,
                'created': file.date_created.timestamp()
            })

        file_data = {
            'format': 'datahog:0.1',
            'root': directory.root_path,
            'type': directory.directory_type,
            'date_scanned': directory.date_scanned.timestamp(),
            'files': files,
            'has_checksums': directory.has_checksums
        }

        backup_file = ContentFile(pickle.dumps(file_data))
        file_name = '{}.datahog'.format(directory.name)

        def get_file_chunks():
            while True:
                data = backup_file.read(1024)
                if not data: break
                yield data

        response = StreamingHttpResponse(get_file_chunks(), content_type='application/octet-stream')
        response['Content-Disposition'] = 'attachment; filename="{}"'.format(file_name)
        return response