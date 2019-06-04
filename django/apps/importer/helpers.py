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


def build_file_database(task, directory, file_objects):
    task.status_message = 'Analyzing files...'
    task.save()
    print('Building file tree...')

    file_count = 0
    folder_count = 0
    total_size = 0
    file_types_by_extension = {}
    folder_objects_by_path = {}

    # create root folder
    folder_objects_by_path[directory.root_path] = Folder(
        path=directory.root_path,
        name=directory.name,
        total_size=0,
        directory=directory
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
                    directory=directory
                )
                folder_objects_by_path[parent_path] = parent_obj

            child_obj.parent = parent_obj
            if parent_path == directory.root_path: break

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
                directory=directory
            )
            file_types_by_extension[extension] = file_type
        file_obj.file_type = file_type

    # rename top folder to include parents
    # if directory.root_path in folder_objects_by_path:
    #     folder_objects_by_path[directory.root_path].name = directory.name

    directory.folder_count = len(folder_objects_by_path.values())
    directory.file_count = len(file_objects)
    directory.total_size = total_size

    task.status_message = 'Building file database...'
    task.save()
    print('Filling database...')
    with transaction.atomic(using='file_data'):
        File.objects.bulk_create(file_objects)
        Folder.objects.bulk_create(folder_objects_by_path.values())
        FileType.objects.bulk_create(file_types_by_extension.values())
        directory.save()

