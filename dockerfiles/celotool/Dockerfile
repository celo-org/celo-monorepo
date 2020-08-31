FROM node:10
WORKDIR /celo-monorepo

# Needed for gsutil
RUN apt-get update && \
  apt-get install -y lsb-release && \
  export CLOUD_SDK_REPO="cloud-sdk-$(lsb_release -c -s)" && \
  echo "deb http://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
  curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
  apt-get update -y && \
  apt-get install -y google-cloud-sdk && \
  apt-get install -y libusb-dev libudev-dev && \
  rm -rf /var/lib/apt/lists/*


# ensure yarn.lock is evaluated by kaniko cache diff
COPY lerna.json package.json yarn.lock ./
COPY scripts/ scripts/
COPY patches/ patches/
COPY packages/base/package.json packages/base/
COPY packages/utils/package.json packages/utils/
COPY packages/dev-utils/package.json packages/dev-utils/
COPY packages/typescript/package.json packages/typescript/
COPY packages/contractkit/package.json packages/contractkit/
COPY packages/protocol/package.json packages/protocol/
COPY packages/celotool/package.json packages/celotool/
COPY packages/flake-tracker/package.json packages/flake-tracker/package.json

RUN yarn install --network-timeout 100000 --frozen-lockfile && yarn cache clean

COPY packages/base packages/base/
COPY packages/utils packages/utils/
COPY packages/dev-utils packages/dev-utils/
COPY packages/typescript packages/typescript/
COPY packages/contractkit packages/contractkit/
COPY packages/protocol packages/protocol/
COPY packages/celotool packages/celotool/
COPY packages/flake-tracker packages/flake-tracker

RUN yarn build

ENV PATH="/celo-monorepo/packages/celotool/bin:${PATH}"

CMD ["celotooljs.sh"]
