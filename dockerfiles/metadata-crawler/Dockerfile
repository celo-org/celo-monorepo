FROM node:18
LABEL org.opencontainers.image.authors="devops@clabs.co"

WORKDIR /celo-monorepo

# Monorepo dependencies
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y lsb-release && \
    apt-get install -y curl build-essential git python3 && \
    alias python=python3 && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g typescript npm

COPY lerna.json package.json yarn.lock ./
COPY scripts scripts/
COPY packages/metadata-crawler packages/metadata-crawler/

RUN yarn install --network-timeout 100000 --frozen-lockfile && \
    yarn cache clean && \
    yarn build

WORKDIR /celo-monorepo/packages/metadata-crawler
CMD ["node", "lib/crawler.js"]
