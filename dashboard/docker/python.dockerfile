FROM python:3.6

ENV PYTHONUNBUFFERED 1

RUN mkdir /dashboard

WORKDIR /dashboard

COPY . /dashboard/

RUN pip install -r requirements.txt