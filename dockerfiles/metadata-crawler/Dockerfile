FROM node:18
WORKDIR /celo-monorepo

RUN apt-get update && \
  apt-get update -y && \
  apt-get install -y libusb-dev lsb-release libudev-dev libusb-1.0-0 && \
  rm -rf /var/lib/apt/lists/*

# ensure yarn.lock is evaluated by kaniko cache diff
COPY lerna.json package.json yarn.lock ./
COPY scripts/ scripts/
COPY patches/ patches/

# Copy only pkg.json
COPY packages/typescript/package.json packages/typescript/
COPY packages/sdk/base/package.json packages/sdk/base/
COPY packages/sdk/utils/package.json packages/sdk/utils/
COPY packages/sdk/cryptographic-utils/package.json packages/sdk/cryptographic-utils/
COPY packages/sdk/phone-utils/package.json packages/sdk/phone-utils/
COPY packages/dev-utils/package.json packages/dev-utils/
COPY packages/sdk/connect/package.json packages/sdk/connect/
COPY packages/sdk/wallets/wallet-base/package.json packages/sdk/wallets/wallet-base/
COPY packages/sdk/wallets/wallet-local/package.json packages/sdk/wallets/wallet-local/
COPY packages/protocol/package.json packages/protocol/
COPY packages/sdk/contractkit/package.json packages/sdk/contractkit/
COPY packages/metadata-crawler/package.json packages/metadata-crawler/
COPY packages/flake-tracker/package.json packages/flake-tracker/package.json

RUN yarn install --frozen-lockfile --network-timeout 100000 && yarn cache clean

# Copy the rest
COPY packages/typescript packages/typescript/
COPY packages/sdk/base packages/sdk/base/
COPY packages/sdk/utils packages/sdk/utils/
COPY packages/sdk/phone-utils packages/sdk/phone-utils/
COPY packages/sdk/cryptographic-utils packages/sdk/cryptographic-utils/
COPY packages/dev-utils packages/dev-utils/
COPY packages/sdk/connect packages/sdk/connect/
COPY packages/sdk/wallets/wallet-base packages/sdk/wallets/wallet-base
COPY packages/sdk/wallets/wallet-local packages/sdk/wallets/wallet-local
COPY packages/protocol packages/protocol/
COPY packages/sdk/contractkit packages/sdk/contractkit/
COPY packages/metadata-crawler packages/metadata-crawler/
COPY packages/flake-tracker packages/flake-tracker

# build all
RUN yarn build

WORKDIR /celo-monorepo/packages/metadata-crawler

CMD ["node", "lib/crawler.js"]
