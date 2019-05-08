import uuid
from django.db import models


class ImportedDirectory(models.Model):
    DIRECTORY_TYPE_CHOICES = (
        ('iRODS', 'iRODS'),
        ('CyVerse', 'CyVerse'),
        ('Local folder', 'Local folder')
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=32)
    date_scanned = models.DateTimeField()
    date_viewed = models.DateTimeField(auto_now_add=True)
    root_path = models.CharField(max_length=512, blank=True)
    folder_count = models.IntegerField(default=0)
    file_count = models.IntegerField(default=0)
    has_checksums = models.BooleanField(default=False)
    duplicate_count = models.IntegerField(default=0)
    total_size = models.BigIntegerField(default=0)
    size_timeline_data = models.TextField(blank=True, null=True)
    type_chart_data = models.TextField(blank=True, null=True)
    directory_type = models.CharField(max_length=16, choices=DIRECTORY_TYPE_CHOICES, default='Local folder')

    def __str__(self):
        return self.root_path

class Folder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=128)
    path = models.CharField(max_length=512)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True)
    total_size = models.BigIntegerField(default=0)
    directory = models.ForeignKey('ImportedDirectory', on_delete=models.CASCADE)

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
    checksum = models.CharField(max_length=32, blank=True, null=True)
    date_created = models.DateTimeField()
    directory = models.ForeignKey('ImportedDirectory', on_delete=models.CASCADE)
    directory_name = models.CharField(max_length=32)

    is_folder = False

    def __str__(self):
        return self.name


class FileType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    extension = models.CharField(max_length=50, blank=True)
    total_size = models.BigIntegerField()
    directory = models.ForeignKey('ImportedDirectory', on_delete=models.CASCADE)

    def __str__(self):
        return self.extension
