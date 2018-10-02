from rest_framework import serializers

from .models import File, Folder

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ('id', 'name', 'size', 'path', 'date_created', 'is_folder')


class FolderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Folder
        fields = ('id', 'name', 'total_size', 'is_folder')
