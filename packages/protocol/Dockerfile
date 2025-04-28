FROM node:18-bookworm

# set path including foundry
ENV PATH="${PATH}:/root/.foundry/bin"

# install foundry
RUN curl -L https://foundry.paradigm.xyz | bash && foundryup

# select /app as main directory
WORKDIR /app

# install dependencies
COPY package.json package.json
RUN yarn install

# change default entrypoint
ENTRYPOINT ["/bin/sh", "-c"]
