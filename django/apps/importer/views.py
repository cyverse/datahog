import irods
from rest_framework.response import Response
from rest_framework import views

from .models import ImportAttempt
from .serializers import ImportAttemptSerializer
from .tasks import import_files_from_irods


class GetLastAttempt(views.APIView):
    def get(self, request):
        try:
            latest_attempt = ImportAttempt.objects.latest('timestamp')
        except ImportAttempt.DoesNotExist:
            latest_attempt = ImportAttempt.objects.create(
                in_progress=False,
                irods_host='data.cyverse.org',
                irods_port='1247',
                irods_zone='iplant'
            )
        serializer = ImportAttemptSerializer(latest_attempt)
        return Response(serializer.data)


class ImportFromIrods(views.APIView):
    def post(self, request):
        required_fields = ('user', 'password', 'host', 'port', 'zone', 'folder')
        for field in required_fields:
            if field not in request.data:
                return Response('Missing required field: {}'.format(field), status=400)

        user = request.data['user']
        password = request.data['password']
        host = request.data['host']
        port = request.data['port']
        zone = request.data['zone']
        folder = request.data['folder']
        
        with irods.session.iRODSSession(
            user=user,
            password=password,
            host=host,
            port=port,
            zone=zone,
        ) as session:
            try:
                session.collections.get(folder)
            except irods.exception.NetworkException:
                return Response('Unable to connect to iRODS server at {}:{}.'.format(host, port), status=400)
            except irods.exception.CAT_INVALID_AUTHENTICATION:
                return Response('Invalid authentication credentials.', status=400)
            except irods.exception.CollectionDoesNotExist:
                return Response('The requested folder does not exist.', status=400)
            except Exception as e:
                return Response('Error: {}'.format(e))
        
        new_attempt = ImportAttempt.objects.create(
            in_progress=True,
            irods_user=user,
            irods_host=host,
            irods_port=port,
            irods_zone=zone,
            top_folder=folder,
        )
        import_files_from_irods.delay(new_attempt.id, password=password)

        serializer = ImportAttemptSerializer(new_attempt)
        return Response(serializer.data, status=200)
