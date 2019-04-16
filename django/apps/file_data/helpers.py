import datetime
import json

from django.db.models import Sum

from apps.file_data.models import File, Folder, FileType, ImportedDirectory

class EchoBuffer:
    def write(self, value):
        return value


def filter_files(file_query, filters):

    dirs = filters.getlist('sources[]')
    if len(dirs): file_query = file_query.filter(directory__id__in=dirs)
    print(dirs);

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


def create_size_timeline_data(directory):
    try:
        earliest_file = File.objects.filter(directory=directory).earliest('date_created')
    except File.DoesNotExist:
        return '[]'
    
    time_period = (directory.date_scanned - earliest_file.date_created) / 50

    current_date = earliest_file.date_created
    current_size = File.objects.filter(
        directory=directory,
        date_created__gte=current_date,
        date_created__lte=current_date + time_period
    ).aggregate(Sum('size'))['size__sum'] or 0

    files_per_period = [
        {
            'date': current_date.timestamp(),
            'total_size': current_size
        }
    ]

    while current_date + time_period < directory.date_scanned:
        current_date += time_period
        current_size += File.objects.filter(
            directory=directory,
            date_created__gt=current_date,
            date_created__lte=current_date + time_period
        ).aggregate(Sum('size'))['size__sum'] or 0
        files_per_period.append({
            'date': current_date.timestamp(),
            'total_size': current_size
        })

    return json.dumps(files_per_period)


def create_type_chart_data(directory):
    all_types = FileType.objects.filter(directory=directory).order_by('-total_size')
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
    