from irods.session import iRODSSession
from irods.models import DataObject, Collection
from irods.column import Between

from celery import shared_task
from django.db import transaction

from .models import ImportAttempt
from .helpers import build_file_database
from apps.file_data.models import *

@shared_text
def import_files_from_cyverse(attempt_id, password):
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
