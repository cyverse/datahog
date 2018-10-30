from .models import UpdateLog

def get_last_update():
    try:
        last_update = UpdateLog.objects.filter(failed=False).latest('timestamp')
    except UpdateLog.DoesNotExist:
        last_update = UpdateLog.objects.create(
            in_progress=False,
            folder_count=0,
            file_count=0,
            total_size=0
        )
    return last_update