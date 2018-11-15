FROM python:3.6

COPY . /dashboard
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
WORKDIR /dashboard

RUN apt-get update
RUN apt install -y rabbitmq-server supervisor
RUN pip install -r requirements.txt

