from django.db import models
from enum import Enum

class FileType(Enum):
    PNG = 'png'
    TXT = 'txt'
    OTHER = 'other'
    FILE_TYPE_CHOICES = (
        (PNG, 'PNG image'),
        (TXT, 'Plain text'),
        (OTHER, 'Other')
    )

class Folder(models.Model):
    is_folder = True
    name = models.CharField(max_length=255)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True)
    size = models.BigIntegerField()

    def __str__(self):
        return '{} ({})'.format(self.name, self.id)


class File(models.Model):
    is_folder = False
    name = models.CharField(max_length=255)
    parent = models.ForeignKey('Folder', on_delete=models.CASCADE)
    size = models.BigIntegerField()
    path = models.CharField(max_length=512)
    extension = models.CharField(max_length=10)
    date_created = models.DateTimeField()

    def __str__(self):
        return '{} ({})'.format(self.name, self.id)
