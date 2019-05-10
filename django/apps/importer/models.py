from django.db import models


class AsyncTask(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    in_progress = models.BooleanField(default=False)
    status_message = models.CharField(max_length=128, blank=True)
    status_subtitle = models.CharField(max_length=128, blank=True)
    failed = models.BooleanField(default=False)

    import_attempt = models.ForeignKey('ImportAttempt', on_delete=models.CASCADE, null=True, blank=True)
    fixture = models.FileField(upload_to='fixtures/', null=True, blank=True)


class ImportAttempt(models.Model):

    date_imported = models.DateTimeField(auto_now_add=True)

    irods_user = models.CharField(max_length=64, blank=True)
    irods_host = models.CharField(max_length=64, blank=True, default='data.cyverse.org')
    irods_port = models.CharField(max_length=64, blank=True, default='1247')
    irods_zone = models.CharField(max_length=64, blank=True, default='iplant')
    irods_root = models.CharField(max_length=512, blank=True)
    irods_name = models.CharField(max_length=32, blank=True, default='My iRODS Files')

    cyverse_user = models.CharField(max_length=64, blank=True)
    cyverse_root = models.CharField(max_length=512, blank=True)
    cyverse_name = models.CharField(max_length=32, blank=True, default='My CyVerse Files')

    s3_key    = models.CharField(max_length=64, blank=True)
    s3_bucket = models.CharField(max_length=64, blank=True)
    s3_root   = models.CharField(max_length=512, blank=True)
    s3_name   = models.CharField(max_length=32, blank=True, default='My S3 Files')

    file_name = models.CharField(max_length=32, blank=True)

