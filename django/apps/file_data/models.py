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
    file_type = models.ForeignKey('FileType', on_delete=models.SET_NULL, blank=True, null=True, related_name='files')
    dupe_group = models.ForeignKey('DupeGroup', on_delete=models.SET_NULL, blank=True, null=True, related_name='files')
    date_created = models.DateTimeField()

    is_folder = False

    def __str__(self):
        return self.name


class FileType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    extension = models.CharField(max_length=50)
    total_size = models.BigIntegerField()

    def __str__(self):
        return self.extension


class DupeGroup(models.Model):
    checksum = models.CharField(max_length=32, primary_key=True)
    total_size = models.BigIntegerField()
    file_count = models.IntegerField()

# most duplicated: dupegroup by number of files
# biggest duplicated: files, filtered by dupegroup, ordered by size

class FileSummary(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    folder_count = models.IntegerField(default=0)
    file_count = models.IntegerField(default=0)
    duplicate_count = models.IntegerField(default=0)
    total_size = models.BigIntegerField(default=0)
