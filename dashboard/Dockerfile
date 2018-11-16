FROM ubuntu:latest

COPY . /dashboard
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
WORKDIR /dashboard

RUN apt-get update
RUN apt-get install -y python3 python3-pip rabbitmq-server supervisor
RUN pip3 install -r requirements.txt

EXPOSE 8000

CMD supervisord