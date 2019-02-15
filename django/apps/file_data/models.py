import uuid
from django.db import models


class Folder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=128)
    path = models.CharField(max_length=512)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True)
    total_size = models.BigIntegerField(default=0)

    is_folder = True

    def __str__(self):
        return self.name


class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=128)
    path = models.CharField(max_length=512)
    parent = models.ForeignKey('Folder', on_delete=models.SET_NULL, blank=True, null=True)
    size = models.BigIntegerField(default=0)
    file_type = models.ForeignKey('FileType', on_delete=models.SET_NULL, blank=True, null=True, related_name='files')
    dupe_group = models.ForeignKey('DupeGroup', on_delete=models.SET_NULL, blank=True, null=True, related_name='files')
    date_created = models.DateTimeField()

    is_folder = False

    def __str__(self):
        return self.name


class FileType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    extension = models.CharField(max_length=50, blank=True)
    total_size = models.BigIntegerField()

    def __str__(self):
        return self.extension


class DupeGroup(models.Model):
    checksum = models.CharField(max_length=32, primary_key=True)
    file_size = models.BigIntegerField(default=0)
    file_count = models.IntegerField(default=0)


class FileSummary(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    folder_count = models.IntegerField(default=0)
    file_count = models.IntegerField(default=0)
    duplicate_count = models.IntegerField(default=0)
    total_size = models.BigIntegerField(default=0)
    size_timeline_data = models.TextField(blank=True, null=True)
    type_chart_data = models.TextField(blank=True, null=True)
