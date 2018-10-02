from django.contrib import admin

from .models import File, Folder, FileType, UpdateLog


class FileAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'name', 'size', 'date_created', 'file_type', 'path'
    )
    search_fields = (
        'id', 'name', 'path'
    )


class FolderAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'name', 'total_size', 'path'
    )
    search_fields = (
        'id', 'name', 'path'
    )

admin.site.register(File, FileAdmin)
admin.site.register(Folder, FolderAdmin)
admin.site.register(FileType)
admin.site.register(UpdateLog)