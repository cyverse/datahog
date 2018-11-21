import irods
from rest_framework.response import Response
from rest_framework import views

from .models import UpdateLog
from .serializers import UpdateLogSerializer
from .tasks import update_database_from_irods


class GetLastUpdate(views.APIView):
    def get(self, request):
        try:
            latest_update = UpdateLog.objects.filter(failed=False).latest('timestamp')
        except UpdateLog.DoesNotExist:
            latest_update = UpdateLog.objects.create(
                in_progress=False,
                folder_count=0,
                file_count=0,
                total_size=0
            )
        serializer = UpdateLogSerializer(latest_update)
        return Response(serializer.data)


class UpdateFromIrods(views.APIView):
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
        
        new_log = UpdateLog.objects.create(
            in_progress=True,
            irods_user=user,
            irods_host=host,
            irods_port=port,
            irods_zone=zone,
            top_folder=folder,
        )
        update_database_from_irods.delay(new_log.id, password=password)

        serializer = UpdateLogSerializer(new_log)
        return Response(serializer.data, status=200)
