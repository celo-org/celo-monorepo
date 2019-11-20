FROM node:10-alpine

RUN apk update && apk add python git make gcc g++

WORKDIR /celo/

RUN npm install @celo/celocli@0.0.29
