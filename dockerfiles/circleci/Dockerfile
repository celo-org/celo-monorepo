FROM circleci/node:10
MAINTAINER Connor McEwen <c@celo.org>

RUN sudo apt-get update -y
RUN sudo apt-get install lsb-release libudev-dev libusb-dev libusb-1.0-0 -y

# Install Kubernetes, as per https://kubernetes.io/docs/tasks/tools/install-kubectl/
RUN sudo apt-get install -y apt-transport-https && \
  curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add - && \
  echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee -a /etc/apt/sources.list.d/kubernetes.list && \
  sudo apt-get update  && \
  sudo apt-get install -y kubectl

RUN export CLOUD_SDK_REPO="cloud-sdk-$(lsb_release -c -s)" && \
  echo "deb http://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
  curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add - && \
  sudo apt-get update -y && sudo apt-get install google-cloud-sdk -y

RUN sudo wget https://dl.google.com/go/go1.13.5.linux-amd64.tar.gz && \
  sudo tar xf go1.13.5.linux-amd64.tar.gz -C /usr/local

RUN curl https://sh.rustup.rs -sSf | sh -s -- -y

ENV PATH="/usr/local/go/bin:/home/circleci/.cargo/bin:${PATH}"

RUN go version

RUN rustup install 1.41.0 && \
  rustup default 1.41.0

RUN mkdir ~/.ssh/ && echo -e "Host github.com\n\tStrictHostKeyChecking no\n" > ~/.ssh/config

CMD ["/bin/sh"]
