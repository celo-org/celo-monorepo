FROM node:12

WORKDIR /celo-phone-number-privacy/

#Copy monorepo yarn.lock
COPY yarn.lock ./

#Copy identity code
COPY packages/phone-number-privacy/ phone-number-privacy/

RUN yarn install --network-timeout 100000 && yarn cache clean

ENV NODE_ENV production

RUN yarn build

EXPOSE 8080
ENTRYPOINT ["yarn", "start:docker"]
