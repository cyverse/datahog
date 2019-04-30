from django.contrib import admin

from .models import *


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


class FileTypeAdmin(admin.ModelAdmin):
    list_display = (
        'extension', 'total_size'
    )
    search_fields = (
        'extension',
    )


class ImportedDirectoryAdmin(admin.ModelAdmin):
    list_display = (
        'date_scanned', 'file_count', 'folder_count', 'total_size'
    )
    search_fields = (
        'date_scanned',
    )

admin.site.register(File, FileAdmin)
admin.site.register(Folder, FolderAdmin)
admin.site.register(FileType, FileTypeAdmin)
admin.site.register(ImportedDirectory, ImportedDirectoryAdmin)