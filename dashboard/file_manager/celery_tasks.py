import time
import re
from celery import Celery

from .models import *
from django.db import transaction

class CeleryConfig:
    broker_url = 'pyamqp://guest@localhost//'

app = Celery('file_manager')
app.config_from_object(CeleryConfig)

@app.task
def update_database():
    update_log = UpdateLog.objects.create(in_progress=True)
    with transaction.atomic():
        Folder.objects.all().delete()
        File.objects.all().delete()
        FileType.objects.update(total_size=0)

        with open('files.json', 'r') as f:
            files = json.loads(f.read())

        folder_count = 0
        file_count = 0
        total_size = 0

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

            # update file type count
            first_dot = file_name.find('.')
            if first_dot != -1:
                file_extension = file_name[first_dot+1:]
                for ft in FileType.objects.all():
                    if re.fullmatch(ft.extension_pattern, file_extension) is not None:
                        ft.total_size += file_size
                        ft.save()

            file_count += 1
            total_size += file_size

        update_log.folder_count = folder_count
        update_log.file_count = file_count
        update_log.total_size = total_size
        update_log.in_progress = False
        update_log.save()
    
