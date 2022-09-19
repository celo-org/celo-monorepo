FROM node:18
WORKDIR /celo-monorepo

# Needed for gsutil
RUN apt-get update && \
  apt-get install -y lsb-release && \
  export CLOUD_SDK_REPO="cloud-sdk-$(lsb_release -c -s)" && \
  echo "deb http://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
  curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
  apt-get update -y && \
  apt-get install -y google-cloud-sdk kubectl netcat && \
  curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash && \
  rm -rf /var/lib/apt/lists/*

# ensure yarn.lock is evaluated by kaniko cache diff
COPY lerna.json package.json yarn.lock ./
COPY packages/celotool/package.json packages/celotool/
COPY packages/dev-utils/package.json packages/dev-utils/
COPY packages/env-tests/package.json packages/env-tests/package.json
COPY packages/flake-tracker/package.json packages/flake-tracker/package.json
COPY packages/phone-number-privacy/common/package.json packages/phone-number-privacy/common/package.json
COPY packages/protocol/package.json packages/protocol/
COPY packages/sdk/base/package.json packages/sdk/base/
COPY packages/sdk/connect/package.json packages/sdk/connect/
COPY packages/sdk/contractkit/package.json packages/sdk/contractkit/
COPY packages/sdk/cryptographic-utils/package.json packages/sdk/cryptographic-utils/
COPY packages/sdk/explorer/package.json packages/sdk/explorer/
COPY packages/sdk/governance/package.json packages/sdk/governance/
COPY packages/sdk/identity/package.json packages/sdk/identity/
COPY packages/sdk/network-utils/package.json packages/sdk/network-utils/
COPY packages/sdk/utils/package.json packages/sdk/utils/
COPY packages/sdk/wallets/wallet-base/package.json packages/sdk/wallets/wallet-base/
COPY packages/sdk/wallets/wallet-local/package.json packages/sdk/wallets/wallet-local/
COPY packages/typescript/package.json packages/typescript/
COPY patches/ patches/
COPY scripts/ scripts/
COPY packages/sdk/phone-utils/package.json packages/sdk/phone-utils/package.json

RUN yarn install --network-timeout 100000 --frozen-lockfile && yarn cache clean

COPY packages/celotool packages/celotool/
COPY packages/dev-utils packages/dev-utils/
COPY packages/env-tests packages/env-tests
COPY packages/flake-tracker packages/flake-tracker
COPY packages/helm-charts packages/helm-charts
COPY packages/phone-number-privacy/common packages/phone-number-privacy/common
COPY packages/protocol packages/protocol/
COPY packages/sdk/base packages/sdk/base/
COPY packages/sdk/connect packages/sdk/connect/
COPY packages/sdk/contractkit packages/sdk/contractkit/
COPY packages/sdk/cryptographic-utils packages/sdk/cryptographic-utils/
COPY packages/sdk/explorer packages/sdk/explorer/
COPY packages/sdk/governance packages/sdk/governance/
COPY packages/sdk/identity packages/sdk/identity/
COPY packages/sdk/network-utils packages/sdk/network-utils/
COPY packages/sdk/utils packages/sdk/utils/
COPY packages/sdk/wallets/wallet-base packages/sdk/wallets/wallet-base/
COPY packages/sdk/wallets/wallet-local packages/sdk/wallets/wallet-local/
COPY packages/typescript packages/typescript/
COPY packages/sdk/phone-utils packages/sdk/phone-utils/

RUN yarn build

ENV PATH="/celo-monorepo/packages/celotool/bin:${PATH}"

COPY --from=golang:1.16-stretch /usr/local/go/ /usr/local/go/

ENV PATH="/usr/local/go/bin:${PATH}"

CMD ["celotooljs.sh"]

