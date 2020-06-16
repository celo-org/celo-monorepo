FROM node:10

RUN apt-get update \
	&& apt-get install -y openssl \
	&& rm -rf /var/lib/apt/lists/* \
	&& rm -rf /var/cache/apt/*

WORKDIR /celo-phone-number-privacy/

COPY packages/phone-number-privacy/signer signer
COPY packages/phone-number-privacy/common common

WORKDIR /celo-phone-number-privacy/signer
COPY yarn.lock ./

RUN yarn install --frozen-lockfile --network-timeout 100000 && yarn cache clean

ENV NODE_ENV production

RUN yarn build

EXPOSE 8080
ENTRYPOINT ["yarn", "start:docker"]
