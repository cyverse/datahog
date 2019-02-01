import requests

from irods.session import iRODSSession
from irods.models import DataObject, Collection
from irods.column import Between

from celery import shared_task
from django.db import transaction

from .models import ImportAttempt
from .helpers import build_file_database
from apps.file_data.models import *




import requests
import json
import sys
import time

import requests
import json

r = requests.get('https://de.cyverse.org/terrain/token',
    auth=('csklimowski', '********')
)
response = json.loads(r.text)
bearer_token = 'Bearer {}'.format(response['access_token'])
print('auth done')

start = time.time()
r = requests.post("https://de.cyverse.org/terrain/secured/filesystem/search",
    headers={"authorization": bearer_token},
    data=json.dumps({
        "query": {
            "all": [
                {
                    "type": "path", 
                    "args": {
                        "prefix": "/iplant/home/shared/SOBS/"
                    }
                }
            ]
        },
        "size": 1,
        "scroll": "1m"
    })
)
end = time.time()
print(end-start)
response = json.loads(r.text)
print(response)
scroll_token = response['scroll_id']
has_results = True
results = []

for i in range(500):
    start = time.time()
    r = requests.post('https://de.cyverse.org/terrain/secured/filesystem/search',
        headers={'authorization': bearer_token},
        data=json.dumps({
            "scroll_id": scroll_token,
            "scroll": "1m"
        })
    )
    end = time.time()
    print(end - start)




@shared_text
def import_files_from_cyverse(attempt_id, auth_token):
    attempt = ImportAttempt.objects.get(id=attempt_id)

    try:
        attempt.current_step = 1
        attempt.save()
        print('Contacting server...')
        response = requests.post("https://de.cyverse.org/terrain/secured/filesystem/search",
            headers={"authorization": bearer_token},
            data=json.dumps({
                "query": {
                    "all": [
                        {
                            "type": "path", 
                            "args": {
                                "prefix": attempt.top_folder
                            }
                        }
                    ]
                },
                "size": 1,
                "scroll": "1m"
            })
        )
        
            for result_set in query.get_batches():
                if attempt.current_step != 2:
                    attempt.current_step = 2
                    attempt.save()
                    print('Receiving data batches...')
                for row in result_set:
                    file_path = '{}/{}'.format(row[Collection.name], row[DataObject.name])
                    file_obj = File(
                        name=row[DataObject.name],
                        path=file_path,
                        size=row[DataObject.size],
                        date_created=row[DataObject.create_time]
                    )
                    file_objects.append(file_obj)
        
        build_file_database(attempt, file_objects)
    except Exception as e:
        print('Database update failed due to error: {}'.format(e))
        attempt.in_progress = False
        attempt.failed = True
        attempt.save()


@shared_text
def import_files_from_irods(attempt_id, password):
    attempt = ImportAttempt.objects.get(id=attempt_id)

    try:
        attempt.current_step = 1
        attempt.save()
        print('Contacting server...')
        with iRODSSession(
            user=attempt.irods_user,
            password=password,
            host=attempt.irods_host,
            port=attempt.irods_port,
            zone=attempt.irods_zone
        ) as session:
            query = session.query(
                Collection.name,
                DataObject.name,
                DataObject.checksum,
                DataObject.size,
                DataObject.create_time
            ).filter(
                DataObject.replica_number == 0
            ).filter(
                Between(Collection.name, (
                    attempt.top_folder, 
                    attempt.top_folder + '~'
                ))
            ).limit(1000)

            for result_set in query.get_batches():
                if attempt.current_step != 2:
                    attempt.current_step = 2
                    attempt.save()
                    print('Receiving data batches...')
                for row in result_set:
                    file_path = '{}/{}'.format(row[Collection.name], row[DataObject.name])
                    file_obj = File(
                        name=row[DataObject.name],
                        path=file_path,
                        size=row[DataObject.size],
                        date_created=row[DataObject.create_time]
                    )
                    file_objects.append(file_obj)
        
        build_file_database(attempt, file_objects)
    except Exception as e:
        print('Database update failed due to error: {}'.format(e))
        attempt.in_progress = False
        attempt.failed = True
        attempt.save()
