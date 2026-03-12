# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is DataHog

DataHog is a web application for analyzing storage space usage. It builds a database of files from iRODS collections, CyVerse Data Store, Amazon S3 buckets, or local directories, then lets users search, sort, compare, and find duplicate files. It runs as a Docker container in CyVerse VICE.

## Architecture

**Backend:** Django 4.2 + Django REST Framework + Celery + RabbitMQ + SQLite
**Frontend:** React 18 + React Router + D3 + Parcel bundler
**Process management:** Supervisord runs Django dev server, RabbitMQ, and Celery worker

The frontend is a single-page React app served by Django's template system. Parcel builds React into `django/static/js/`. The backend exposes REST APIs under `/api/filedata/` and `/api/import/`. Long-running imports run as Celery async tasks; the frontend polls `/api/import/task` every 2 seconds for progress.

### Two SQLite Databases

- `main.sqlite3` — Django auth, sessions, AsyncTask, ImportAttempt models
- `file_data.sqlite3` — File, Folder, FileType, ImportedDirectory models (routed via `FileDataRouter` in `django/apps/file_data/routers.py`)

### Key Django Apps

- `apps/file_data/` — Models for files/folders, REST views for querying, filtering, duplicate detection, CSV export
- `apps/importer/` — Import sources (iRODS, CyVerse Terrain API, S3, .datahog files), Celery tasks, database backup/restore

### React Component Tree

```
main.jsx → TaskWrapper → ContextWrapper → TabNav
  ├── /summary   → SummaryTab (charts via D3)
  ├── /browse    → BrowseTab (FileTree + SearchForm)
  ├── /duplicates → DuplicatesTab (by checksum/size/name)
  └── /sources   → SourceTab (ImportForm + SourceMenu)
```

State is managed via React Context: TaskContext (async task status), ImportContext (last import config), SourceContext (selected sources filter).

## Build & Run Commands

### Docker
```bash
docker build -t datahog .
docker run -it -p 8000:8000 datahog
```

### Local Development

**Backend** (requires Python 3.12, RabbitMQ):
```bash
cd django
pip install -r requirements.txt
python manage.py migrate
python manage.py migrate --database=file_data
python manage.py runserver
# In separate terminal:
celery -A celery_app worker
```

**Frontend** (requires Node.js 20+):
```bash
cd react
npm install
npm run js    # Watch mode, outputs to ../django/static/js/
npm run css   # Watch mode, outputs to ../django/static/css/
npm run build # Production build
```

### Ports
- `8000` — Django dev server (the only exposed port)

## API Structure

- `/api/import/context` — GET import history and source list
- `/api/import/task` — GET/PATCH async task status
- `/api/import/irodslogin`, `cyverselogin`, `awslogin`, `loadfile` — POST to start imports
- `/api/import/deletesource` — DELETE a source
- `/api/import/dumpdata`, `loaddata` — Database backup/restore
- `/api/filedata/files`, `folders`, `types`, `top`, `children/<id>` — Query file data
- `/api/filedata/duplicates` — Find duplicates (checksum, size, or name)
- `/api/filedata/sources` — List imported directories
- `/api/filedata/searchcsv`, `backup` — Export data

## Key Files

| File | Purpose |
|------|---------|
| `django/settings.py` | Django config, dual-database setup |
| `django/apps/importer/tasks.py` | Celery async import tasks |
| `django/apps/importer/helpers.py` | `build_file_database()` — constructs folder hierarchy from flat file list |
| `django/apps/file_data/models.py` | File, Folder, FileType, ImportedDirectory models |
| `django/apps/file_data/helpers.py` | Query filtering, chart data generation |
| `react/js/context.jsx` | React contexts (TaskContext, ImportContext, SourceContext) |
| `react/js/taskWrapper.jsx` | Task polling and loading state |
| `supervisord.conf` | Process management for Docker |
| `scripts/datahog_crawler.py` | Standalone crawler for generating .datahog files |
