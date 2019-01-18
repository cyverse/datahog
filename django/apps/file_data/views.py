import datetime

from rest_framework.response import Response
from rest_framework import views, pagination, generics, filters

from .models import *
from .serializers import *
from .helpers import create_size_timeline_data, create_type_chart_data


class GetBiggestFiles(generics.ListAPIView):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    pagination_class = pagination.LimitOffsetPagination
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ('size',)
    ordering = ('-size',)


class GetBiggestFolders(generics.ListAPIView):
    queryset = Folder.objects.all()
    serializer_class = FolderSerializer
    pagination_class = pagination.LimitOffsetPagination
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ('total_size',)
    ordering = ('-total_size',)


class GetBiggestFileTypes(generics.ListAPIView):
    queryset = FileType.objects.all()
    serializer_class = FileTypeSerializer
    pagination_class = pagination.LimitOffsetPagination
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ('total_size',)
    ordering = ('-total_size',)


class GetBiggestDupeGroups(generics.ListAPIView):
    queryset = DupeGroup.objects.all()
    serializer_class = DupeGroupSerializer
    pagination_class = pagination.LimitOffsetPagination
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ('file_size',)
    ordering = ('-file_size',)


class GetMostDuped(generics.ListAPIView):
    queryset = DupeGroup.objects.all()
    serializer_class = DupeGroupSerializer
    pagination_class = pagination.LimitOffsetPagination
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ('file_count',)
    ordering = ('-file_count',)


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
        matching_files = File.objects

        if 'name' in request.data:
            if 'type' in request.data and request.data['type'] == 'regex':
                matching_files = matching_files.filter(name__regex=request.data['name'])
            else:
                matching_files = matching_files.filter(name__icontains=request.data['name'])

        if 'created_after' in request.data:
            try:
                parsed_date = datetime.datetime.strptime(request.data['created_after'], r'%Y-%m-%d')
                matching_files = matching_files.filter(date_created__gte=parsed_date)
            except ValueError:
                pass
        
        if 'created_before' in request.data and request.data['created_before']:
            try:
                parsed_date = datetime.datetime.strptime(request.data['created_before'], r'%Y-%m-%d')
                matching_files = matching_files.filter(date_created__lt=parsed_date)
            except ValueError:
                pass
        
        if 'larger_than' in request.data:
            try:
                parsed_size = int(request.data['larger_than'])
                matching_files = matching_files.filter(size__gte=parsed_size)
            except ValueError:
                pass
        
        if 'smaller_than' in request.data:
            try:
                parsed_size = int(request.data['smaller_than'])
                matching_files = matching_files.filter(size__lt=parsed_size)
            except ValueError:
                pass
            pass
        
        files_serialized = FileSerializer(matching_files.all(), many=True)
        return Response(files_serialized.data)


class GetFileSummary(views.APIView):
    def get(self, request):
        try:
            summary = FileSummary.objects.latest('timestamp')
        except FileSummary.DoesNotExist:
            summary = FileSummary.objects.create()
        
        if not summary.size_timeline_data:
            summary.size_timeline_data = create_size_timeline_data()
        if not summary.type_chart_data:
            summary.type_chart_data = create_type_chart_data()
        summary.save()
        
        summary_serialized = FileSummarySerializer(summary)
        return Response(summary_serialized.data)
