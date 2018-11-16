from rest_framework.response import Response
from rest_framework import views

from .models import UpdateLog
from .serializers import UpdateLogSerializer
from .tasks import update_database_from_file


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


class GetRecentUpdates(views.APIView):
    def get(self, request):
        serializer = UpdateLogSerializer(UpdateLog.objects.order_by('-timestamp').all(), many=True)
        return Response(serializer.data)


class UpdateFromFile(views.APIView):
    def post(self, request):
        if 'file' not in request.data:
            return Response('No file provided.', status=400)
        
        file = request.data['file']
        update_log = UpdateLog.objects.create(file=file)
        update_database_from_file.delay(update_log.id)

        serializer = UpdateLogSerializer(update_log)
        return Response(serializer.data, status=200)


class RestoreFromUpdate(views.APIView):
    def post(self, request):
        if 'update_id' not in request.data:
            return Response('No prior update provided.', status=400)

        try:
            update_log = UpdateLog.objects.get(pk=request.data['update_id'])
        except UpdateLog.DoesNotExist:
            return Response('That update does not exist!', status=404)

        new_log = UpdateLog.objects.create(file=update_log.file)
        update_database_from_file.delay(new_log.id)

        serializer = UpdateLogSerializer(new_log)
        return Response(serializer.data, status=200)




