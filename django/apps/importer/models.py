from django.db import models


class ImportAttempt(models.Model):
    date_imported = models.DateTimeField(auto_now_add=True)
    in_progress = models.BooleanField(default=False)
    current_step = models.IntegerField(default=0)
    failed = models.BooleanField(default=False)
    username = models.CharField(max_length=64, blank=True)
    irods_host = models.CharField(max_length=64, blank=True, default='data.cyverse.org')
    irods_port = models.CharField(max_length=64, blank=True, default='1247')
    irods_zone = models.CharField(max_length=64, blank=True, default='iplant')
    root_path = models.CharField(max_length=512, blank=True)


class ImportedDirectory(models.Model):
    import_attempt = models.ForeignKey(ImportAttempt, on_delete=models.CASCADE)
    name = models.CharField(max_length=132)
    # .../csklimowski/home (iRODS collection)
    # .../shared/SOBS (iRODS collection)
    # 
    db_name = models.CharField(max_length=128)

