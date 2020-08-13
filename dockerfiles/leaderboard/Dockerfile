FROM node:10
WORKDIR /celo-monorepo

# ensure yarn.lock is evaluated by kaniko cache diff
COPY lerna.json package.json yarn.lock ./
COPY scripts/ scripts/
COPY patches/ patches/

# Copy only pkg.json
COPY packages/typescript/package.json packages/typescript/
COPY packages/base/package.json packages/base/
COPY packages/utils/package.json packages/utils/
COPY packages/dev-utils/package.json packages/dev-utils/
COPY packages/protocol/package.json packages/protocol/
COPY packages/contractkit/package.json packages/contractkit/
COPY packages/leaderboard/package.json packages/leaderboard/
COPY packages/flake-tracker/package.json packages/flake-tracker/package.json

RUN yarn install --frozen-lockfile --network-timeout 100000 && yarn cache clean

# Copy the rest
COPY packages/typescript packages/typescript/
COPY packages/base packages/base/
COPY packages/utils packages/utils/
COPY packages/dev-utils packages/dev-utils/
COPY packages/protocol packages/protocol/
COPY packages/contractkit packages/contractkit/
COPY packages/leaderboard packages/leaderboard/
COPY packages/flake-tracker packages/flake-tracker

# build all
RUN yarn build

WORKDIR /celo-monorepo/packages/leaderboard

CMD ["yarn run ts-node src/board.ts ; yarn run ts-node src/upload.ts"]
