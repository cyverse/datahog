import requests
import json
import datetime
import os
from collections import deque

from irods.session import iRODSSession
from irods.models import DataObject, Collection
from irods.column import Between
from irods.column import Like
from irods.exception import NetworkException
from celery import shared_task

from .models import ImportAttempt
from .helpers import build_file_database
from apps.file_data.models import *

@shared_task
def import_files_from_cyverse(attempt_id, auth_token):
    attempt = ImportAttempt.objects.get(id=attempt_id)
    file_objects = []

    directory = ImportedDirectory(
        directory_type='CyVerse',
        date_scanned=attempt.date_imported,
        root_path=attempt.root_path,
        has_checksums=False
    )

    try:
        attempt.current_step = 1
        attempt.save()

        response = requests.post("https://de.cyverse.org/terrain/secured/filesystem/search",
            headers={"authorization": auth_token},
            data=json.dumps({
                "query": {
                    "all": [
                        {
                            "type": "path", 
                            "args": {
                                "prefix": attempt.root_path
                            }
                        }
                    ]
                },
                "size": 10000,
                "scroll": "1m"
            })
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
                        date_created=datetime.datetime.fromtimestamp(hit['_source']['dateCreated']/1000),
                        directory=directory
                    )
                    file_objects.append(file_obj)

            response = requests.post('https://de.cyverse.org/terrain/secured/filesystem/search',
                headers={'authorization': auth_token},
                data=json.dumps({
                    "scroll_id": scroll_token,
                    "scroll": "1m"
                })
            )
            page = json.loads(response.text)

        build_file_database(attempt, directory, file_objects)
    except Exception as e:
        print('Database update failed due to error: {}'.format(e))
        attempt.in_progress = False
        attempt.failed = True
        attempt.save()

@shared_task
def import_files_from_irods(attempt_id, password):
    attempt = ImportAttempt.objects.get(id=attempt_id)
    file_objects = []
    file_checksums = {}

    directory = ImportedDirectory(
        directory_type='iRODS',
        date_scanned=attempt.date_imported,
        root_path=attempt.root_path,
        has_checksums=True
    )

    def save_file(collection, name, size, date_created, checksum):
        path = '{}/{}'.format(collection, name)
        file_obj = File(
            name=name,
            path=path,
            size=size,
            date_created=date_created,
            directory=directory
        )
        file_objects.append(file_obj)
        if checksum in file_checksums:
            file_checksums[checksum].append(file_obj)
        else:
            file_checksums[checksum] = [file_obj]

    try:
        attempt.current_step = 1
        attempt.save()
        print('Contacting server...')
        with iRODSSession(
            user=attempt.username,
            password=password,
            host=attempt.irods_host,
            port=attempt.irods_port,
            zone=attempt.irods_zone
        ) as session:
            session.connection_timeout = 60

            base_query = session.query(
                Collection.name,
                DataObject.name,
                DataObject.checksum,
                DataObject.size,
                DataObject.create_time
            ).filter(
                DataObject.replica_number == 0
            ).limit(1000)

            folder_queue = deque([attempt.root_path])

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
                    if attempt.current_step < 2:
                        attempt.current_step = 2
                        attempt.save()
                    print('Timeout on {}'.format(next_folder))
                    for subcol in col.subcollections:
                        folder_queue.append(subcol.path)
        
        build_file_database(attempt, directory, file_objects, file_checksums)
    except Exception as e:
        print('Database update failed due to error: {}'.format(e))
        attempt.in_progress = False
        attempt.failed = True
        attempt.save()


@shared_task
def import_files_from_file(attempt_id, file_data):
    attempt = ImportAttempt.objects.get(id=attempt_id)
    file_objects = []
    file_checksums = {}

    directory = ImportedDirectory(
        directory_type=file_data['type'],
        date_scanned=datetime.datetime.fromtimestamp(file_data['date_scanned']),
        root_path=attempt.root_path,
        has_checksums=file_data['has_checksums']
    )

    try:
        attempt.current_step = 2
        attempt.save()

        for file in file_data['files']:
            file_obj = File(
                name=os.path.basename(file['path']),
                size=file['size'],
                path=file['path'],
                date_created=datetime.datetime.fromtimestamp(file['created']),
                directory=directory
            )
            file_objects.append(file_obj)
            if file['checksum']:
                if file['checksum'] in file_checksums:
                    file_checksums[file['checksum']].append(file_obj)
                else:
                    file_checksums[file['checksum']] = [file_obj]

        build_file_database(attempt, directory, file_objects, file_checksums)
    except Exception as e:
        print('Database update failed due to error: {}'.format(e))
        attempt.in_progress = False
        attempt.failed = True
        attempt.save()
