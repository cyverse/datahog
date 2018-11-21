from django.db import models


class UpdateLog(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    in_progress = models.BooleanField(default=True)
    failed = models.BooleanField(default=False)
    folder_count = models.IntegerField(default=0)
    file_count = models.IntegerField(default=0)
    total_size = models.BigIntegerField(default=0)
    irods_user = models.CharField(max_length=64, blank=True)
    irods_host = models.CharField(max_length=64, blank=True)
    irods_port = models.CharField(max_length=64, blank=True)
    irods_zone = models.CharField(max_length=64, blank=True)
    top_folder = models.CharField(max_length=512, blank=True)