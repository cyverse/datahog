from django.db import models


class ImportAttempt(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    in_progress = models.BooleanField(default=True)
    current_step = models.IntegerField(default=0)
    failed = models.BooleanField(default=False)
    username = models.CharField(max_length=64, blank=True)
    irods_host = models.CharField(max_length=64, blank=True)
    irods_port = models.CharField(max_length=64, blank=True)
    irods_zone = models.CharField(max_length=64, blank=True)
    top_folder = models.CharField(max_length=512, blank=True)