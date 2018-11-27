from rest_framework import serializers
from .models import File, Folder, FileType, FileSummary


class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ('id', 'name', 'size', 'path', 'date_created', 'is_folder')


class FolderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Folder
        fields = ('id', 'name', 'total_size', 'path', 'is_folder')


class FileTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileType
        fields = ('id', 'name', 'total_size')

class FileSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = FileSummary
        fields = ('id', 'timestamp', 'folder_count', 'file_count', 'total_size')
