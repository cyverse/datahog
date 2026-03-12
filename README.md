DataHog
=======

DataHog is a web application for analyzing how your storage space is being used. It builds a database of files stored in iRODS collections (such as the CyVerse Data Store), Amazon S3 buckets, or directories on your device, and allows you to search, sort, and compare them. It provides information about file sizes, types, and duplicated files.

<a href="https://de.cyverse.org/apps/de/d0f77e8c-392b-11e9-95ec-008cfa5ae621/launch?saved-launch-id=d34723d6-f7cc-4fe4-b39b-8b0986e43479" target="_blank" rel="noopener noreferrer"><img src="https://de.cyverse.org/Powered-By-CyVerse-blue.svg"></a>

## Architecture

**Backend:** Django 4.2 + Django REST Framework + Celery + RabbitMQ + SQLite
**Frontend:** React 18 + React Router + D3 + Parcel 2
**Process management:** Supervisord runs Django dev server, RabbitMQ, and Celery worker

The frontend is a single-page React app served by Django's template system. Parcel builds React into `django/static/js/`. The backend exposes REST APIs under `/api/filedata/`, `/api/import/`, and `/api/browse/`. Long-running imports run as Celery async tasks; the frontend polls `/api/import/task` every 2 seconds for progress.

### Container Details

| Property | Value |
|----------|-------|
| Working directory | `/dashboard` |
| Container user | `root` (UID 0) |
| Exposed port | `8000` |
| Registry | `harbor.cyverse.org/vice/datahog:latest` |

## Running DataHog

### Option 1: CyVerse Discovery Environment (VICE)

DataHog is available as a VICE app on the [CyVerse Discovery Environment](https://de.cyverse.org). Click "Launch Analysis" to start an instance.

When launched in the DE, DataHog auto-authenticates using your existing KeyCloak session — no manual login required. The app detects the VICE environment via the `IPLANT_USER` environment variable and obtains a Terrain API token through your browser's KeyCloak session.

**Auto-authentication flow:**

1. Django checks for `IPLANT_USER` and `IPLANT_TOKEN` environment variables
2. If no token in env, the React frontend fetches one from `/terrain/token/keycloak` using the browser's existing KeyCloak cookies (same-origin when accessed through `de.cyverse.org/dl/...`)
3. The token is sent to the Django backend and stored in the session
4. If auto-login fails, the manual login form is shown as a fallback

### Option 2: Docker

```bash
# Pull from Harbor
docker pull harbor.cyverse.org/vice/datahog:latest
docker run -it -p 8000:8000 harbor.cyverse.org/vice/datahog:latest

# Or build locally
docker build -t datahog .
docker run -it -p 8000:8000 datahog
```

Open `http://localhost:8000` in your browser. You will be prompted to enter your CyVerse username and password.

### Option 3: Local Development

**Prerequisites:** Python 3.12, Node.js 20+, RabbitMQ

**Backend:**
```bash
cd django
pip install -r requirements.txt
python3 manage.py makemigrations file_data
python3 manage.py migrate
python3 manage.py migrate --database=file_data
python3 manage.py runserver
# In a separate terminal:
celery -A celery_app worker
```

**Frontend:**
```bash
cd react
npm install
npm run js    # Watch mode — outputs to ../django/static/js/
npm run css   # Watch mode — outputs to ../django/static/css/
npm run build # One-shot production build
```

## Building and Pushing the Docker Image

```bash
# Build
docker build -t harbor.cyverse.org/vice/datahog:latest .

# Login to Harbor (requires CyVerse Harbor credentials)
docker login harbor.cyverse.org

# Push
docker push harbor.cyverse.org/vice/datahog:latest
```

The Dockerfile uses a multi-stage build:
1. **Stage 1 (node:20-slim):** Installs npm dependencies and runs `parcel build` to compile the React frontend
2. **Stage 2 (ubuntu:24.04):** Installs Python 3, RabbitMQ, Supervisor, pip dependencies, runs Django migrations, and copies the built frontend JS

## CyVerse Discovery Environment Integration

### Registering as a VICE App

To register DataHog as a VICE app in the CyVerse DE:

1. **Image:** `harbor.cyverse.org/vice/datahog:latest`
2. **Working directory:** `/dashboard`
3. **UID:** `0` (root)
4. **Port:** `8000`
5. **Min resources:** 2 CPU cores, 4 GB RAM (adjust based on expected data volume)

### Environment Variables

The DE injects these environment variables into VICE containers:

| Variable | Description |
|----------|-------------|
| `IPLANT_USER` | CyVerse username — triggers VICE auto-auth detection |
| `IPLANT_TOKEN` | (Optional) Pre-injected Terrain access token |
| `REDIRECT_URL` | DE callback URL (unset by the app at startup) |

### Data Store Access

DataHog browses the CyVerse Data Store via the [Terrain API](https://de.cyverse.org/terrain/docs/). All requests go through `https://de.cyverse.org/terrain/secured/filesystem/`. The app uses:

- `paged-directory` — list directory contents with sorting and pagination
- `stat` — get file/folder info
- `{id}/metadata` — fetch iRODS AVU metadata

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/browse/status` | GET | Auth status + VICE detection |
| `/api/browse/login` | POST | Manual login (username/password) |
| `/api/browse/autologin` | POST | Accept a Terrain token from the frontend |
| `/api/browse/logout` | POST | Clear session |
| `/api/browse/ls` | GET | List directory contents |
| `/api/browse/stat` | GET | File/folder info |
| `/api/browse/metadata` | GET | iRODS AVU metadata |
| `/api/browse/analyze` | POST | Start deep storage analysis |
| `/api/import/task` | GET | Poll async task progress |
| `/api/filedata/files` | GET | Query imported file data |
| `/api/filedata/folders` | GET | Query imported folder data |
| `/api/filedata/types` | GET | File type breakdown |
| `/api/filedata/duplicates` | GET | Find duplicate files |
| `/api/filedata/metadata/summary` | GET | Metadata attribute summary |

## Usage Guide

### Browsing

After authentication (automatic in VICE, manual otherwise), the Data Browser shows:
- **Left sidebar:** Folder tree navigator rooted at your home directory and `/iplant/home/shared`
- **Main panel:** File listing with sortable columns (name, type, size, date)
- **Detail panel:** Click any file or folder to view iRODS AVU metadata

### Analyzing

Click the **Analyze** button in the toolbar to run a deep storage analysis on the current directory. This:
1. Crawls the directory tree via the Terrain API
2. Builds a local SQLite database of all files
3. Shows file type breakdown, largest files/folders, duplicates, and metadata summary

### Import Sources

DataHog also supports importing file data from:
- **iRODS** — direct iRODS protocol connection
- **CyVerse** — Terrain API crawl (used by Analyze)
- **S3 Bucket** — AWS S3 via access keys
- **.datahog file** — pre-crawled data from the [crawler script](django/static/scripts/datahog_crawler.py)
- **Database restore** — restore a previously backed-up DataHog database

### Crawler Script

The [DataHog Crawler Script](django/static/scripts/datahog_crawler.py) scans a local directory and generates a `.datahog` file for import:

```bash
python3 datahog_crawler.py <root path> [options]
```

Options:
- `-n` / `--no-checksums` — skip MD5 checksum calculation (faster for large directories)
- `-o` / `--output` — custom output filename
