FROM node:12

WORKDIR /celo-phone-number-privacy/

#Copy monorepo settings
COPY lerna.json package.json yarn.lock ./
COPY scripts/ scripts/
COPY patches/ patches/

#Copy identity code
COPY packages/phone-number-privacy packages/phone-number-privacy

RUN yarn install --network-timeout 100000 && yarn cache clean

ENV NODE_ENV production

RUN yarn build

WORKDIR /celo-phone-number-privacy/packages/phone-number-privacy/signer
EXPOSE 8080
ENTRYPOINT ["yarn", "start:docker"]