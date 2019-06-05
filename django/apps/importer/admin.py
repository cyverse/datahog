from django.contrib import admin

from .models import *


class ImportAttemptAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'date_imported',
    )
    search_fields = (
        'id', 'date_imported'
    )


class AsyncTaskAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'timestamp', 'in_progress', 'failed', 'warning', 'status_message', 'status_subtitle'
    )
    search_fields = (
        'id', 'timestamp', 'status_message', 'status_subtitle'
    )

admin.site.register(AsyncTask, AsyncTaskAdmin)
admin.site.register(ImportAttempt, ImportAttemptAdmin)
