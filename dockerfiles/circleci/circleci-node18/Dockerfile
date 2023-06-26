# FROM cimg/node:18.14.2
FROM cimg/base:current

RUN sudo apt-get update -y
RUN sudo apt-get install lsb-release libudev-dev libusb-dev libusb-1.0-0 rsync -y

RUN curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash && \
    export NVM_DIR="$HOME/.nvm" && \
    . "$NVM_DIR/nvm.sh" && \
    nvm install 18.14.2 && \
    nvm use 18.14.2 && \
    nvm alias default 18.14.2 && \
    node --version && \
    npm --version && \
    sudo ln -s "$NVM_DIR/versions/node/$(nvm version)/bin/node" "/usr/local/bin/node" && \
    sudo ln -s "$NVM_DIR/versions/node/$(nvm version)/bin/npm" "/usr/local/bin/npm" && \
    nvm install 12.22.11 && \
    sudo apt-get clean -y && \
    sudo rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install Kubernetes, as per https://kubernetes.io/docs/tasks/tools/install-kubectl/
RUN sudo apt-get install -y apt-transport-https && \
    curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add - && \
    echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee -a /etc/apt/sources.list.d/kubernetes.list && \
    sudo apt-get update  && \
    sudo apt-get install -y kubectl

RUN echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
  curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - && \
  sudo apt-get update && sudo apt-get install google-cloud-cli

CMD ["/bin/sh"]
