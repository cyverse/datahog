from io import StringIO
import irods
import requests
import json
import os
import pickle

from django.core import management
from django.http import StreamingHttpResponse
from rest_framework.response import Response
from rest_framework import views

from .models import *
from .serializers import *
from .tasks import *
from .helpers import create_db_backup
from apps.file_data.models import ImportedDirectory
from apps.file_data.serializers import ImportedDirectorySerializer


class GetImportContext(views.APIView):
    def get(self, request):
        try:
            last_attempt = ImportAttempt.objects.latest('date_imported')
        except ImportAttempt.DoesNotExist:
            last_attempt = ImportAttempt()

            iplant_user = os.environ.get('IPLANT_USER')
            if iplant_user:
                last_attempt.irods_user   = iplant_user
                last_attempt.cyverse_user = iplant_user
                last_attempt.irods_root   = '/iplant/home/{}'.format(iplant_user)
                last_attempt.cyverse_root = '/iplant/home/{}'.format(iplant_user)
            
            last_attempt.save()
        
        attempt_serializer = ImportAttemptSerializer(last_attempt)

        directories = ImportedDirectory.objects.order_by('-date_viewed').all()
        directory_serializer = ImportedDirectorySerializer(directories, many=True)
        
        return Response({
            'last_attempt': attempt_serializer.data,
            'sources': directory_serializer.data
        })


class LastTask(views.APIView):
    def get(self, request):
        try:
            last_task = AsyncTask.objects.latest('timestamp')
        except AsyncTask.DoesNotExist:
            last_task = AsyncTask.objects.create()
        
        serializer = AsyncTaskSerializer(last_task)
        return Response(serializer.data)
    
    def patch(self, request):
        try:
            last_task = AsyncTask.objects.latest('timestamp')
        except AsyncTask.DoesNotExist:
            return Response('No such task exists.', status=400)

        if 'warning' in request.data:
            last_task.warning = request.data['warning']
        
        last_task.save()
        return Response('Task edited successfully.')


class GetDBDump(views.APIView):
    def get(self, request):
        
        try:
            last_task = AsyncTask.objects.filter(failed=False).latest('timestamp')
        except AsyncTask.DoesNotExist:
            last_task = AsyncTask.objects.create()

        if last_task.fixture is None:
            create_db_backup(last_task)
        
        db_file = last_task.fixture
        db_file.open(mode='r')

        def file_chunks():
            chunk = db_file.read(1024)
            while len(chunk):
                yield chunk
                chunk = db_file.read(1024)

        response = StreamingHttpResponse(file_chunks(), content_type='text/json')
        response['Content-Disposition'] = 'attachment; filename="datahog_db.json"'
        return response


class RestoreDB(views.APIView):
    def post(self, request):
        if 'file' not in request.FILES:
            return Response('File not found.', status=400)
        file = request.FILES['file']

        new_task = AsyncTask.objects.create(
            in_progress=True,
            status_message='Restoring database...',
            status_subtitle='This may take several minutes.',
            fixture=file
        )

        load_data.delay(new_task.id)
        serializer = AsyncTaskSerializer(new_task)
        return Response(serializer.data, status=200)


class DeleteDirectory(views.APIView):
    def delete(self, request):
        try:
            source = ImportedDirectory.objects.get(id=request.data['source'])
        except:
            return Response('Source not found.', status=400)

        new_task = AsyncTask.objects.create(
            in_progress=True,
            status_message='Deleting source...',
            status_subtitle='This may take several minutes.'
        )
        
        delete_source.delay(new_task.id, source_id=source.id)
        serializer = AsyncTaskSerializer(new_task)
        return Response(serializer.data)


class ImportFromIrods(views.APIView):
    def post(self, request):
        required_fields = ('user', 'password', 'host', 'port', 'zone', 'root', 'name')
        for field in required_fields:
            if field not in request.data:
                return Response('Missing required field: {}'.format(field), status=400)

        user = request.data['user']
        password = request.data['password']
        host = request.data['host']
        port = request.data['port']
        zone = request.data['zone']
        name = request.data['name']
        root = request.data['root']

        if root[0] != '/': root = '/{}'.format(root)
        if root[len(root)-1] == '/': root = root[:len(root)-1]
        
        with irods.session.iRODSSession(
            user=user,
            password=password,
            host=host,
            port=port,
            zone=zone,
        ) as session:
            try:
                session.collections.get(root)
            except irods.exception.NetworkException:
                return Response('Unable to connect to iRODS server at {}:{}.'.format(host, port), status=400)
            except irods.exception.CAT_INVALID_AUTHENTICATION:
                return Response('Invalid authentication credentials.', status=400)
            except irods.exception.CollectionDoesNotExist:
                return Response('The requested folder does not exist.', status=400)
            except Exception as e:
                return Response('Error: {}'.format(e))
        
        
        last_attempt = ImportAttempt.objects.latest('date_imported')

        new_attempt = ImportAttempt.objects.create(
            irods_user=user,
            irods_host=host,
            irods_port=port,
            irods_zone=zone,
            irods_root=root,
            irods_name=name,

            cyverse_user=last_attempt.cyverse_user,
            cyverse_root=last_attempt.cyverse_root,
            cyverse_name=last_attempt.cyverse_name,
            
            s3_key=last_attempt.s3_key,
            s3_bucket=last_attempt.s3_bucket,
            s3_root=last_attempt.s3_root,
            s3_name=last_attempt.s3_name,
        )

        new_task = AsyncTask.objects.create(
            in_progress=True,
            status_message='Starting import process...',
            status_subtitle='This may take several minutes.',
            import_attempt=new_attempt
        )

        import_files_from_irods.delay(new_task.id, password=password)

        serializer = AsyncTaskSerializer(new_task)
        return Response(serializer.data, status=200)


class ImportFromCyverse(views.APIView):
    def post(self, request):
        required_fields = ('user', 'password', 'root', 'name')
        for field in required_fields:
            if field not in request.data:
                return Response('Missing required field: {}'.format(field), status=400)

        user = request.data['user']
        password = request.data['password']
        name = request.data['name']
        root = request.data['root']

        if root[0] != '/': root = '/{}'.format(root)
        if root[len(root)-1] == '/': root = root[:len(root)-1]
        
        try:
            response = requests.get(
                'https://de.cyverse.org/terrain/token',
                auth=(user, password)
            )
        except Exception as e:
            return Response('Unable to connect to the CyVerse.', status=500)

        auth_info = json.loads(response.text)
        if 'access_token' not in auth_info:
            return Response('Invalid authentication credentials.', status=400)

        auth_token = 'Bearer {}'.format(auth_info['access_token'])
        
        last_attempt = ImportAttempt.objects.latest('date_imported')

        new_attempt = ImportAttempt.objects.create(
            irods_user=last_attempt.irods_user,
            irods_host=last_attempt.irods_host,
            irods_port=last_attempt.irods_port,
            irods_zone=last_attempt.irods_zone,
            irods_root=last_attempt.irods_root,
            irods_name=last_attempt.irods_name,

            cyverse_user=user,
            cyverse_root=root,
            cyverse_name=name,
            
            s3_key=last_attempt.s3_key,
            s3_bucket=last_attempt.s3_bucket,
            s3_root=last_attempt.s3_root,
            s3_name=last_attempt.s3_name,
        )

        new_task = AsyncTask.objects.create(
            in_progress=True,
            status_message='Starting import process...',
            status_subtitle='This may take several minutes.',
            import_attempt=new_attempt
        )

        import_files_from_cyverse.delay(new_task.id, auth_token=auth_token)

        serializer = AsyncTaskSerializer(new_task)
        return Response(serializer.data, status=200)


class ImportFromFile(views.APIView):
    def post(self, request):
        if 'name' not in request.data:
            return Response('Missing required field: name', status=400)
        if 'file' not in request.FILES:
            return Response('File not found.', status=400)

        name = request.data['name']
        file = request.FILES['file']

        try:
            file_data = pickle.load(file)
            assert file_data['format'] in ('datahog:0.1',)
        except:
            return Response('Not a valid .datahog file.', status=400)

        last_attempt = ImportAttempt.objects.latest('date_imported')

        new_attempt = ImportAttempt.objects.create(
            file_name=name,

            irods_user=last_attempt.irods_user,
            irods_host=last_attempt.irods_host,
            irods_port=last_attempt.irods_port,
            irods_zone=last_attempt.irods_zone,
            irods_root=last_attempt.irods_root,
            irods_name=last_attempt.irods_name,

            cyverse_user=last_attempt.cyverse_user,
            cyverse_root=last_attempt.cyverse_root,
            cyverse_name=last_attempt.cyverse_name,
            
            s3_key=last_attempt.s3_key,
            s3_bucket=last_attempt.s3_bucket,
            s3_root=last_attempt.s3_root,
            s3_name=last_attempt.s3_name,
        )

        new_task = AsyncTask.objects.create(
            in_progress=True,
            status_message='Starting import process...',
            status_subtitle='This may take several minutes.',
            import_attempt=new_attempt
        )

        import_files_from_file.delay(new_task.id, file_data)

        serializer = AsyncTaskSerializer(new_task)
        return Response(serializer.data, status=200)


class ImportFromS3(views.APIView):
    def post(self, request):
        required_fields = ('key', 'secret', 'bucket', 'name')
        for field in required_fields:
            if field not in request.data:
                return Response('Missing required field: {}'.format(field), status=400)

        key = request.data['key']
        secret = request.data['secret']
        bucket = request.data['bucket']
        name = request.data['name']
        root = request.data.get('root', '')
    
        client = boto3.client('s3',
            aws_access_key_id=key,
            aws_secret_access_key=secret
        )

        try:
            client.list_buckets()
        except:
            return Response('Invalid AWS credentials.', status=400)
        
        try:
            client.head_bucket(Bucket=bucket)
        except:
            return Response('Unable to access the requested bucket.', status=400)

        if len(root):
            # reformat root for AWS style
            if root[len(root)-1] != '/': root = '{}/'.format(root)
            if root[0] == '/': root = root[1:]
            try:
                client.head_object(Bucket=bucket, Key=root)
            except:
                return Response('Unable to find the requested folder.', status=400)
        
        last_attempt = ImportAttempt.objects.latest('date_imported')
        new_attempt = ImportAttempt.objects.create(
            irods_user=last_attempt.irods_user,
            irods_host=last_attempt.irods_host,
            irods_port=last_attempt.irods_port,
            irods_zone=last_attempt.irods_zone,
            irods_root=last_attempt.irods_root,
            irods_name=last_attempt.irods_name,

            cyverse_user=last_attempt.cyverse_user,
            cyverse_root=last_attempt.cyverse_root,
            cyverse_name=last_attempt.cyverse_name,
            
            s3_key=key,
            s3_bucket=bucket,
            s3_root=root,
            s3_name=name,
        )

        new_task = AsyncTask.objects.create(
            in_progress=True,
            status_message='Starting import process...',
            status_subtitle='This may take several minutes.',
            import_attempt=new_attempt
        )

        import_files_from_s3.delay(new_task.id, secret_key=secret)

        serializer = AsyncTaskSerializer(new_task)
        return Response(serializer.data, status=200)
