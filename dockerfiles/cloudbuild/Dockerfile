FROM node:10

RUN apt-get update -y
RUN apt-get install lsb-release libudev-dev libusb-dev -y --no-install-recommends apt-utils
RUN npm install -g yarn

# Install Kubernetes, as per https://kubernetes.io/docs/tasks/tools/install-kubectl/
RUN apt-get install -y apt-transport-https && \
    curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
    echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" | tee -a /etc/apt/sources.list.d/kubernetes.list && \
    apt-get update  && \
    apt-get install -y kubectl

RUN export CLOUD_SDK_REPO="cloud-sdk-$(lsb_release -c -s)" && \
    echo "deb http://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
    apt-get update -y && apt-get install google-cloud-sdk -y

CMD ["/bin/sh"]
