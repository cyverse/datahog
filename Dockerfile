FROM ubuntu:latest

COPY django /dashboard
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
WORKDIR /dashboard

RUN apt-get update
RUN apt-get install -y python3 python3-pip rabbitmq-server supervisor
RUN pip3 install -r requirements.txt
RUN python3 manage.py migrate
RUN python3 manage.py migrate --database=file_data

EXPOSE 8000

CMD supervisord