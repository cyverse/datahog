import datetime
import json

from django.db.models import Sum

from apps.file_data.models import File, Folder, FileType, FileSource

class EchoBuffer:
    def write(self, value):
        return value


def filter_files(file_query, filters):

    sources = filters.getlist('sources[]')
    if len(sources): file_query = file_query.filter(source__id__in=sources)

    if 'source' in filters:
        file_query = file_query.filter(source__id=filters['source'])

    if 'name' in filters:
        if 'type' in filters and filters['type'] == 'regex':
            file_query = file_query.filter(name__regex=filters['name'])
        else:
            file_query = file_query.filter(name__icontains=filters['name'])

    if 'created_after' in filters:
        try:
            parsed_date = datetime.datetime.strptime(filters['created_after'], r'%Y-%m-%d')
            file_query = file_query.filter(date_created__gte=parsed_date)
        except ValueError:
            pass
    
    if 'created_before' in filters and filters['created_before']:
        try:
            parsed_date = datetime.datetime.strptime(filters['created_before'], r'%Y-%m-%d')
            file_query = file_query.filter(date_created__lt=parsed_date)
        except ValueError:
            pass
    
    if 'larger_than' in filters:
        try:
            parsed_size = int(filters['larger_than'])
            file_query = file_query.filter(size__gte=parsed_size)
        except ValueError:
            pass
    
    if 'smaller_than' in filters:
        try:
            parsed_size = int(filters['smaller_than'])
            file_query = file_query.filter(size__lt=parsed_size)
        except ValueError:
            pass
        pass
    
    if 'sort' in filters:
        file_query = file_query.order_by(filters['sort'])
    
    return file_query


def filter_folders(folder_query, filters):

    sources = filters.getlist('sources[]')
    if len(sources): folder_query = folder_query.filter(source__id__in=sources, parent__isnull=False)

    if 'source' in filters:
        folder_query = folder_query.filter(source__id=filters['source'], parent__isnull=False)
    
    if 'sort' in filters:
        folder_query = folder_query.order_by(filters['sort'])
    
    return folder_query


def create_size_timeline_data(source):
    try:
        earliest_file = File.objects.filter(source=source).earliest('date_modified')
    except File.DoesNotExist:
        return '[]'
    
    time_period = (source.date_scanned - earliest_file.date_modified) / 50

    current_date = earliest_file.date_modified
    current_size = File.objects.filter(
        source=source,
        date_modified__gte=current_date,
        date_modified__lte=current_date + time_period
    ).aggregate(Sum('size'))['size__sum'] or 0

    files_per_period = [
        {
            'date': current_date.timestamp(),
            'total_size': current_size
        }
    ]

    while current_date + time_period < source.date_scanned:
        current_date += time_period
        current_size += File.objects.filter(
            source=source,
            date_modified__gt=current_date,
            date_modified__lte=current_date + time_period
        ).aggregate(Sum('size'))['size__sum'] or 0
        files_per_period.append({
            'date': current_date.timestamp(),
            'total_size': current_size
        })

    return json.dumps(files_per_period)


def create_type_chart_data(source):
    all_types = FileType.objects.filter(source=source).order_by('-total_size')
    size_per_type = []
    
    if all_types.count() > 5:
        top_five_types = all_types[:5]
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

    else:
        for file_type in all_types:
            size_per_type.append({
                'type': file_type.extension,
                'total_size': file_type.total_size
            })

    return json.dumps(size_per_type)


def create_activity_timeline_data(source):

    files = File.objects.filter(source=source)

    activity_per_date = []
    today = source.date_scanned.replace(hour=0, minute=0, second=0, microsecond=0)

    for i in range(90):
        date_start = today - datetime.timedelta(days=i)
        date_end   = today - datetime.timedelta(days=i-1)

        files_created  = files.filter(
            date_created__gte=date_start,
            date_created__lt=date_end
        ).count() if source.has_access_times else None
        files_modified = files.filter(
            date_modified__gte=date_start,
            date_modified__lt=date_end
        ).count()
        files_accessed = files.filter(
            date_accessed__gte=date_start,
            date_accessed__lt=date_end
        ).count() if source.has_access_times else None
        
        activity_per_date.append({
            'date': date_start.timestamp(),
            'created': files_created,
            'modified': files_modified,
            'accessed': files_accessed
        })
    
    activity_per_date.reverse()

    return json.dumps(activity_per_date)