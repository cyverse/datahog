from celery import shared_task
from django.db import transaction
import time
import re
import json
import datetime

from .models import *

@shared_task
def update_database_from_file(update_id):
    update_log = UpdateLog.objects.get(id=update_id)
    
    try:
        with open(update_log.file.path) as f:
            files = json.loads(f.read())

        with transaction.atomic():

            folder_count = 0
            file_count = 0
            total_size = 0

            FileType.objects.update(total_size=0)
            File.objects.all().delete()
            Folder.objects.all().delete()

            for file in files:
                # parse file information
                last_slash = file['path'].rfind('/')
                if last_slash <= 0:
                    file_name = file['path']
                else:
                    file_name = file['path'][last_slash+1:]

                file_size = file['size']
                file_date = datetime.datetime.strptime(file['created'], r'%Y-%m-%d %H:%M:%S')

                # create file object
                file_obj = File.objects.create(
                    name=file_name,
                    path=file['path'],
                    size=file['size'],
                    date_created=file_date
                )
                print('creating file {}...'.format(file_count+1))
                
                # update parent folders
                parent_path = file_obj.path[:last_slash]
                child_obj = file_obj

                while len(parent_path) > 0:
                    parent_slash = parent_path.rfind('/')
                    try:
                        parent_obj = Folder.objects.get(path=parent_path)
                        parent_obj.total_size += file_size
                        parent_obj.save()
                    except Folder.DoesNotExist:
                        parent_obj = Folder.objects.create(
                            path=parent_path,
                            name=parent_path[parent_slash+1:],
                            total_size=file_size
                        )
                        print('creating folder {}...'.format(folder_count+1))
                        folder_count += 1

                    child_obj.parent = parent_obj
                    child_obj.save()
                    child_obj = parent_obj
                    parent_path = parent_path[:parent_slash]

                last_dot = file_name.rfind('.')
                if last_dot == -1:
                    file_extension = ''
                else:
                    file_extension = file_name[last_dot+1:]
                
                for ft in FileType.objects.all():
                    if re.fullmatch(ft.extension_pattern, file_extension) is not None:
                        file_obj.file_type = ft
                        ft.total_size += file_size
                        ft.save()
                        file_obj.save()
                        break

                file_count += 1
                total_size += file_size        

            update_log.folder_count = folder_count
            update_log.file_count = file_count
            update_log.total_size = total_size
            update_log.in_progress = False
            update_log.success = True
            update_log.save()

    except Exception as e:
        print(e)
        update_log.in_progress = False
        update_log.success = False
        update_log.save()

