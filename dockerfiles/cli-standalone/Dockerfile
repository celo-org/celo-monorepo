# Docker image containing the celocli, built from NPM.
#
# Example build command:
#
#   VERSION=x.y.z; docker build . --build-arg VERSION=$VERSION -t gcr.io/celo-testnet/celocli-standalone:$VERSION
FROM node:10-alpine

# Install cli install dependencies.
RUN apk add --no-cache python git make gcc g++ bash libusb-dev linux-headers eudev-dev

# Add an set as default a non-privileged user named celo.
RUN adduser -D -S celo
USER celo

# Make folders for npm packages.
RUN mkdir /home/celo/.npm-global
ENV PATH=/home/celo/.npm-global/bin:$PATH
ENV NPM_CONFIG_PREFIX=/home/celo/.npm-global

WORKDIR /home/celo/

# Install @celo/celocli from NPM.
ARG VERSION
RUN npm install -g @celo/celocli@$VERSION
