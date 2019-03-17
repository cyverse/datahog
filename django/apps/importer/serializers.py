from rest_framework import serializers
from .models import ImportAttempt


class ImportAttemptSerializer(serializers.ModelSerializer):
    date_imported = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S')
    class Meta:
        model = ImportAttempt
        fields = ('id', 'date_imported', 'in_progress', 'current_step', 'failed', 
            'username', 'irods_host', 'irods_port', 'irods_zone', 'root_path')
