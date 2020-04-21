FROM node:10
WORKDIR /celo-monorepo

RUN apt-get update -y
RUN apt-get install lsb-release libudev-dev libusb-dev libusb-1.0-0 -y

# ensure yarn.lock is evaluated by kaniko cache diff
COPY lerna.json package.json yarn.lock ./
COPY scripts/ scripts/

# Copy only pkg.json
COPY packages/typescript/package.json packages/typescript/
COPY packages/utils/package.json packages/utils/
COPY packages/protocol/package.json packages/protocol/
COPY packages/contractkit/package.json packages/contractkit/
COPY packages/dev-utils/package.json packages/dev-utils/
COPY packages/transaction-metrics-exporter/package.json packages/transaction-metrics-exporter/

RUN yarn install --network-timeout 100000 --frozen-lockfile && yarn cache clean

# Copy the rest
COPY packages/typescript packages/typescript/
COPY packages/utils packages/utils/
COPY packages/protocol/ packages/protocol/
COPY packages/contractkit packages/contractkit/
COPY packages/dev-utils packages/dev-utils/
COPY packages/transaction-metrics-exporter packages/transaction-metrics-exporter/

# build all
RUN yarn build

WORKDIR /celo-monorepo/packages/transaction-metrics-exporter
CMD ["node", "lib/index.js"]
