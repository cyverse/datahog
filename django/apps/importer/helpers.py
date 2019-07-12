from io import StringIO
from django.db import transaction
from django.core import management
from django.core.files.base import ContentFile
from apps.file_data.models import *
from .models import AsyncTask


def create_db_backup(task):
    buffer = StringIO()
    management.call_command('dumpdata', '--database=file_data', stdout=buffer)
    buffer.seek(0)
    task.fixture.save('db.json', ContentFile(buffer.read()))

    for task in AsyncTask.objects.filter(fixture__isnull=False).exclude(id=task.id):
        if task.fixture.name:
            task.fixture.storage.delete(task.fixture.name)
            task.fixture.delete()


def build_file_database(task, source, file_objects):
    task.status_message = 'Analyzing files...'
    task.save()
    print('Building file tree...')

    file_count = 0
    folder_count = 0
    total_size = 0
    file_types_by_extension = {}
    folder_objects_by_path = {}
    file_owners_by_name = {}
    file_groups_by_name = {}

    # create root folder
    folder_objects_by_path[source.root_path] = Folder(
        path=source.root_path,
        name=source.name,
        total_size=0,
        source=source
    )

    for file_obj in file_objects:
        total_size += file_obj.size

        # find parent folder's path
        last_slash = file_obj.path.rfind('/')
        parent_path = file_obj.path[:last_slash]
        if not len(parent_path): parent_path = '/'
        child_obj = file_obj

        # update all parent folders
        while True:
            last_slash = parent_path.rfind('/')
            if parent_path in folder_objects_by_path:
                parent_obj = folder_objects_by_path[parent_path]
                parent_obj.total_size += file_obj.size
            else:
                # if the parent folder doesn't exist, create it
                folder_name = parent_path[last_slash+1:]
                folder_path = parent_path
                
                parent_obj = Folder(
                    path=folder_path,
                    name=folder_name,
                    total_size=file_obj.size,
                    source=source
                )
                folder_objects_by_path[parent_path] = parent_obj

            child_obj.parent = parent_obj
            if parent_path == source.root_path: break

            # iterate up the hierarchy
            child_obj = parent_obj
            parent_path = parent_path[:last_slash]
            if not len(parent_path): parent_path = '/'

        # find file type
        last_dot = file_obj.name.rfind('.')
        if last_dot != -1 and last_dot < len(file_obj.name)-1:
            extension = file_obj.name[last_dot+1:]
        else:
            extension = ''
        if extension in file_types_by_extension:
            file_type = file_types_by_extension[extension]
            file_type.total_size += file_obj.size
        else:
            # if this file type doesn't exist yet, create it
            file_type = FileType(
                extension=extension,
                total_size=file_obj.size,
                source=source
            )
            file_types_by_extension[extension] = file_type
        
        if source.has_owners:
            # add file owner
            if file_obj.owner in file_owners_by_name:
                file_owner = file_owners_by_name[file_obj.owner]
                file_owner.total_size += file_obj.size
            else:
                # if this file owner doesn't exist yet, create it
                file_owner = FileOwner(
                    name=file_obj.owner,
                    total_size=file_obj.size,
                    source=source
                )
                file_owners_by_name[file_obj.owner] = file_owner
        
            # add file group
            if file_obj.group in file_groups_by_name:
                file_group = file_groups_by_name[file_obj.group]
                file_group.total_size += file_obj.size
            else:
                # if this file group doesn't exist yet, create it
                file_group = FileGroup(
                    name=file_obj.group,
                    total_size=file_obj.size,
                    source=source
                )
                file_groups_by_name[file_obj.group] = file_group

    source.folder_count = len(folder_objects_by_path.values())
    source.file_count = len(file_objects)
    source.total_size = total_size

    task.status_message = 'Building file database...'
    task.save()
    print('Filling database...')
    with transaction.atomic(using='file_data'):
        File.objects.bulk_create(file_objects)
        Folder.objects.bulk_create(folder_objects_by_path.values())
        FileType.objects.bulk_create(file_types_by_extension.values())
        FileOwner.objects.bulk_create(file_owners_by_name.values())
        FileGroup.objects.bulk_create(file_groups_by_name.values())
        source.save()

