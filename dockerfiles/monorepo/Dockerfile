FROM node:8

RUN apt-get update
RUN apt-get install lsb-release -y

# Needed for gsutil
RUN export CLOUD_SDK_REPO="cloud-sdk-$(lsb_release -c -s)" && \
    echo "deb http://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
    apt-get update -y && apt-get install google-cloud-sdk -y

# ensure yarn.lock is evaluated by kaniko cache diff
COPY . /celo-monorepo
WORKDIR /celo-monorepo
RUN yarn install

CMD ["/bin/sh"]
