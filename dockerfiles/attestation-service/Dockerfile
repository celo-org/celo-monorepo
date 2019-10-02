FROM node:8
WORKDIR /celo-monorepo

# ensure yarn.lock is evaluated by kaniko cache diff
COPY lerna.json package.json yarn.lock ./
COPY scripts/ scripts/

# Copy only pkg.json
COPY packages/typescript/package.json packages/typescript/
COPY packages/utils/package.json packages/utils/
COPY packages/protocol/package.json packages/protocol/
COPY packages/contractkit/package.json packages/contractkit/
COPY packages/attestation-service/package.json packages/attestation-service/

RUN yarn install --frozen-lockfile --network-timeout 100000 && yarn cache clean

# Copy the rest
COPY packages/typescript packages/typescript/
COPY packages/utils packages/utils/
COPY packages/protocol packages/protocol/
COPY packages/contractkit packages/contractkit/
COPY packages/attestation-service packages/attestation-service/

# build all
RUN yarn build

WORKDIR /celo-monorepo/packages/attestation-service
CMD ["node lib/index.js"]
