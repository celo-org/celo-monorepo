# Running a Validator in Baklava Network

- [Running a Validator in Baklava Network](#running-a-validator-in-baklava-network)
  - [Instructions](#instructions)
    - [Environment variables](#environment-variables)
    - [Pull the Celo Docker image](#pull-the-celo-docker-image)
    - [Create accounts](#create-accounts)
    - [Deploy the Validator and Proxy nodes](#deploy-the-validator-and-proxy-nodes)
    - [Running the Attestation Service](#running-the-attestation-service)
    - [Reference Script](#reference-script)

This section explains how to get a Validator node running on the Baklava network, using a Docker image that was built for this purpose. Most of this process is the same as running a full node, but with a few additional steps.

This section is specific for Baklava Network. You can find more details about running a Validator in different networks at [Running a Validator page](running-a-validator.md).

## Instructions

If you are re-running these instructions, the Celo Docker image may have been updated, and it's important to get the latest version.

To run a complete Validator it's necessary to execute the following components:

- The Validator software
- A Proxy that acts as an intermediary for the Validator requests
- The Attestation Service

The Proxy is not mandatory but highly recommended. It allows to protect the Validator node from outside connections and hide the Validator behind that Proxy from other nodes of the network.

### Environment variables

| Variable                      | Explanation                                                      |
| ----------------------------- | ---------------------------------------------------------------- |
| CELO_IMAGE                    | The Docker image used for the Validator and Proxy containers     |  |
| NETWORK_ID                    | The Celo network chain ID                                        |  |
| URL_VERIFICATION_POOL         | URL for the Verification pool for the attestation process        |  |
| CELO_VALIDATOR_GROUP_ADDRESS  | The public address for the validation group                      |  |
| CELO_VALIDATOR_ADDRESS        | The public address for the Validator instance                    |  |
| CELO_PROXY_ADDRESS            | The public address for the Proxy instance                        |  |
| CELO_VALIDATOR_BLS_PUBLIC_KEY | The BLS public key for the Validator instance                    |  |
| CELO_VALIDATOR_BLS_SIGNATURE  | A proof-of-possession of the BLS public key                      |  |
| PROXY_ENODE                   | The enode address for the Validator proxy                        |  |
| PROXY_IP                      | The Proxy container internal IP address from docker pool address |  |
| ATTESTATION_KEY               | The private key for the account used in the Attestation Service  |  |
| ATTESTATION_SERVICE_URL       | The URL to access the Attestation Service deployed               |  |
| METADATA_URL                  | The URL to access the metadata file for your Attestation Service |  |

First we are going to setup the main environment variables related with the `Baklava` network. Run:

```bash
export CELO_IMAGE=us.gcr.io/celo-testnet/celo-node:baklava
export NETWORK_ID=1101
```

### Pull the Celo Docker image

In all the commands we are going to see the `CELO_IMAGE` variable to refer to the right Docker image to use. Now we can get the Docker image:

```bash
docker pull $CELO_IMAGE
```

### Create accounts

At this point we need to create the accounts that will be used by the Validator and the Proxy. We create and cd into the directory where you want to store the data and any other files needed to run your node. You can name this whatever you’d like, but here’s a default you can use:

```bash
mkdir -p celo-data-dir/proxy celo-data-dir/validator
cd celo-data-dir
```

We are going to need to create 3 accounts, 2 for the Validator and 1 for the Proxy.

First we create three accounts, one for the Validator, one for the Validator Group and the last one for the Proxy. You can generate their addresses using the below commands if you don’t already have them. If you already have some accounts, you can skip this step.

To create the accounts needed, run the following commands. The first two create the accounts for the Validator, the third one for the Proxy:

```bash
docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account new"
docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account new"
docker run -v $PWD/proxy:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account new"
```

Those commands will prompt you for a passphrase, ask you to confirm it, and then will output your account address: `Address: {<YOUR-ACCOUNT-ADDRESS>}`

{% hint style="danger" %}
**Warning**: There is a known issue running geth inside Docker that happens eventually. So if that command fails, please check [this page](https://forum.celo.org/t/setting-up-a-validator-faq/90).
{% endhint %}

Let's save these addresses to environment variables, so that you can reference it later (don't include the braces):

```bash
export CELO_VALIDATOR_GROUP_ADDRESS=<YOUR-VALIDATOR-GROUP-ADDRESS>
export CELO_VALIDATOR_ADDRESS=<YOUR-VALIDATOR-ADDRESS>
export CELO_PROXY_ADDRESS=<YOUR-PROXY-ADDRESS>
```

In order to register the Validator later on, generate a "proof of possession" - a signature proving you know your Validator's BLS private key. Run this command to generate this "proof-of-possession", which consists of a the BLS public key and a signature:

```bash
docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account proof-of-possession $CELO_VALIDATOR_ADDRESS"
```

It will prompt you for the passphrase you've chosen for the Validator account. Let's save the resulting proof-of-possession to two environment variables:

```bash
export CELO_VALIDATOR_BLS_PUBLIC_KEY=<YOUR-VALIDATOR-BLS-PUBLIC-KEY>
export CELO_VALIDATOR_BLS_SIGNATURE=<YOUR-VALIDATOR-BLS-SIGNATURE>
```

### Deploy the Validator and Proxy nodes

We initialize the Docker containers for the Validator and the Proxy, building from an image for the network and initializing Celo with the genesis block found inside the Docker image:

```bash
docker run -v $PWD/proxy:/root/.celo $CELO_IMAGE init /celo/genesis.json
docker run -v $PWD/validator:/root/.celo $CELO_IMAGE init /celo/genesis.json
```

To participate in consensus, we need to set up our nodekey for our accounts. We can do so via the following commands \(it will prompt you for your passphrase\):

```bash
docker run -v $PWD/proxy:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account set-node-key $CELO_PROXY_ADDRESS"
docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account set-node-key $CELO_VALIDATOR_ADDRESS"
```

{% hint style="danger" %}
**Warning**: There is a known issue running geth inside Docker that happens eventually. So if that command fails, please check [this page](https://forum.celo.org/t/setting-up-a-validator-faq/90).
{% endhint %}

In order to allow the node to sync with the network, give it the address of existing nodes in the network:

```bash
docker run -v $PWD/proxy:/root/.celo --entrypoint cp $CELO_IMAGE /celo/static-nodes.json /root/.celo/
docker run -v $PWD/validator:/root/.celo --entrypoint cp $CELO_IMAGE /celo/static-nodes.json /root/.celo/
```

At this point we are ready to start up the Proxy:

```bash
docker run --name celo-proxy --restart always -p 8545:8545 -p 8546:8546 -p 30303:30303 -p 30303:30303/udp -p 30503:30503 -p 30503:30503/udp -v $PWD/proxy:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug --maxpeers 1100 --etherbase=$CELO_PROXY_ADDRESS --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_ADDRESS --proxy.internalendpoint :30503
```

Now we need to obtain the Proxy enode and ip addresses, running the following commands:

```bash
export PROXY_ENODE=$(docker exec celo-proxy geth --exec "admin.nodeInfo['enode'].split('//')[1].split('@')[0]" attach | tr -d '"')
export PROXY_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' celo-proxy)
```

Now we can start up the Validator node:

```bash
docker run -v $PWD/validator:/root/.celo --entrypoint sh --rm $CELO_IMAGE -c "echo $DEFAULT_PASSWORD > /root/.celo/.password"
docker run --name celo-validator --restart always -p 127.0.0.1:8547:8545 -p 127.0.0.1:8548:8546 -p 30304:30303 -p 30304:30303/udp -v $PWD/validator:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug --maxpeers 125 --mine --istanbul.blockperiod=5 --istanbul.requesttimeout=3000 --etherbase $CELO_VALIDATOR_ADDRESS --nodiscover --proxy.proxied --proxy.proxyenodeurlpair=enode://$PROXY_ENODE@$PROXY_IP:30503\;enode://$PROXY_ENODE@$PROXY_IP:30503  --unlock=$CELO_VALIDATOR_ADDRESS --password /root/.celo/.password
```

{% hint style="danger" %}
**Security**: The command line above includes the parameter `--rpcaddr 0.0.0.0` which makes the Celo Blockchain software listen for incoming RPC requests on all the interfaces of the Docker container. Exercise extreme caution in doing this when running outside Docker, as it means that any unlocked accounts and their funds may be accessed from other machines on the Internet. In the context of running a Docker container on your local machine, this together with the `docker -p` flags allows you to make RPC calls from outside the container, i.e from your local host, but not from outside your machine. Read more about [Docker Networking](https://docs.docker.com/network/network-tutorial-standalone/#use-user-defined-bridge-networks) here.
{% endhint %}

The `mine` flag does not mean the node starts mining blocks, but rather starts trying to participate in the BFT consensus protocol. It cannot do this until it gets elected -- so next we need to stand for election.

The `networkid` parameter value of `44785` indicates we are connecting the Baklava Beta network.

### Running the Attestation Service

As part of the [lightweight identity protocol](/celo-codebase/protocol/identity), Validators are expected to run an [Attestation Service](https://github.com/celo-org/celo-monorepo/tree/master/packages/attestation-service) to provide attestations that allow users to map their phone number to an account on Celo.

You can find the complete instructions about how to run the [Attestation Service at the documentation page](running-attestation-service.md).

You’re all set! Note that elections are finalized at the end of each epoch, roughly once an hour in the Baklava Testnet. After that hour, if you get elected, your node will start participating BFT consensus and validating blocks. Users requesting attestations will hit your registered Attestation Service.

### Reference Script

You can use (and modify if you want) this [reference bash script](../../../scripts/run-docker-validator-network.sh) automating all the above steps. It requires Docker and screen.

You can see all the options using the following command:

```bash
./run-docker-validator-network.sh help
```
