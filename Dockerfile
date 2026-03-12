# Stage 1: Build React frontend
FROM node:20-slim AS frontend-build
WORKDIR /build
COPY react/package.json react/package-lock.json* ./
RUN npm install
COPY react/ ./
RUN npm run build || true
# Parcel outputs to ../django/static/js/ which from /build is /django/static/js/
RUN ls -la /django/static/js/ 2>/dev/null || ls -la /build/dist/ 2>/dev/null || true

# Stage 2: Application
FROM ubuntu:24.04

COPY django /dashboard
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
WORKDIR /dashboard

# Try to copy built frontend from stage 1 (overwrite pre-built)
COPY --from=frontend-build /django/static/js/main.js /dashboard/static/js/main.js

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    rabbitmq-server \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m pip install --break-system-packages -r requirements.txt

RUN python3 manage.py makemigrations file_data
RUN python3 manage.py migrate
RUN python3 manage.py migrate --database=file_data

EXPOSE 8000

CMD ["bash", "-c", "unset REDIRECT_URL && supervisord"]
