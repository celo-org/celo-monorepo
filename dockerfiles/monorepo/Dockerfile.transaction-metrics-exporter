FROM node:8

RUN apt-get update
RUN apt-get install lsb-release -y

# Needed for gsutil
RUN export CLOUD_SDK_REPO="cloud-sdk-$(lsb_release -c -s)" && \
    echo "deb http://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
    apt-get update -y && apt-get install google-cloud-sdk -y

# ensure yarn.lock is evaluated by kaniko cache diff

COPY lerna.json /celo-monorepo/lerna.json
COPY scripts /celo-monorepo/scripts
COPY package.json /celo-monorepo/package.json
COPY yarn.lock /celo-monorepo/yarn.lock
COPY .prettierrc.js /celo-monorepo/.prettierrc.js
COPY packages/utils /celo-monorepo/packages/utils
COPY packages/typescript /celo-monorepo/packages/typescript
COPY packages/contractkit /celo-monorepo/packages/contractkit
COPY packages/celotool /celo-monorepo/packages/celotool
COPY packages/transaction-metrics-exporter /celo-monorepo/packages/transaction-metrics-exporter

WORKDIR /celo-monorepo
RUN yarn install

WORKDIR /celo-monorepo/packages/transaction-metrics-exporter
ENV PATH="/celo-monorepo/packages/celotool/bin:${PATH}"

CMD ["celotooljs.sh"]