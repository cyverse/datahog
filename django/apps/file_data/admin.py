from django.contrib import admin

from .models import *


class FileAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'source', 'name', 'size', 'date_created', 'path'
    )
    search_fields = (
        'id', 'name', 'path'
    )


class FolderAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'source', 'name', 'total_size', 'path'
    )
    search_fields = (
        'id', 'name', 'path'
    )


class FileTypeAdmin(admin.ModelAdmin):
    list_display = (
        'extension', 'source', 'total_size'
    )
    search_fields = (
        'extension',
    )


class FileOwnerAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'source', 'total_size'
    )
    search_fields = (
        'name',
    )


class FileGroupAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'source', 'total_size'
    )
    search_fields = (
        'name',
    )


class FileSourceAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'source_type', 'date_scanned', 'file_count', 'folder_count', 'total_size'
    )
    search_fields = (
        'source_type',
    )

admin.site.register(File, FileAdmin)
admin.site.register(Folder, FolderAdmin)
admin.site.register(FileType, FileTypeAdmin)
admin.site.register(FileSource, FileSourceAdmin)
admin.site.register(FileOwner, FileOwnerAdmin)
admin.site.register(FileGroup, FileGroupAdmin)