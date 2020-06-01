FROM node:10
WORKDIR /celo-monorepo

COPY lerna.json package*.json yarn*.lock ./
COPY scripts/ scripts/

COPY packages/typescript/ packages/typescript/
COPY packages/utils/ packages/utils/
COPY packages/dev-utils/ packages/dev-utils/
COPY packages/protocol/ packages/protocol/
COPY packages/contractkit/ packages/contractkit/

RUN yarn install --frozen-lockfile --network-timeout 100000 && yarn cache clean && yarn build

RUN cd /celo-monorepo/packages/contractkit && yarn test:reset

COPY . .

EXPOSE 8545

WORKDIR /celo-monorepo/packages/contractkit

ENTRYPOINT ["yarn", "test:livechain"]
