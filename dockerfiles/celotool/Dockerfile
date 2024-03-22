FROM node:18
LABEL org.opencontainers.image.authors="devops@clabs.co"

WORKDIR /celo-monorepo

# Needed for gsutil
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y lsb-release && \
    apt-get install -y curl build-essential git python3 && \
    export CLOUD_SDK_REPO="cloud-sdk-$(lsb_release -c -s)" && \
    echo "deb http://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
    apt-get update -y && \
    apt-get install -y google-cloud-sdk kubectl netcat-openbsd && \
    curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash && \
    rm -rf /var/lib/apt/lists/*

RUN alias python=python3

# ensure yarn.lock is evaluated by kaniko cache diff
COPY lerna.json package.json yarn.lock ./
COPY packages/celotool/package.json packages/celotool/
COPY packages/env-tests/package.json packages/env-tests/package.json
COPY packages/protocol/package.json packages/protocol/
COPY scripts/ scripts/
# Makes build fail if it doesn't copy git, will be removed after build
COPY .git .git
COPY .gitmodules .gitmodules

RUN yarn install --network-timeout 100000 --frozen-lockfile && yarn cache clean

COPY packages/celotool packages/celotool/
COPY packages/env-tests packages/env-tests
COPY packages/helm-charts packages/helm-charts
COPY packages/protocol packages/protocol/

RUN yarn build

RUN rm -r .git
RUN rm .gitmodules

ENV PATH="/celo-monorepo/packages/celotool/bin:${PATH}"

COPY --from=golang:1.18-stretch /usr/local/go/ /usr/local/go/

ENV PATH="/usr/local/go/bin:${PATH}"

CMD ["celotooljs.sh"]
