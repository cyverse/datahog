import time
import re
import json
import datetime

from celery import shared_task
from django.db import transaction

from .models import *

@shared_task
def update_database_from_file(update_id):
    update_log = UpdateLog.objects.get(id=update_id)
    
    try:
        with open(update_log.file.path) as f:
            files = json.loads(f.read())

        if len(files) == 0: 
            raise Exception('Unreadable file')

        with transaction.atomic():
            folder_count = 0
            file_count = 0
            total_size = 0

            FileType.objects.all().delete()
            File.objects.all().delete()
            Folder.objects.all().delete()

            for file in files:

                # update stats
                file_count += 1
                total_size += file['size']
                if (file_count % 100 == 0):
                    print('{} files created'.format(file_count))

                # parse file information
                file_path = '{}/{}'.format(file['collection'], file['name'])
                file_date = datetime.datetime.strptime(file['created'], r'%Y-%m-%d %H:%M:%S')

                # create file object
                file_obj = File.objects.create(
                    name=file['name'],
                    path=file_path,
                    size=file['size'],
                    date_created=file_date,
                    checksum=file['checksum']
                )
                
                # create/update parent folders
                parent_path = file['collection']
                child_obj = file_obj

                while len(parent_path) > 0:
                    parent_slash = parent_path.rfind('/')
                    try:
                        parent_obj = Folder.objects.get(path=parent_path)
                        parent_obj.total_size += file['size']
                        parent_obj.save()
                    except Folder.DoesNotExist:
                        parent_obj = Folder.objects.create(
                            path=parent_path,
                            name=parent_path[parent_slash+1:],
                            total_size=file['size']
                        )
                        print('creating folder {}...'.format(folder_count+1))
                        folder_count += 1

                    child_obj.parent = parent_obj
                    child_obj.save()
                    child_obj = parent_obj
                    parent_path = parent_path[:parent_slash]

                # fill file type
                last_dot = file['name'].rfind('.')
                if last_dot != -1:
                    file_extension = file['name'][last_dot+1:]
                    try:
                        ft = FileType.objects.get(extension_pattern=file_extension)
                    except FileType.DoesNotExist:
                        ft = FileType.objects.create(
                            name=file_extension,
                            extension_pattern=file_extension,
                            total_size=0
                        )
                    ft.total_size += file['size']
                    ft.save()
                    file_obj.file_type = ft
                    file_obj.save()

                # check if duplicate

            update_log.folder_count = folder_count
            update_log.file_count = file_count
            update_log.total_size = total_size
            update_log.in_progress = False
            update_log.failed = False
            update_log.save()

    except Exception as e:
        update_log.in_progress = False
        update_log.failed = True
        update_log.save()
