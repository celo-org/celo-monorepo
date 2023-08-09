FROM node:18
LABEL org.opencontainers.image.authors="devops@clabs.co"

WORKDIR /celo-monorepo

# Needed for gsutil
RUN apt-get update && \
    apt-get install -y lsb-release && \
    apt-get install -y curl build-essential git python3 && \
    export CLOUD_SDK_REPO="cloud-sdk-$(lsb_release -c -s)" && \
    echo "deb http://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
    apt-get update -y && \
    apt-get install -y google-cloud-sdk kubectl netcat-openbsd && \
    curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash && \
    rm -rf /var/lib/apt/lists/*

# ensure yarn.lock is evaluated by kaniko cache diff
COPY . ./

RUN yarn install --network-timeout 100000 --frozen-lockfile && yarn cache clean
RUN yarn build

RUN rm -rf .git
RUN rm -rf .gitmodules

