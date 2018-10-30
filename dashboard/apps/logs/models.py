from django.db import models


class UpdateLog(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    in_progress = models.BooleanField(default=True)
    failed = models.BooleanField(default=False)
    file = models.FileField(upload_to='uploads/%Y%m%d%H%M%S/', blank=True, null=True)
    folder_count = models.IntegerField(default=0)
    file_count = models.IntegerField(default=0)
    total_size = models.BigIntegerField(default=0)