import uuid
from django.db import models


class Folder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=128)
    path = models.CharField(max_length=512)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True)
    total_size = models.BigIntegerField()

    is_folder = True

    def __str__(self):
        return self.name


class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=128)
    path = models.CharField(max_length=512)
    parent = models.ForeignKey('Folder', on_delete=models.SET_NULL, blank=True, null=True)
    size = models.BigIntegerField()
    file_type = models.ForeignKey('FileType', on_delete=models.SET_NULL, blank=True, null=True)
    date_created = models.DateTimeField()
    checksum = models.CharField(max_length=32)
    is_duplicate = models.BooleanField(default=False)
    
    is_folder = False

    def __str__(self):
        return self.name


class FileType(models.Model):
    extension = models.CharField(max_length=50)
    total_size = models.BigIntegerField()

    def __str__(self):
        return self.extension


class FileSummary(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    folder_count = models.IntegerField(default=0)
    file_count = models.IntegerField(default=0)
    total_size = models.BigIntegerField(default=0)
