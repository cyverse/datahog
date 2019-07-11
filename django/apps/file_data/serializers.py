from rest_framework import serializers
from .models import *


class FileSourceSerializer(serializers.ModelSerializer):
    date_scanned = serializers.DateTimeField(format=r'%Y-%m-%d %H:%M')
    class Meta:
        model = FileSource
        fields = ('id', 'date_scanned', 'folder_count', 'file_count', 'root_path', 'has_checksums',
            'total_size', 'size_timeline_data', 'type_chart_data', 'name', 'source_type')


class FileSerializer(serializers.ModelSerializer):
    date_created = serializers.DateTimeField(format=r'%Y-%m-%d')
    class Meta:
        model = File
        fields = ('id', 'name', 'size', 'path', 'date_created', 'is_folder', 'checksum', 'source_name')


class FolderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Folder
        fields = ('id', 'name', 'total_size', 'path', 'is_folder')


class FileTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileType
        fields = ('id', 'extension', 'total_size')
