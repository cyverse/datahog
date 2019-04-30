from rest_framework import serializers
from .models import ImportAttempt


class ImportAttemptSerializer(serializers.ModelSerializer):
    date_imported = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S')
    class Meta:
        model = ImportAttempt
        fields = ('id', 'date_imported', 'in_progress', 'current_step', 'failed', 
            'irods_user', 'irods_host', 'irods_port', 'irods_zone', 'irods_root', 'irods_name',
            'cyverse_user', 'cyverse_root', 'cyverse_name', 'file_name', 
            's3_key', 's3_bucket', 's3_root', 's3_name')
