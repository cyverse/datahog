import datetime
import json

from django.db.models import Sum

from apps.file_data.models import File, Folder, FileType

def create_size_timeline_data():
    earliest_file = File.objects.earliest('date_created')
    now = datetime.datetime.now()
    time_period = (now - earliest_file.date_created) / 100

    current_date = earliest_file.date_created
    current_size = File.objects.filter(
        date_created__gte=current_date,
        date_created__lte=current_date + time_period
    ).aggregate(Sum('size'))['size__sum'] or 0

    files_per_period = [
        {
            'date': current_date.timestamp(),
            'total_size': current_size
        }
    ]

    while current_date + time_period < now:
        current_date += time_period
        current_size += File.objects.filter(
            date_created__gt=current_date,
            date_created__lte=current_date + time_period
        ).aggregate(Sum('size'))['size__sum'] or 0
        files_per_period.append({
            'date': current_date.timestamp(),
            'total_size': current_size
        })

    return json.dumps(files_per_period)


def create_type_chart_data():
    all_types = FileType.objects.order_by('-total_size')
    top_five_types = all_types[:5]
    size_per_type = []
    for file_type in top_five_types:
        size_per_type.append({
            'type': file_type.extension,
            'total_size': file_type.total_size
        })

    other_size = (
        all_types.aggregate(Sum('total_size'))['total_size__sum'] - 
        top_five_types.aggregate(Sum('total_size'))['total_size__sum']
    )
    size_per_type.append({
        'type': 'other',
        'total_size': other_size
    })

    return json.dumps(size_per_type)
    
