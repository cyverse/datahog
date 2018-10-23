import uuid
from enum import Enum
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
    name = models.CharField(max_length=50)
    extension_pattern = models.CharField(max_length=50)
    total_size = models.BigIntegerField()

    def __str__(self):
        return self.name


class UpdateLog(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    in_progress = models.BooleanField(default=True)
    failed = models.BooleanField(default=False)
    file = models.FileField(upload_to='uploads/%Y%m%d%H%M%S/', blank=True, null=True)
    folder_count = models.IntegerField(default=0)
    file_count = models.IntegerField(default=0)
    total_size = models.BigIntegerField(default=0)
