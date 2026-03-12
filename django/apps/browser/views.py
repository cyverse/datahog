import json
import os
import requests
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from apps.importer.models import ImportAttempt, AsyncTask
from apps.importer.tasks import import_files_from_cyverse

TERRAIN_BASE = 'https://de.cyverse.org'


class BrowseStatus(View):
    """Return current authentication status."""

    def get(self, request):
        username = request.session.get('browse_username')
        return JsonResponse({
            'authenticated': bool(request.session.get('browse_token')),
            'username': username or '',
            'home_path': f'/iplant/home/{username}' if username else '',
        })


@method_decorator(csrf_exempt, name='dispatch')
class BrowseLogin(View):
    """Authenticate with CyVerse and store token in session."""

    def post(self, request):
        try:
            body = json.loads(request.body)
        except (json.JSONDecodeError, ValueError):
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        username = body.get('username', '').strip()
        password = body.get('password', '').strip()
        if not username or not password:
            return JsonResponse({'error': 'Username and password required'}, status=400)

        try:
            resp = requests.get(
                f'{TERRAIN_BASE}/terrain/token',
                auth=(username, password),
                timeout=15,
            )
        except requests.ConnectionError:
            return JsonResponse({'error': 'Cannot connect to CyVerse'}, status=502)
        except requests.Timeout:
            return JsonResponse({'error': 'CyVerse authentication timed out'}, status=504)

        if resp.status_code == 401:
            return JsonResponse({'error': 'Invalid username or password'}, status=401)
        if resp.status_code != 200:
            return JsonResponse({'error': f'Authentication failed ({resp.status_code})'}, status=502)

        try:
            token_data = resp.json()
            token = token_data.get('access_token')
            if not token:
                return JsonResponse({'error': 'Invalid credentials'}, status=401)
        except (ValueError, KeyError):
            return JsonResponse({'error': 'Invalid authentication response'}, status=502)

        request.session['browse_token'] = token
        request.session['browse_username'] = username

        return JsonResponse({
            'authenticated': True,
            'username': username,
            'home_path': f'/iplant/home/{username}',
        })


@method_decorator(csrf_exempt, name='dispatch')
class BrowseLogout(View):
    """Clear stored credentials."""

    def post(self, request):
        request.session.pop('browse_token', None)
        request.session.pop('browse_username', None)
        return JsonResponse({'authenticated': False})


class BrowseList(View):
    """List contents of a Data Store directory."""

    def get(self, request):
        token = request.session.get('browse_token')
        if not token:
            return JsonResponse({'error': 'Not authenticated'}, status=401)

        path = request.GET.get('path', '')
        if not path:
            return JsonResponse({'error': 'path parameter required'}, status=400)

        limit = int(request.GET.get('limit', '1000'))
        offset = int(request.GET.get('offset', '0'))
        sort_col = request.GET.get('sort_col', 'NAME')
        sort_dir = request.GET.get('sort_dir', 'ASC')

        try:
            resp = requests.get(
                f'{TERRAIN_BASE}/terrain/secured/filesystem/paged-directory',
                params={
                    'path': path,
                    'limit': limit,
                    'offset': offset,
                    'sort-col': sort_col,
                    'sort-dir': sort_dir,
                },
                headers={'Authorization': f'Bearer {token}'},
                timeout=30,
            )
        except requests.ConnectionError:
            return JsonResponse({'error': 'Cannot connect to CyVerse'}, status=502)
        except requests.Timeout:
            return JsonResponse({'error': 'Request timed out'}, status=504)

        if resp.status_code == 401:
            request.session.pop('browse_token', None)
            return JsonResponse({'error': 'Session expired, please log in again'}, status=401)
        if resp.status_code == 404:
            return JsonResponse({'error': f'Path not found: {path}'}, status=404)
        if resp.status_code != 200:
            return JsonResponse({'error': f'Data Store error ({resp.status_code})'}, status=502)

        try:
            data = resp.json()
        except ValueError:
            return JsonResponse({'error': 'Invalid response from Data Store'}, status=502)

        folders = []
        for f in data.get('folders', []):
            folders.append({
                'name': f.get('label', ''),
                'path': f.get('path', ''),
                'type': 'folder',
                'date_modified': f.get('date-modified', 0),
                'date_created': f.get('date-created', 0),
                'permission': f.get('permission', ''),
            })

        files = []
        for f in data.get('files', []):
            files.append({
                'name': f.get('label', ''),
                'path': f.get('path', ''),
                'type': 'file',
                'size': f.get('file-size', 0),
                'date_modified': f.get('date-modified', 0),
                'date_created': f.get('date-created', 0),
                'permission': f.get('permission', ''),
            })

        return JsonResponse({
            'path': path,
            'folders': folders,
            'files': files,
            'total': data.get('total', len(folders) + len(files)),
            'total_filtered': data.get('totalFiltered', len(folders) + len(files)),
        })


class BrowseStat(View):
    """Get info about a specific file or folder."""

    def get(self, request):
        token = request.session.get('browse_token')
        if not token:
            return JsonResponse({'error': 'Not authenticated'}, status=401)

        path = request.GET.get('path', '')
        if not path:
            return JsonResponse({'error': 'path parameter required'}, status=400)

        try:
            resp = requests.post(
                f'{TERRAIN_BASE}/terrain/secured/filesystem/stat',
                json={'paths': [path]},
                headers={'Authorization': f'Bearer {token}'},
                timeout=15,
            )
        except (requests.ConnectionError, requests.Timeout):
            return JsonResponse({'error': 'Cannot connect to CyVerse'}, status=502)

        if resp.status_code != 200:
            return JsonResponse({'error': f'Stat failed ({resp.status_code})'}, status=502)

        try:
            data = resp.json()
            paths_data = data.get('paths', {})
            info = paths_data.get(path, {})
        except (ValueError, KeyError):
            return JsonResponse({'error': 'Invalid response'}, status=502)

        return JsonResponse({
            'path': path,
            'type': info.get('type', 'unknown'),
            'label': info.get('label', ''),
            'size': info.get('file-size', 0),
            'date_modified': info.get('date-modified', 0),
            'date_created': info.get('date-created', 0),
            'permission': info.get('permission', ''),
            'share_count': info.get('share-count', 0),
        })


class BrowseMetadata(View):
    """Fetch iRODS AVU metadata for a file or folder from CyVerse Terrain API."""

    def get(self, request):
        token = request.session.get('browse_token')
        if not token:
            return JsonResponse({'error': 'Not authenticated'}, status=401)

        path = request.GET.get('path', '')
        if not path:
            return JsonResponse({'error': 'path parameter required'}, status=400)

        headers = {'Authorization': f'Bearer {token}'}

        # Step 1: Get the data ID via stat
        try:
            stat_resp = requests.post(
                f'{TERRAIN_BASE}/terrain/secured/filesystem/stat',
                json={'paths': [path]},
                headers=headers,
                timeout=15,
            )
        except (requests.ConnectionError, requests.Timeout):
            return JsonResponse({'error': 'Cannot connect to CyVerse'}, status=502)

        if stat_resp.status_code == 401:
            request.session.pop('browse_token', None)
            return JsonResponse({'error': 'Session expired'}, status=401)
        if stat_resp.status_code != 200:
            return JsonResponse({'error': f'Stat failed ({stat_resp.status_code})'}, status=502)

        try:
            stat_data = stat_resp.json()
            paths_data = stat_data.get('paths', {})
            info = paths_data.get(path, {})
            data_id = info.get('id', '')
        except (ValueError, KeyError):
            return JsonResponse({'error': 'Invalid stat response'}, status=502)

        if not data_id:
            return JsonResponse({'path': path, 'avus': []})

        # Step 2: Fetch metadata by data ID
        try:
            meta_resp = requests.get(
                f'{TERRAIN_BASE}/terrain/secured/filesystem/{data_id}/metadata',
                headers=headers,
                timeout=15,
            )
        except (requests.ConnectionError, requests.Timeout):
            return JsonResponse({'error': 'Cannot connect to CyVerse'}, status=502)

        if meta_resp.status_code != 200:
            return JsonResponse({'path': path, 'avus': []})

        try:
            data = meta_resp.json()
        except ValueError:
            return JsonResponse({'error': 'Invalid response'}, status=502)

        # Terrain returns both "irods-avus" (raw iRODS) and "avus" (DE metadata)
        avus = []

        # Parse irods-avus (simple flat AVUs)
        for avu in data.get('irods-avus', []):
            avus.append({
                'attribute': avu.get('attr', ''),
                'value': avu.get('value', ''),
                'unit': avu.get('unit', ''),
            })

        # Parse DE avus (richer format, may have nested sub-AVUs)
        def flatten_de_avus(avu_list, prefix=''):
            for avu in avu_list:
                attr = avu.get('attr', '')
                if prefix:
                    attr = '{} > {}'.format(prefix, attr)
                avus.append({
                    'attribute': attr,
                    'value': avu.get('value', ''),
                    'unit': avu.get('unit', ''),
                })
                # Recurse into nested AVUs
                sub_avus = avu.get('avus', [])
                if sub_avus:
                    flatten_de_avus(sub_avus, attr)

        flatten_de_avus(data.get('avus', []))

        return JsonResponse({
            'path': path,
            'avus': avus,
        })


@method_decorator(csrf_exempt, name='dispatch')
class BrowseAnalyze(View):
    """Start a CyVerse import of the selected path for analysis."""

    def post(self, request):
        token = request.session.get('browse_token')
        username = request.session.get('browse_username')
        if not token:
            return JsonResponse({'error': 'Not authenticated'}, status=401)

        try:
            body = json.loads(request.body)
        except (json.JSONDecodeError, ValueError):
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        path = body.get('path', '').strip()
        if not path:
            return JsonResponse({'error': 'path is required'}, status=400)

        name = body.get('name', '') or path.rstrip('/').split('/')[-1]
        # Truncate name to fit model field
        name = name[:32]

        attempt = ImportAttempt.objects.create(
            cyverse_user=username,
            cyverse_root=path,
            cyverse_name=name,
        )

        task = AsyncTask.objects.create(
            in_progress=True,
            status_message='Starting analysis...',
            import_attempt=attempt,
        )

        import_files_from_cyverse.delay(task.id, f'Bearer {token}')

        return JsonResponse({
            'task_id': task.id,
            'status': 'started',
            'path': path,
            'name': name,
        })
