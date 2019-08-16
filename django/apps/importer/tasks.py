import requests
import json
import datetime
import os
from collections import deque

import boto3
from irods.session import iRODSSession
from irods.models import DataObject, Collection
from irods.column import Between, Like
from irods.exception import NetworkException
from celery import shared_task
from django.db import transaction
from django.core import management

from .models import *
from .helpers import *
from apps.file_data.models import *


@shared_task
def delete_source(task_id, source_id):
    task = AsyncTask.objects.get(id=task_id)
    try:
        print('Deleting source...')
        source = FileSource.objects.get(id=source_id)
        with transaction.atomic(using='file_data'):
            source.delete()
        
    except Exception as e:
        print('Task failed with error: {}'.format(e))
        task.in_progress = False
        task.failed = True
        task.warning = True
        task.status_message = 'Unable to remove file source.'
        task.status_subtitle = 'Error: {}'.format(e)
        task.save()
        return
    
    print('Updating database fixture...')
    create_db_backup(task)
    task.in_progress = False
    task.save()


@shared_task
def load_data(task_id):
    task = AsyncTask.objects.get(id=task_id)
    try:
        with transaction.atomic(using='file_data'):
            print('Deleting old data...')
            management.call_command('flush', '--database=file_data', interactive=False)
            print('Loading new data...')
            management.call_command('loaddata', task.fixture.name, '--database=file_data', '--format=json')
        
    except Exception as e:
        print('Task failed with error: {}'.format(e))
        task.in_progress = False
        task.failed = True
        task.warning = True
        task.status_message = 'Database restoration failed.'
        task.status_subtitle = 'Error: {}'.format(e)
        task.save()
        return
    
    task.in_progress = False
    task.save()


@shared_task
def import_files_from_irods(task_id, password):
    task = AsyncTask.objects.get(id=task_id)
    attempt = task.import_attempt
    file_objects = []
    
    owners_by_name = {}
    groups_by_name = {}

    try:
        source = FileSource(
            name=attempt.irods_name,
            source_type='iRODS',
            date_scanned=attempt.date_imported,
            root_path=attempt.irods_root,
            has_checksums=True,
            has_owners=True,
            has_creation_times=True
        )

        def save_file(collection, name, size, date_created, date_modified, owner, checksum):
            path = '{}/{}'.format(collection, name)
            file_obj = File(
                name=name,
                path=path,
                size=size,
                date_created=date_created,
                date_modified=date_modified,
                owner=owner,
                source=source,
                source_name=source.name,
                checksum=checksum
            )
            file_objects.append(file_obj)

        task.status_message = 'Downloading file data...'
        task.save()
        print('Contacting iRODS...')
        with iRODSSession(
            user=attempt.irods_user,
            password=password,
            host=attempt.irods_host,
            port=attempt.irods_port,
            zone=attempt.irods_zone
        ) as session:
            session.connection_timeout = 120

            base_query = session.query(
                Collection.name,
                DataObject.name,
                DataObject.checksum,
                DataObject.size,
                DataObject.create_time,
                DataObject.modify_time,
                DataObject.owner_name
            ).filter(
                DataObject.replica_number == 0
            ).limit(1000)

            folder_queue = deque([attempt.irods_root])

            while len(folder_queue):
                next_folder = folder_queue.popleft()
                col = session.collections.get(next_folder)
                for obj in col.data_objects:
                    save_file(
                        next_folder,
                        obj.name,
                        obj.size,
                        obj.create_time,
                        obj.modify_time,
                        obj.owner_name,
                        obj.checksum
                    )
                    
                query = base_query.filter(Like(Collection.name, next_folder + '/%'))
                try:
                    for batch in query.get_batches():
                        for row in batch:
                            save_file(
                                row[Collection.name],
                                row[DataObject.name],
                                row[DataObject.size],
                                row[DataObject.create_time],
                                row[DataObject.modify_time],
                                row[DataObject.owner_name],
                                row[DataObject.checksum]
                            )
                except NetworkException:
                    task.status_subtitle = 'This folder is very large. The import process may take much longer than usual.'
                    task.save()
                    print('Timeout on {}'.format(next_folder))
                    for subcol in col.subcollections:
                        folder_queue.append(subcol.path)
        
        build_file_database(task, source, file_objects)
    except Exception as e:
        print('Task failed with error: {}'.format(e))
        task.in_progress = False
        task.failed = True
        task.warning = True
        task.status_message = 'Import failed.'
        task.status_subtitle = 'Error: {}'.format(e)
        task.save()
        return
    
    print('Updating database fixture...')
    create_db_backup(task)
    task.in_progress = False
    task.save()


@shared_task
def import_files_from_file(task_id, file_data):
    task = AsyncTask.objects.get(id=task_id)
    file_objects = []

    try:
        source = FileSource(
            name=task.import_attempt.file_name,
            source_type=file_data['type'],
            date_scanned=datetime.datetime.utcfromtimestamp(file_data['date_scanned']),
            root_path=file_data['root'],
            has_checksums=file_data['has_checksums'],
            has_owners=file_data.get('has_owners', False),
            has_groups=file_data.get('has_groups', False),
            has_creation_times=file_data.get('has_creation_times', False),
            has_access_times=file_data.get('has_access_times', False)
        )

        task.status_message = 'Reading file data...'
        task.save()

        for file in file_data['files']:
            file_obj = File(
                name=os.path.basename(file['path']),
                size=file['size'],
                path=file['path'],
                date_created=datetime.datetime.utcfromtimestamp(file['created']) if file['created'] else None,
                date_modified=datetime.datetime.utcfromtimestamp(file['modified']),
                date_accessed=datetime.datetime.utcfromtimestamp(file['accessed']) if file['accessed'] else None,
                source=source,
                source_name=source.name,
                checksum=file['checksum'],
                owner=file.get('owner', None),
                group=file.get('group', None)
            )
            if 'checksum' in file: file_obj.checksum = file['checksum']
            file_objects.append(file_obj)

        build_file_database(task, source, file_objects)
    except Exception as e:
        print('Task failed with error: {}'.format(e))
        task.in_progress = False
        task.failed = True
        task.warning = True
        task.status_message = 'Import failed'
        task.status_subtitle = 'Error: {}'.format(e)
        task.save()
        return
    
    print('Updating database fixture...')
    create_db_backup(task)
    task.in_progress = False
    task.save()


@shared_task
def import_files_from_cyverse(task_id, auth_token):
    task = AsyncTask.objects.get(id=task_id)
    attempt = task.import_attempt
    file_objects = []

    try:
        source = FileSource(
            name=attempt.cyverse_name,
            source_type='CyVerse',
            date_scanned=attempt.date_imported,
            root_path=attempt.cyverse_root,
            has_checksums=False
        )

        task.status_message = 'Downloading file data...'
        task.save()

        response = requests.post("https://de.cyverse.org/terrain/secured/filesystem/search",
            headers={"authorization": auth_token},
            json={
                "query": {
                    "all": [
                        {
                            "type": "path", 
                            "args": {
                                "prefix": attempt.cyverse_root
                            }
                        }
                    ]
                },
                "size": 10000,
                "scroll": "1m"
            }
        )
        
        page = json.loads(response.text)
        
        scroll_token = page['scroll_id']
        while 'hits' in page and len(page['hits']):
            for hit in page['hits']:
                if hit['_type'] == 'file':
                    file_obj = File(
                        name=hit['_source']['label'],
                        path=hit['_source']['path'],
                        size=hit['_source']['fileSize'],
                        date_created=datetime.datetime.utcfromtimestamp(hit['_source']['dateCreated']/1000),
                        source=source,
                        source_name=source.name
                    )
                    file_objects.append(file_obj)

            response = requests.post('https://de.cyverse.org/terrain/secured/filesystem/search',
                headers={'authorization': auth_token},
                json={
                    "scroll_id": scroll_token,
                    "scroll": "1m"
                }
            )
            page = json.loads(response.text)

        build_file_database(task, source, file_objects)
    except Exception as e:
        print('Task failed with error: {}'.format(e))
        task.in_progress = False
        task.failed = True
        task.warning = True
        task.status_message = 'Import failed.'
        task.status_subtitle = 'Error: {}'.format(e)
        task.save()
        return
    
    print('Updating database fixture...')
    create_db_backup(task)
    task.in_progress = False
    task.save()


@shared_task
def import_files_from_s3(task_id, secret_key):
    task = AsyncTask.objects.get(id=task_id)
    attempt = task.import_attempt
    file_objects = []

    try:
        root_path = attempt.s3_root
        if len(root_path):
            if root_path[0] != '/': root_path = '/{}'.format(root_path)
            if root_path[len(root_path)-1] == '/': root_path = root_path[:len(root_path)-1]
        else:
            root_path = '/'

        source = FileSource(        
            name=attempt.s3_name,
            source_type='S3',
            date_scanned=attempt.date_imported,
            root_path=root_path
        )
        has_checksums = True

        task.status_message = 'Downloading file data...'
        task.save()

        client = boto3.client('s3',
            aws_access_key_id=attempt.s3_key,
            aws_secret_access_key=secret_key
        )

        paginator = client.get_paginator('list_objects_v2')

        pages = paginator.paginate(
            Prefix=attempt.s3_root,
            Bucket='datahog-dev',
            PaginationConfig={
                'PageSize': 100
            }
        )
        for page in pages:
            for result in page['Contents']:
                last_slash = result['Key'].rfind('/')
                file_name = result['Key'][last_slash+1:]
                if not len(file_name): continue
                file_path = '/{}'.format(result['Key'])

                checksum = result['ETag'].strip('"')
                if len(checksum) > 32:
                    has_checksums = False
                
                file_obj = File(
                    name=file_name,
                    path=file_path,
                    checksum=checksum[:32],
                    date_created=result['LastModified'].replace(tzinfo=None),
                    size=result['Size'],
                    source=source,
                    source_name=source.name
                )
                file_objects.append(file_obj)
        
        source.has_checksums = has_checksums
        
        build_file_database(task, source, file_objects)
    except Exception as e:
        print('Task failed with error: {}'.format(e))
        task.in_progress = False
        task.failed = True
        task.warning = True
        task.status_message = 'Import failed.'
        task.status_subtitle = 'Error: {}'.format(e)
        task.save()
        return

    print('Updating database fixture...')
    create_db_backup(task)
    task.in_progress = False
    task.save()
