# Running a Validator in Baklava Network

- [Running a Validator in Baklava Network](#running-a-validator-in-baklava-network)
  - [Instructions](#instructions)
    - [Environment variables](#environment-variables)
    - [Pull the Celo Docker image](#pull-the-celo-docker-image)
    - [Create accounts](#create-accounts)
    - [Deploy the validator and proxy nodes](#deploy-the-validator-and-proxy-nodes)
    - [Deploy the attestation service](#deploy-the-attestation-service)
      - [Environment variables](#environment-variables-1)
      - [Sms Providers](#sms-providers)
      - [Configuration](#configuration)
      - [Running the attestation service](#running-the-attestation-service)

This section explains how to get a validator node running on the Baklava network, using a Docker image that was built for this purpose. Most of this process is the same as running a full node, but with a few additional steps.

This section is specific for Baklava Network. You can find more details about running a validator in different networks at [Running a Validator page](running-a-validator.md).

## Instructions

If you are re-running these instructions, the Celo Docker image may have been updated, and it's important to get the latest version.

To run a complete validator it's necessary to execute the following components:

- The valitor software
- A Proxy that acts as an intermediary for the validator requests
- The attestation service

### Environment variables

| Variable                     | Explanation                                                                   | Default Value |
| ---------------------------- | ----------------------------------------------------------------------------- | ------------- |
| CELO_IMAGE                   | The docker image used for the validator and proxy containers                  |               |
| CELO_NETWORK                 | The Celo network to connect with. This variable is also used as the image tag |               |
| NETWORK_ID                   | The celo network chain id                                                     |               |
| URL_VERIFICATION_POOL        | URL for the Verification pool for the attestation process                     |               |
| CELO_VALIDATOR_GROUP_ADDRESS | The etherbase public address for the validation group                         |               |
| CELO_VALIDATOR_ADDRESS       | The etherbase public address for the validator instance                       |               |
| CELO_PROXY_ADDRESS           | The etherbase public address for the proxy instance                           |               |
| CELO_VALIDATOR_POP           |                                                                               |               |
| PROXY_ENODE                  | The ethereum node address for the validator                                   |               |
| PROXY_IP                     | The proxy container internal IP address from docker pool address              |               |
| ATTESTATION_KEY              | The etherbase private key for the account used in the attestation service     |               |
| ATTESTATION_SERVICE_URL      | The URL to access the attestation service deployed                            |               |
| METADATA_URL                 | The URL to access the metadata file for your attestation service              |               |

First we are going to setup the main environment variables related with the `Baklava` network. Run:

```bash
export CELO_NETWORK=baklava
export CELO_IMAGE=us.gcr.io/celo-testnet/celo-node
export NETWORK_ID=1101
```

### Pull the Celo Docker image

In all the commands we are going to see the `CELO_IMAGE` and `CELO_NETWORK` variables to refer to the right Docker image and network to use. Now we can get the Docker image:

```bash
docker pull $CELO_IMAGE:$CELO_NETWORK
```

### Create accounts

At this point we need to create the accounts that will be used by the Validator and the Proxy. We create and cd into the directory where you want to store the data and any other files needed to run your node. You can name this whatever you’d like, but here’s a default you can use:

```bash
mkdir -p celo-data-dir/proxy celo-data-dir/validator
cd celo-data-dir
```

We are going to need to create 3 accounts, 2 for the validator and 1 for the Proxy.

First we create three accounts, one for the Validator, one for Validator Group and the last one for the Proxy. You can get their addresses if you don’t already have them. If you already have some accounts, you can skip this step.

To create the accounts needed, run the following commands. The first two create the accounts for the validator, the third one for the proxy:

```bash
docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE:$CELO_NETWORK -c "geth account new"
docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE:$CELO_NETWORK -c "geth account new"
docker run -v $PWD/proxy:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE:$CELO_NETWORK -c "geth account new"
```

Those commands will prompt you for a passphrase, ask you to confirm it, and then will output your account address: `Address: {<YOUR-ACCOUNT-ADDRESS>}`

Let's save these addresses to environment variables, so that you can reference it later (don't include the braces):

```bash
export CELO_VALIDATOR_GROUP_ADDRESS=<YOUR-VALIDATOR-GROUP-ADDRESS>
export CELO_VALIDATOR_ADDRESS=<YOUR-VALIDATOR-ADDRESS>
export CELO_PROXY_ADDRESS=<YOUR-PROXY-ADDRESS>
```

In order to register the validator later on, generate a "proof of possession" - a signature proving you know your validator's BLS private key. Run this command:

```bash
docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE:$CELO_NETWORK -c "geth account proof-of-possession $CELO_VALIDATOR_ADDRESS"
```

It will prompt you for the passphrase you've chosen for the validator account. Let's save the resulting proof-of-possession to an environment variable:

```bash
export CELO_VALIDATOR_POP=<YOUR-VALIDATOR-PROOF-OF-POSSESSION>
```

### Deploy the validator and proxy nodes

We initialize the docker containers for the validator and the proxy, building from an image for the network and initializing Celo with the genesis block:

```bash
docker run -v $PWD/proxy:/root/.celo $CELO_IMAGE:$CELO_NETWORK init /celo/genesis.json
docker run -v $PWD/validator:/root/.celo $CELO_IMAGE:$CELO_NETWORK init /celo/genesis.json
```

To participate in consensus, we need to set up our nodekey for our accounts. We can do so via the following commands \(it will prompt you for your passphrase\):

```bash
docker run -v $PWD/proxy:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE:$CELO_NETWORK -c "geth account set-node-key $CELO_PROXY_ADDRESS"
docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE:$CELO_NETWORK -c "geth account set-node-key $CELO_VALIDATOR_ADDRESS"
```

In order to allow the node to sync with the network, give it the address of existing nodes in the network:

```bash
docker run -v $PWD/proxy:/root/.celo --entrypoint cp $CELO_IMAGE:$CELO_NETWORK /celo/static-nodes.json /root/.celo/
docker run -v $PWD/validator:/root/.celo --entrypoint cp $CELO_IMAGE:$CELO_NETWORK /celo/static-nodes.json /root/.celo/
```

At this point we are ready to start up the proxy:

```bash
docker run --name celo-proxy -p 8545:8545 -p 8546:8546 -p 30303:30303 -p 30303:30303/udp -p 30503:30503 -p 30503:30503/udp -v $PWD/proxy:/root/.celo $CELO_IMAGE:$CELO_NETWORK --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug --maxpeers 1100 --etherbase=$CELO_PROXY_ADDRESS --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_ADDRESS --proxy.internalendpoint :30503
```

Now we need to obtain the Proxy enode and ip addresses, running the following commands:

```bash
export PROXY_ENODE=$(docker exec celo-proxy geth --exec "admin.nodeInfo['enode'].split('//')[1].split('@')[0]" attach | tr -d '"')
export PROXY_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' celo-proxy)
```

Now we can start up the validator node:

```bash
docker run --name celo-validator -p 127.0.0.1:8547:8545 -p 127.0.0.1:8548:8546 -p 30304:30303 -p 30304:30303/udp -v $PWD/validator:/root/.celo $CELO_IMAGE:$CELO_NETWORK --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug --maxpeers 125 --mine --istanbul.blockperiod=1 --istanbul.requesttimeout=3000 --etherbase $CELO_VALIDATOR_ADDRESS --nodiscover --proxy.proxied --proxy.proxyenodeurlpair=enode://$PROXY_ENODE@$PROXY_IP:30503\;enode://$PROXY_ENODE@$PROXY_IP:30503
```

{% hint style="danger" %}
**Security**: The command line above includes the parameter `--rpcaddr 0.0.0.0` which makes the Celo Blockchain software listen for incoming RPC requests on all network adaptors. Exercise extreme caution in doing this when running outside Docker, as it means that any unlocked accounts and their funds may be accessed from other machines on the Internet. In the context of running a Docker container on your local machine, this together with the `docker -p` flags allows you to make RPC calls from outside the container, i.e from your local host, but not from outside your machine. Read more about [Docker Networking](https://docs.docker.com/network/network-tutorial-standalone/#use-user-defined-bridge-networks) here.
{% endhint %}

The `mine` flag does not mean the node starts mining blocks, but rather starts trying to participate in the BFT consensus protocol. It cannot do this until it gets elected -- so next we need to stand for election.

The `networkid` parameter value of `44785` indicates we are connecting the Baklava Beta network.

### Deploy the attestation service

As part of the [lightweight identity protocol](/celo-codebase/protocol/identity), validators are expected to run an attestation service to provide attestations that allow users to map their phone number to an account on Celo. The attestation service is a simple Node.js application that can be run with a docker image.

#### Environment variables

The service needs the following environment variables:

| Variable        | Explanation                                                                                                                                                            | Default Value |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| DATABASE_URL    | The URL under which your database is accessible, currently supported are `postgres://`, `mysql://` and `sqlite://`                                                     |               |
| CELO_PROVIDER   | The URL under which a celo blockchain node is reachable, i.e. something like `https://integration-forno.celo-testnet.org`                                              |               |
| ACCOUNT_ADDRESS | The address of the account                                                                                                                                             |               |
| ATTESTATION_KEY | The private key with which attestations should be signed. You could use your account key for attestations, but really you should authorize a dedicated attestation key |               |
| APP_SIGNATURE   | The hash with which clients can auto-read SMS messages on android                                                                                                      |               |
| SMS_PROVIDERS   | A comma-separated list of providers you want to configure, we currently support `nexmo` & `twilio`                                                                     |               |

#### Sms Providers

Currently the Sms providers supported are Nexmo & Twilio. You can create your user account in the provider of your election using the [Nexmo Sign Up form](https://dashboard.nexmo.com/sign-up) or the [Twilio Sign Up form](https://www.twilio.com/try-twilio).

Here is the list of the enviromnet variables needed to use the Nexmo SMS broker:

| Variable        | Explanation                                                     | Default Value |
| --------------- | --------------------------------------------------------------- | ------------- |
| NEXMO_KEY       | The API key to the Nexmo API                                    |
| NEXMO_SECRET    | The API secret to the Nexmo API                                 |
| NEXMO_BLACKLIST | A comma-sperated list of country codes you do not want to serve |

If you prefer using Twilio, this is list of the variables to use:

| Variable                     | Explanation                                                     | Default Value |
| ---------------------------- | --------------------------------------------------------------- | ------------- |
| TWILIO_ACCOUNT_SID           | The Twilio account ID                                           |
| TWILIO_MESSAGING_SERVICE_SID | The Twilio Message Service ID. Starts by `MG`                   |
| TWILIO_AUTH_TOKEN            | The API authentication token                                    |
| TWILIO_BLACKLIST             | A comma-sperated list of country codes you do not want to serve |

#### Configuration

First we need to create an account for getting the attestation key needed to sign the attestations. Run:

```bash
celocli account:new
```

We copy the account details and assign the Private Key to the `ATTESTATION_SERVICE` environment variable:

```bash
export ATTESTATION_KEY=<Private Key>
export ACCOUNT_ADDRESS=<Account address>
```

The attestation service needs to be publicly available from the internet, allowing the users to send attestation requests to the server. So depending on how and where you are making available the service, you need to configure the `CELO_PROVIDER` variable pointing to that.

For example:

```bash
export CELO_PROVIDER="https://my-attestation.example.com"
```

For storing and retrieving the attestation requests the service needs a database to persist that information. Currently `sqlite`, `postgres` and `mysql` are supported. For testing purposes you can use `sqlite` but it's recommended to run a stand-alone database server using `mysql` or `postgres` if your intention is running the attestation service in a production environment.

So for specifying the database url you need to setup the `DATABASE_URL` variable:

```bash
export DATABASE_URL="sqlite://db/dev.db"
export DATABASE_URL="mysql://user:password@mysql.example.com:3306/attestation-service"
export DATABASE_URL="postgres://user:password@postgres.example.com:5432/attestation-service"
```

You can find the migration scripts for creating the schema at the `celo-monorepo`, `packages/attestation-service` folder. From there, after setting up the `DATABASE_URL` env variable you can run the following commands:

```bash
yarn run db:create:dev
yarn run db:migrate:dev
```

#### Running the attestation service

The following command for running the attestation service is using Nexmo, but you can adapt for using Twilio easily:

```bash
docker run -e ATTESTATION_KEY=$ATTESTATION_KEY -e ACCOUNT_ADDRESS=$ACCOUNT_ADDRESS -e CELO_PROVIDER=$CELO_PROVIDER -e DATABASE_URL=$DATABASE_URL -e SMS_PROVIDERS=nexmo -e NEXMO_KEY=$NEXMO_KEY -e NEXMO_SECRET=$NEXMO_SECRET -e NEXMO_BLACKLIST=$NEXMO_BLACKLIST  -p 3000:80 us.gcr.io/celo-testnet/attestation-service:$CELO_NETWORK
```

In order for users to request attestations from your service, you need to register the endpoint under which your service is reachable in your [metadata](/celo-codebase/protocol/identity/metadata).

```bash
celocli identity:create-metadata ./metadata.json
```

Add your URL:

```bash
celocli identity:change-attestation-service-url ./metadata.json --url ATTESTATION_SERVICE_URL
```

And then host your metadata somewhere reachable via HTTP. You can register your metadata URL with:

```bash
celocli identity:register-metadata --url <METADATA_URL> --from $CELO_VALIDATOR_ADDRESS
```

If everything goes well users should see that you are ready for attestations by running:

```bash
celocli identity:get-metadata $CELO_VALIDATOR_ADDRESS
```

You’re all set! Note that elections are finalized at the end of each epoch, roughly once an hour in the Baklava Testnet. After that hour, if you get elected, your node will start participating BFT consensus and validating blocks. Users requesting attestations will hit your registered attestation service.
