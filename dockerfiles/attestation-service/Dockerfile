FROM node:10
WORKDIR /celo-monorepo

# ensure yarn.lock is evaluated by kaniko cache diff
COPY lerna.json package.json yarn.lock ./
COPY scripts/ scripts/
COPY patches/ patches/

# Copy only pkg.json
COPY packages/sdk/base/package.json packages/sdk/base/
COPY packages/sdk/utils/package.json packages/sdk/utils/
COPY packages/typescript/package.json packages/typescript/
COPY packages/dev-utils/package.json packages/dev-utils/
COPY packages/sdk/connect/package.json packages/sdk/connect/
COPY packages/protocol/package.json packages/protocol/
COPY packages/sdk/contractkit/package.json packages/sdk/contractkit/
COPY packages/attestation-service/package.json packages/attestation-service/
COPY packages/flake-tracker/package.json packages/flake-tracker/package.json

RUN yarn install --frozen-lockfile --network-timeout 100000 && yarn cache clean

# Copy the rest
COPY packages/sdk/base packages/sdk/base/
COPY packages/sdk/utils packages/sdk/utils/
COPY packages/typescript packages/typescript/
COPY packages/dev-utils packages/dev-utils/
COPY packages/sdk/connect packages/sdk/connect/
COPY packages/protocol packages/protocol/
COPY packages/sdk/contractkit packages/sdk/contractkit/
COPY packages/attestation-service packages/attestation-service/
COPY packages/flake-tracker packages/flake-tracker

ENV NODE_ENV production

# build all
RUN yarn build

WORKDIR /celo-monorepo/packages/attestation-service
ENTRYPOINT ["node", "lib/index.js"]
