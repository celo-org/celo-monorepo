FROM node:12 as build-step

WORKDIR /celo-phone-number-privacy/

#Copy monorepo settings
COPY lerna.json package.json yarn.lock ./
COPY scripts/ scripts/
COPY patches/ patches/

#Copy identity code
COPY packages/phone-number-privacy/ phone-number-privacy/

RUN yarn install --network-timeout 100000 && yarn cache clean

ENV NODE_ENV production

RUN yarn build

FROM node:12 as signer
COPY --from=build-step /celo-phone-number-privacy/phone-number-privacy/signer /celo-phone-number-privacy/
WORKDIR /celo-phone-number-privacy/
EXPOSE 8080
ENTRYPOINT ["yarn", "start:docker"]
