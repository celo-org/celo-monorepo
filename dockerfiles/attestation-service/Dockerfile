FROM node:18-alpine
WORKDIR /celo-monorepo

RUN apk update && apk add python3 git make gcc g++ pkgconfig libusb libusb-dev linux-headers eudev-dev bash

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
COPY packages/sdk/wallets/wallet-base/package.json packages/sdk/wallets/wallet-base/
COPY packages/sdk/wallets/wallet-local/package.json packages/sdk/wallets/wallet-local/
COPY packages/protocol/package.json packages/protocol/
COPY packages/sdk/contractkit/package.json packages/sdk/contractkit/
COPY packages/sdk/keystores/package.json packages/sdk/keystores/
COPY packages/attestation-service/package.json packages/attestation-service/
COPY packages/flake-tracker/package.json packages/flake-tracker/package.json
COPY packages/sdk/identity/package.json packages/sdk/identity/
COPY packages/sdk/phone-utils/package.json packages/sdk/phone-utils/package.json
COPY packages/sdk/cryptographic-utils/package.json packages/sdk/cryptographic-utils/package.json
COPY packages/phone-number-privacy/common/package.json packages/phone-number-privacy/common/

RUN yarn install --frozen-lockfile --network-timeout 100000 && yarn cache clean

# Copy the rest
COPY packages/sdk/base packages/sdk/base/
COPY packages/sdk/utils packages/sdk/utils/
COPY packages/typescript packages/typescript/
COPY packages/dev-utils packages/dev-utils/
COPY packages/sdk/connect packages/sdk/connect/
COPY packages/sdk/wallets/wallet-base packages/sdk/wallets/wallet-base
COPY packages/sdk/wallets/wallet-local packages/sdk/wallets/wallet-local
COPY packages/protocol packages/protocol/
COPY packages/sdk/contractkit packages/sdk/contractkit/
COPY packages/sdk/keystores packages/sdk/keystores/
COPY packages/attestation-service packages/attestation-service/
COPY packages/flake-tracker packages/flake-tracker
COPY packages/sdk/identity packages/sdk/identity
COPY packages/sdk/phone-utils packages/sdk/phone-utils/
COPY packages/sdk/cryptographic-utils packages/sdk/cryptographic-utils/
COPY packages/phone-number-privacy/common packages/phone-number-privacy/common

ENV NODE_ENV production

# build all
RUN yarn build

WORKDIR /celo-monorepo/packages/attestation-service
ENTRYPOINT ["node", "lib/index.js"]
