from apps.file_data.models import *
from django.db import transaction

def build_file_database(attempt, directory, file_objects):
    attempt.current_step = 3
    attempt.save()

    file_count = 0
    folder_count = 0
    total_size = 0
    folder_objects_by_path = {}
    file_types_by_extension = {}

    for file_obj in file_objects:
        total_size += file_obj.size

        # find parent folder's path
        last_slash = file_obj.path.rfind('/')
        parent_path = file_obj.path[:last_slash]
        child_obj = file_obj

        # update all parent folders
        while len(parent_path) > 0:
            last_slash = parent_path.rfind('/')
            if parent_path in folder_objects_by_path:
                parent_obj = folder_objects_by_path[parent_path]
                parent_obj.total_size += file_obj.size
            else:
                # if the parent folder doesn't exist yet, create it
                parent_obj = Folder(
                    path=parent_path,
                    name=parent_path[last_slash+1:],
                    total_size=file_obj.size,
                    directory=directory
                )
                folder_objects_by_path[parent_path] = parent_obj
            # iterate up the hierarchy
            child_obj.parent = parent_obj
            if parent_path == attempt.root_path:
                break
            child_obj = parent_obj
            parent_path = parent_path[:last_slash]

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
    if attempt.root_path in folder_objects_by_path:
        folder_objects_by_path[attempt.root_path].name = attempt.root_path

    directory.folder_count = len(folder_objects_by_path.values())
    directory.file_count = len(file_objects)
    directory.duplicate_count = 0 # TODO: new method to calculate this
    directory.total_size = total_size

    attempt.current_step = 4
    attempt.save()
    print('Filling database...')
    with transaction.atomic(using='file_data'):
        File.objects.bulk_create(file_objects)
        Folder.objects.bulk_create(folder_objects_by_path.values())
        FileType.objects.bulk_create(file_types_by_extension.values())

        directory.save()

        attempt.in_progress = False
        attempt.failed = False
        attempt.save()

    print('Database update successful.')