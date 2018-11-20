import time
import re
import json
import datetime

from irods.session import iRODSSession
from irods.models import DataObject, Collection
from irods.column import Between

from celery import shared_task
from django.db import transaction

from .models import UpdateLog
from apps.file_data.models import File, Folder, FileType

@shared_task
def update_database_from_file(update_id):
    print('Database update started.')

    update_log = UpdateLog.objects.get(id=update_id)
    try:
        # parse data file
        with open(update_log.file.path) as f:
            files = json.loads(f.read())

        if len(files) == 0: 
            raise Exception('Unreadable file')

        print('{} files found in source file.'.format(len(files)))

        # stats for this update
        file_count = len(files)
        folder_count = 0
        total_size = 0

        file_objects = []
        folder_objects_by_path = {}
        file_types_by_extension = {}
        
        # create file objects
        for file in files:
            file_path = '{}/{}'.format(file['collection'], file['name'])
            file_date = datetime.datetime.strptime(file['created'], r'%Y-%m-%d %H:%M:%S')
            total_size += file['size']

            file_objects.append(File(
                name=file['name'],
                path=file_path,
                size=file['size'],
                date_created=file_date,
                checksum=file['checksum']
            ))
        
        # create related objects
        for file_obj in file_objects:
            
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
                        total_size=file_obj.size
                    )
                    folder_objects_by_path[parent_path] = parent_obj
                    folder_count += 1

                # iterate up the hierarchy
                child_obj.parent = parent_obj
                child_obj = parent_obj
                parent_path = parent_path[:last_slash]

            # find file type
            last_dot = file_obj.name.rfind('.')
            if last_dot != -1:
                extension = file_obj.name[last_dot+1:]
                if extension in file_types_by_extension:
                    file_type = file_types_by_extension[extension]
                    file_type.total_size += file_obj.size
                else:
                    # if this file type doesn't exist yet, create it
                    file_type = FileType(
                        name=extension,
                        extension_pattern=extension,
                        total_size=file_obj.size
                    )
                    file_types_by_extension[extension] = file_type

                file_obj.file_type = file_type
        
        print('Performing insert operation.'.format(len(files)))

        # update database
        with transaction.atomic(using='file_data'):
            FileType.objects.all().delete()
            File.objects.all().delete()
            Folder.objects.all().delete()

            File.objects.bulk_create(file_objects)
            Folder.objects.bulk_create(folder_objects_by_path.values())
            FileType.objects.bulk_create(file_types_by_extension.values())

        update_log.folder_count = folder_count
        update_log.file_count = file_count
        update_log.total_size = total_size
        update_log.in_progress = False
        update_log.failed = False
        update_log.save()

        print('Database update successful.')

    except Exception as e:
        print('Database update failed due to error: {}'.format(e))
        update_log.in_progress = False
        update_log.failed = True
        update_log.save()



@shared_task
def update_database_from_irods(update_id, password):
    ul = UpdateLog.objects.get(id=update_id)

    total_size = 0
    file_count = 0
    folder_count = 0

    file_objects = []
    folder_objects_by_path = {}
    file_types_by_extension = {}

    try:
        print('Getting data from iRODS...')
        with iRODSSession(
            user=ul.irods_user,
            password=password,
            host=ul.irods_host,
            port=ul.irods_port,
            zone=ul.irods_zone
        ) as session:
            query = session.query(
                Collection.name,
                DataObject.name,
                DataObject.checksum,
                DataObject.size,
                DataObject.create_time
            ).filter(
                Between(Collection.name, (
                    ul.top_folder, 
                    ul.top_folder + '~'
                ))
            )

            for result_set in query.get_batches():
                for row in result_set:
                    file_path = '{}/{}'.format(row[Collection.name], row[DataObject.name])

                    file_objects.append(File(
                        name=row[DataObject.name],
                        path=file_path,
                        size=row[DataObject.size],
                        date_created=row[DataObject.create_time],
                        checksum=row[DataObject.checksum]
                    ))
    
        print('Creating objects...')
        for file_obj in file_objects:

            file_count += 1
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
                        total_size=file_obj.size
                    )
                    folder_objects_by_path[parent_path] = parent_obj
                    folder_count += 1

                # iterate up the hierarchy
                child_obj.parent = parent_obj
                child_obj = parent_obj
                parent_path = parent_path[:last_slash]

            # find file type
            last_dot = file_obj.name.rfind('.')
            if last_dot != -1:
                extension = file_obj.name[last_dot+1:]
                if extension in file_types_by_extension:
                    file_type = file_types_by_extension[extension]
                    file_type.total_size += file_obj.size
                else:
                    # if this file type doesn't exist yet, create it
                    file_type = FileType(
                        name=extension,
                        extension_pattern=extension,
                        total_size=file_obj.size
                    )
                    file_types_by_extension[extension] = file_type

                file_obj.file_type = file_type

        print('Filling database...')
        with transaction.atomic(using='file_data'):
            FileType.objects.all().delete()
            File.objects.all().delete()
            Folder.objects.all().delete()

            File.objects.bulk_create(file_objects)
            Folder.objects.bulk_create(folder_objects_by_path.values())
            FileType.objects.bulk_create(file_types_by_extension.values())

            ul.folder_count = folder_count
            ul.file_count = file_count
            ul.total_size = total_size
            ul.in_progress = False
            ul.failed = False
            ul.save()

        print('Database update successful.')
            
    except Exception as e:
        print('Database update failed due to error: {}'.format(e))
        ul.in_progress = False
        ul.failed = True
        ul.save()