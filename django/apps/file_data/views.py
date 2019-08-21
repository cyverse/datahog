import datetime
import csv
import pickle
import json
import os

from django.http import StreamingHttpResponse
from django.core.files.base import ContentFile
from rest_framework.response import Response
from rest_framework import views, pagination, generics, filters
from django.db.models import Count, F, ExpressionWrapper, IntegerField, Q

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
            file_types = file_types.filter(source__id=request.GET['source'])

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
        
        child_folders = Folder.objects.filter(parent=parent_folder).order_by('name')
        child_files   = File.objects.filter(parent=parent_folder).order_by('name')

        folder_serializer = FolderSerializer(child_folders.all(), many=True)
        file_serializer   = FileSerializer(child_files.all(), many=True)

        return Response(folder_serializer.data + file_serializer.data)


class GetTopLevelFiles(views.APIView):
    def get(self, request):
        sources = request.GET.getlist('sources[]')
        if len(sources):
            top_folders = Folder.objects.filter(parent=None, source__id__in=sources)
            top_files   = File.objects.filter(parent=None, source__id__in=sources)
            folders_serialized = FolderSerializer(top_folders.all(), many=True)
            files_serialized   = FileSerializer(top_files.all(), many=True)
            return Response(folders_serialized.data + files_serialized.data)
        else:
            return Response([])


class GetDuplicates(views.APIView):
    def get(self, request):
        sources = request.GET.getlist('sources[]')
        if not len(sources): return Response([])

        # client can specify which fields are used to detect duplicates
        method = request.GET.get('method', 'checksum')
        duped_fields = method.split('+')

        # find groups of alike values and calculate total size
        files = File.objects.filter(source__id__in=sources)
        if 'checksum' in duped_fields:
            files = files.filter(checksum__isnull=False)
        
        dupe_groups = files.values(
            'size', *duped_fields
        ).annotate(
            dupe_count=Count('id')
        ).annotate(
            total_size=ExpressionWrapper(
                F('dupe_count') * F('size'),
                output_field=IntegerField()
            )
        ).filter(
            dupe_count__gt=1
        )

        # sort values        
        sort = request.GET.get('sort', None)
        if sort in ('dupe_count', '-dupe_count', 'total_size', '-total_size', 'size', '-size'):
            dupe_groups = dupe_groups.order_by(sort)

        # paginate values
        limit = int(request.GET.get('limit', 10))
        total = dupe_groups.count()
        offset = int(request.GET.get('offset', 0))
        dupe_groups = dupe_groups[offset:offset+limit]

        # find files matching the current page of value groups
        filter_query = Q()
        for dg in dupe_groups:
            fields = {field: dg[field] for field in duped_fields if field in dg}
            filter_query = filter_query | Q(**fields)

        duped_files = files.filter(filter_query).order_by(*duped_fields, 'name')
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


class GetSources(views.APIView):
    def get(self, request):
        sources = FileSource.objects.order_by('-date_viewed').all()

        for source in sources:
            if not source.size_timeline_data:
                source.size_timeline_data = create_size_timeline_data(source)
                source.save()
            if not source.type_chart_data:
                source.type_chart_data = create_type_chart_data(source)
                source.save()
            if not source.activity_timeline_data:
                source.activity_timeline_data = create_activity_timeline_data(source)
                source.save()
        
        sources_serialized = FileSourceSerializer(sources, many=True)
        return Response(sources_serialized.data)


class GetFileOwners(views.APIView):
    def get(self, request):
        file_owners = FileOwner.objects

        if 'source' in request.GET:
            file_owners = file_owners.filter(source__id=request.GET['source'])

        if 'limit' in request.GET:
            total = int(file_owners.count())
            limit = int(request.GET['limit'])
            offset = int(request.GET.get('offset', 0))
            file_owners = file_owners.order_by('-total_size').all()[offset:offset+limit]
            owners_serialized = FileOwnerSerializer(file_owners, many=True)
            return Response({
                'page': owners_serialized.data,
                'total': total
            })
        else:
            owners_serialized = FileOwnerSerializer(file_owners, many=True)
            return Response(owners_serialized.data)


class GetFileGroups(views.APIView):
    def get(self, request):
        file_groups = FileGroup.objects

        if 'source' in request.GET:
            file_groups = file_groups.filter(source__id=request.GET['source'])

        if 'limit' in request.GET:
            total = int(file_groups.count())
            limit = int(request.GET['limit'])
            offset = int(request.GET.get('offset', 0))
            file_groups = file_groups.order_by('-total_size').all()[offset:offset+limit]
            groups_serialized = FileGroupSerializer(file_groups, many=True)
            return Response({
                'page': groups_serialized.data,
                'total': total
            })
        else:
            groups_serialized = FileGroupSerializer(file_groups, many=True)
            return Response(groups_serialized.data)



class ViewSource(views.APIView):
    def post(self, request):
        try:
            source = FileSource.objects.get(id=request.data['id'])
            source.date_viewed = datetime.datetime.now()
            source.save()
        except:
            source = None
        
        sources = FileSource.objects.order_by('-date_viewed').all()
        sources_serialized = FileSourceSerializer(sources, many=True)
        return Response(sources_serialized.data)


class GetBackupFile(views.APIView):
    def get(self, request):
        
        source_id = request.GET.get('source', None)
        source = FileSource.objects.get(id=source_id)
        files = []

        for file in File.objects.filter(source__id=source_id).all():
            files.append({
                'path': file.path,
                'checksum': file.checksum,
                'size': file.size,
                'created': file.date_created.timestamp()
            })

        file_data = {
            'format': 'datahog:0.1',
            'root': source.root_path,
            'type': source.source_type,
            'date_scanned': source.date_scanned.timestamp(),
            'files': files,
            'has_checksums': source.has_checksums
        }

        backup_file = ContentFile(pickle.dumps(file_data))
        file_name = '{}.datahog'.format(source.name)

        def get_file_chunks():
            while True:
                data = backup_file.read(1024)
                if not data: break
                yield data

        response = StreamingHttpResponse(get_file_chunks(), content_type='application/octet-stream')
        response['Content-Disposition'] = 'attachment; filename="{}"'.format(file_name)
        return response

