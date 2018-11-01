FROM node:8.12

RUN mkdir /node

WORKDIR /node

COPY . /node/

RUN npm install