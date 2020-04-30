# Docker image for this file is hosted at
# us.gcr.io/celo-testnet/celocli:master
#
# How to test changes to this file
# docker build -f dockerfiles/cli/Dockerfile -t gcr.io/celo-testnet/celocli:$USER . --build-arg celo_env=alfajores
# To run this image locally
# docker rm cli_container; docker run --name cli_container -p 127.0.0.1:8545:8545 gcr.io/celo-testnet/celocli:$USER -v /
# To run this image locally in ultralight mode
# docker rm cli_container; docker run --name cli_container -p 127.0.0.1:8545:8545 -it --entrypoint=/celo/start_geth.sh gcr.io/celo-testnet/celocli:$USER "/usr/local/bin/geth" "alfajores" "full"
# and connect to it with
# docker exec -t -i cli_container /bin/sh
#
# Run commands against it using
# docker exec -it cli_container celocli <sub-command>
# For example,
# docker exec -it cli_container celocli account:balance 0x456f41406B32c45D59E539e4BBA3D7898c3584dA
# docker exec -it cli_container celocli account:balance 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B
#
# To restart
# docker start -ai cli_container
#
# To kill
# docker kill cli_container

ARG geth_tag=master
ARG geth_project=celo-testnet

# Get geth and related files
FROM us.gcr.io/$geth_project/geth:$geth_tag as geth

ARG celo_env
RUN echo "Env is ${celo_env}" && apk add curl && mkdir /celo
ADD https://www.googleapis.com/storage/v1/b/genesis_blocks/o/${celo_env}?alt=media /celo/genesis.json
ADD https://www.googleapis.com/storage/v1/b/static_nodes/o/${celo_env}?alt=media /celo/static-nodes.json

# Build Celocli
FROM node:10-alpine as node

ARG celo_env

RUN echo "geth_tag is ${geth_tag}" && echo "Env is ${celo_env}"
# Required for celocli
RUN apk update && apk add python git make gcc g++ pkgconfig libusb libusb-dev linux-headers eudev-dev

WORKDIR /celo-monorepo/
RUN npm install @celo/celocli

# Build the combined image
FROM node:10-alpine as final_image

ARG network_name="alfajores"
ARG network_id="44786"

# Without musl-dev, geth will fail with a confusing "No such file or directory" error.
# bash is required for start_geth.sh
RUN apk update && apk add musl-dev && apk add bash

WORKDIR /celo-monorepo/

RUN echo "Dir is ${PWD}" && echo "env is ${celo_env}" && mkdir /celo
COPY packages/cli/start_geth.sh /celo/start_geth.sh
COPY --from=geth /usr/local/bin/geth /usr/local/bin/geth
COPY --from=geth /celo/genesis.json /celo
COPY --from=geth /celo/static-nodes.json /celo
COPY --from=node /celo-monorepo/node_modules /celo-monorepo/node_modules
RUN chmod ugo+x /celo/start_geth.sh && ln -s /celo-monorepo/node_modules/.bin/celocli /usr/local/bin/celocli

EXPOSE 8545 8546 30303 30303/udp
ENTRYPOINT ["/celo/start_geth.sh", "/usr/local/bin/geth", "alfajores", "full", "44786", "/root/.celo", "/celo/genesis.json", "/celo/static-nodes.json"]
