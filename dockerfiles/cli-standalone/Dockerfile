FROM node:10-alpine

RUN apk update && apk add python git make gcc g++ bash

RUN adduser -D -S celo

USER celo

RUN mkdir /home/celo/.npm-global
ENV PATH=/home/celo/.npm-global/bin:$PATH
ENV NPM_CONFIG_PREFIX=/home/celo/.npm-global

WORKDIR /home/celo/

RUN npm install -g @celo/celocli@0.0.30-beta2
