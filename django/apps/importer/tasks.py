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
        source = ImportedDirectory.objects.get(id=source_id)
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

    try:
        directory = ImportedDirectory(
            name=attempt.irods_name,
            directory_type='iRODS',
            date_scanned=attempt.date_imported,
            root_path=attempt.irods_root,
            has_checksums=True
        )

        def save_file(collection, name, size, date_created, checksum):
            path = '{}/{}'.format(collection, name)
            file_obj = File(
                name=name,
                path=path,
                size=size,
                date_created=date_created,
                directory=directory,
                directory_name=directory.name,
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
                DataObject.create_time
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
                                row[DataObject.checksum]
                            )
                except NetworkException:
                    task.status_subtitle = 'This folder is very large. The import process may take much longer than usual.'
                    task.save()
                    print('Timeout on {}'.format(next_folder))
                    for subcol in col.subcollections:
                        folder_queue.append(subcol.path)
        
        build_file_database(task, directory, file_objects)
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
        directory = ImportedDirectory(
            name=task.import_attempt.file_name,
            directory_type=file_data['type'],
            date_scanned=datetime.datetime.utcfromtimestamp(file_data['date_scanned']),
            root_path=file_data['root'],
            has_checksums=file_data['has_checksums']
        )

        task.status_message = 'Reading file data...'
        task.save()

        for file in file_data['files']:
            file_obj = File(
                name=os.path.basename(file['path']),
                size=file['size'],
                path=file['path'],
                date_created=datetime.datetime.utcfromtimestamp(file['created']),
                directory=directory,
                directory_name=directory.name,
                checksum=file['checksum']
            )
            if 'checksum' in file: file_obj.checksum = file['checksum']
            file_objects.append(file_obj)

        build_file_database(task, directory, file_objects)
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
        directory = ImportedDirectory(
            name=attempt.cyverse_name,
            directory_type='CyVerse',
            date_scanned=attempt.date_imported,
            root_path=attempt.cyverse_root,
            has_checksums=False
        )

        task.status_message = 'Scanning directories...'
        task.save()

        # Recursively crawl using paged-directory API
        TERRAIN_BASE = 'https://de.cyverse.org'
        dirs_to_scan = deque([attempt.cyverse_root])
        dirs_scanned = 0

        while dirs_to_scan:
            current_dir = dirs_to_scan.popleft()
            dirs_scanned += 1

            # Update progress
            task.status_message = 'Scanning... {} files found, {} dirs scanned'.format(
                len(file_objects), dirs_scanned
            )
            task.status_subtitle = current_dir
            task.save()

            offset = 0
            limit = 1000
            while True:
                try:
                    resp = requests.get(
                        '{}/terrain/secured/filesystem/paged-directory'.format(TERRAIN_BASE),
                        params={
                            'path': current_dir,
                            'limit': limit,
                            'offset': offset,
                            'sort-col': 'NAME',
                            'sort-dir': 'ASC',
                        },
                        headers={'Authorization': auth_token},
                        timeout=60,
                    )
                except (requests.ConnectionError, requests.Timeout) as e:
                    print('Connection error scanning {}: {}'.format(current_dir, e))
                    break

                if resp.status_code != 200:
                    print('Error {} scanning {}'.format(resp.status_code, current_dir))
                    break

                data = resp.json()

                # Process files
                for f in data.get('files', []):
                    ts = f.get('date-created', 0)
                    if ts:
                        dt = datetime.datetime.utcfromtimestamp(ts / 1000)
                    else:
                        dt = datetime.datetime.utcnow()

                    file_obj = File(
                        name=f.get('label', ''),
                        path=f.get('path', ''),
                        size=f.get('file-size', 0),
                        date_created=dt,
                        directory=directory,
                        directory_name=directory.name
                    )
                    file_objects.append(file_obj)

                # Queue subdirectories
                for folder in data.get('folders', []):
                    folder_path = folder.get('path', '')
                    if folder_path:
                        dirs_to_scan.append(folder_path)

                # Check if there are more pages
                total = data.get('total', 0)
                fetched = len(data.get('files', [])) + len(data.get('folders', []))
                offset += limit
                if fetched < limit or offset >= total:
                    break

        task.status_message = 'Building database... {} files'.format(len(file_objects))
        task.status_subtitle = ''
        task.save()

        build_file_database(task, directory, file_objects)

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

        directory = ImportedDirectory(        
            name=attempt.s3_name,
            directory_type='S3',
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
                    directory=directory,
                    directory_name=directory.name
                )
                file_objects.append(file_obj)
        
        directory.has_checksums = has_checksums
        
        build_file_database(task, directory, file_objects)
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
