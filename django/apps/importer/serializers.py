from rest_framework import serializers
from .models import *


class ImportAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportAttempt
        fields = '__all__'


class AsyncTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = AsyncTask
        fields = '__all__'

