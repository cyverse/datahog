from rest_framework import serializers
from .models import UpdateLog


class UpdateLogSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S')
    class Meta:
        model = UpdateLog
        fields = ('id', 'timestamp', 'in_progress', 'failed', 'folder_count', 'file_count', 'total_size')
