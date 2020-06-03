FROM node:10
WORKDIR /celo-monorepo

COPY lerna.json package.json yarn*.lock ./
COPY scripts/ scripts/
COPY packages/typescript/ packages/typescript/
COPY packages/utils/ packages/utils/
COPY packages/dev-utils/ packages/dev-utils/
COPY packages/protocol/ packages/protocol/
COPY packages/contractkit/ packages/contractkit/

RUN yarn install --frozen-lockfile --prefer-offline
RUN yarn --prefer-offline build

WORKDIR /celo-monorepo/packages/contractkit

RUN yarn test:reset

EXPOSE 8545

ENTRYPOINT ["yarn", "test:livechain"]
