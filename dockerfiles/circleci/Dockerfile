FROM cimg/node:12.13
LABEL org.opencontainers.image.authors="devops@clabs.co"

RUN sudo apt-get update -y && \
    sudo apt-get install -y lsb-release libudev-dev libusb-dev libusb-1.0-0

# Install Kubernetes, as per https://kubernetes.io/docs/tasks/tools/install-kubectl/
RUN sudo apt-get install -y apt-transport-https && \
  curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add - && \
  echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee -a /etc/apt/sources.list.d/kubernetes.list && \
  sudo apt-get update  && \
  sudo apt-get install -y kubectl

RUN sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 467B942D3A79BD29 && \
    sudo apt-get update && \
    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg && \
    echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] http://packages.cloud.google.com/apt cloud-sdk main" | \
    sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | \
    sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - && \
    sudo apt-get update -y && \
    sudo apt-get install google-cloud-cli -y

RUN sudo wget https://dl.google.com/go/go1.16.15.linux-amd64.tar.gz && \
  sudo tar xf go1.16.15.linux-amd64.tar.gz -C /usr/local && \
  sudo rm go1.16.15.linux-amd64.tar.gz

RUN curl https://sh.rustup.rs -sSf | sh -s -- -y

ENV PATH="/usr/local/go/bin:/home/circleci/.cargo/bin:${PATH}"

RUN go version

RUN rustup install 1.41.0 && \
  rustup default 1.41.0

RUN sudo apt-get clean -y && \
  sudo rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN mkdir ~/.ssh/ && echo -e "Host github.com\n\tStrictHostKeyChecking no\n" > ~/.ssh/config

CMD ["/bin/sh"]
