from django.contrib import admin

from .models import *

admin.site.register(ImportAttempt)
admin.site.register(AsyncTask)