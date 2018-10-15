from rest_framework import serializers

from .models import File, Folder, FileType, UpdateLog


class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ('id', 'name', 'size', 'path', 'date_created', 'is_folder')


class FolderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Folder
        fields = ('id', 'name', 'total_size', 'is_folder')


class FileTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileType
        fields = ('id', 'name', 'total_size')


class UpdateLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = UpdateLog
        fields = ('id', 'timestamp', 'in_progress', 'folder_count', 'file_count', 'total_size')
