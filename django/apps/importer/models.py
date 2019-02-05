from django.db import models


class ImportAttempt(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    in_progress = models.BooleanField(default=False)
    current_step = models.IntegerField(default=0)
    failed = models.BooleanField(default=False)
    username = models.CharField(max_length=64, blank=True)
    irods_host = models.CharField(max_length=64, blank=True, default='data.cyverse.org')
    irods_port = models.CharField(max_length=64, blank=True, default='1247')
    irods_zone = models.CharField(max_length=64, blank=True, default='iplant')
    top_folder = models.CharField(max_length=512, blank=True)
