FROM node:10-alpine

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
