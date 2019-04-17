from django.db import models


class ImportAttempt(models.Model):
    IMPORT_METHOD_CHOICES = (
        ('iRODS', 'iRODS'),
        ('CyVerse', 'CyVerse'),
        ('S3', 'S3'),
        ('File', 'File')
    )

    date_imported = models.DateTimeField(auto_now_add=True)
    in_progress = models.BooleanField(default=False)
    current_step = models.IntegerField(default=0)
    failed = models.BooleanField(default=False)
    username = models.CharField(max_length=64, blank=True)
    root_path = models.CharField(max_length=512, blank=True)
    import_method = models.CharField(max_length=1, blank=True, choices=IMPORT_METHOD_CHOICES, default='File')
    irods_zone = models.CharField(max_length=64, blank=True, default='iplant')
    irods_host = models.CharField(max_length=64, blank=True, default='data.cyverse.org')
    irods_port = models.CharField(max_length=64, blank=True, default='1247')
    s3_bucket = models.CharField(max_length=64, blank=True)
    source_name = models.CharField(max_length=32, blank=True)
