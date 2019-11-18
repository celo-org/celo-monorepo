# Running a Validator

- [Running a Validator](#running-a-validator)
  - [Prerequisites](#prerequisites)
    - [Hardware requirements](#hardware-requirements)
    - [Software requirements](#software-requirements)
  - [Celo Networks](#celo-networks)
    - [Baklava](#baklava)
    - [Environment variables](#environment-variables)
      - [Create accounts](#create-accounts)
      - [Deploy the validator and proxy nodes](#deploy-the-validator-and-proxy-nodes)
      - [Deploy the attestation service](#deploy-the-attestation-service)
    - [Alfajores](#alfajores)
      - [Pull the Celo Docker image](#pull-the-celo-docker-image)
      - [Create accounts](#create-accounts-1)
      - [Deploy the validator node](#deploy-the-validator-node)
    - [Obtain and lock up some Celo Gold for staking](#obtain-and-lock-up-some-celo-gold-for-staking)
      - [Baklava](#baklava-1)
      - [Alfajores](#alfajores-1)
      - [Lock up Celo Gold](#lock-up-celo-gold)
    - [Run for election](#run-for-election)

This section explains how to get a validator node running on the network, using a Docker image that was built for this purpose. Most of this process is the same as running a full node, but with a few additional steps.

Validators help secure the Celo network by participating in Celo’s Proof of Stake protocol. Validators are organized into Validator Groups, analogous to parties in representative democracies. A validator group is essentially an ordered list of validators, along with metadata like name and URL.

Just as anyone in a democracy can create their own political party, or seek to get selected to represent a party in an election, any Celo user can create a validator group and add themselves to it, or set up a potential validator and work to get an existing validator group to include them.

While other Validator Groups will exist on the Celo Networks, the fastest way to get up and running with a validator will be to register a Validator Group, register a Validator, and add that Validator to your Validator Group. The addresses used to register Validator Groups and Validators must be unique, which will require that you create two accounts in the step-by-step guide below.

{% hint style="info" %}
If you are starting up a validator, please consider leaving it running for a few weeks to support the network.
{% endhint %}

## Prerequisites

### Hardware requirements

Because Celo network is based in Proof of Stake, the hardware requirements are not very high. Proof of Stake consensus is not so CPU intensive as Proof of Work but has a higher requirements of network connectivity and lantency. Here you have a list of the standard requirements for running a validator node:

- Memory: 8 GB RAM
- CPU: Quad core 3GHz (64-bit)
- Disk: 256 GB of SSD storage
- Network: At least 1 GB input/output dual Ethernet

It is recommended to run the validator node in an environment that facilitates a 24/7 execution. Deployments in a top-tier datacenter facilitates the security and better uptimes.

### Software requirements

- **You have Docker installed.**

  If you don’t have it already, follow the instructions here: [Get Started with Docker](https://www.docker.com/get-started). It will involve creating or signing in with a Docker account, downloading a desktop app, and then launching the app to be able to use the Docker CLI. If you are running on a Linux server, follow the instructions for your distro [here](https://docs.docker.com/install/#server). You may be required to run Docker with sudo depending on your installation environment.

- **You have celocli installed.**

  See [Command Line Interface \(CLI\) ](../command-line-interface/introduction.md)for instructions on how to get set up.

- **You are using the latest Node 10.x LTS**

  Some users have reported issues using the most recent version of node. Use the LTS for greater reliability.

{% hint style="info" %}
A note about conventions:
The code you'll see on this page is bash commands and their output.

When you see text in angle brackets &lt;&gt;, replace them and the text inside with your own value of what it refers to. Don't include the &lt;&gt; in the command.
{% endhint %}

## Celo Networks

Celo provides different networks for different purposes. In this tutorial we are going to show how to run a validator in `Baklava` and `Alfajores` networks.

In this documentation page we're going to use a Docker image containing the Celo node software.

### Baklava

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

If you are re-running these instructions, the Celo Docker image may have been updated, and it's important to get the latest version.

To run a complete validator it's necessary to execute the following components:

- The valitor software
- A Proxy that acts as an intermediary for the validator requests
- The attestation service

First we are going to setup the main environment variables related with the `Baklava` network. Run:

```bash
$ export CELO_NETWORK=baklava
$ export CELO_IMAGE=us.gcr.io/celo-testnet/celo-node
$ export NETWORK_ID=1101
```

In all the commands we are going to see the `CELO_IMAGE` and `CELO_NETWORK` variables to refer to the right Docker image and network to use. Now we can get the Docker image:

```bash
$ docker pull $CELO_IMAGE:$CELO_NETWORK
```

#### Create accounts

At this point we need to create the accounts that will be used by the Validator and the Proxy. We create and cd into the directory where you want to store the data and any other files needed to run your node. You can name this whatever you’d like, but here’s a default you can use:

```bash
$ mkdir -p celo-data-dir/proxy celo-data-dir/validator
$ cd celo-data-dir
```

We are going to need to create 3 accounts, 2 for the validator and 1 for the Proxy.

First we create three accounts, one for the Validator, one for Validator Group and the last one for the Proxy. You can get their addresses if you don’t already have them. If you already have some accounts, you can skip this step.

To create the accounts needed, run the following commands. The first two create the accounts for the validator, the third one for the proxy:

```bash
$ docker run -v `pwd`/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE:$CELO_NETWORK -c "geth account new"
$ docker run -v `pwd`/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE:$CELO_NETWORK -c "geth account new"
$ docker run -v `pwd`/proxy:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE:$CELO_NETWORK -c "geth account new"
```

Those commands will prompt you for a passphrase, ask you to confirm it, and then will output your account address: `Address: {<YOUR-ACCOUNT-ADDRESS>}`

Let's save these addresses to environment variables, so that you can reference it later (don't include the braces):

```bash
$ export CELO_VALIDATOR_GROUP_ADDRESS=<YOUR-VALIDATOR-GROUP-ADDRESS>
$ export CELO_VALIDATOR_ADDRESS=<YOUR-VALIDATOR-ADDRESS>
$ export CELO_PROXY_ADDRESS=<YOUR-PROXY-ADDRESS>
```

In order to register the validator later on, generate a "proof of possession" - a signature proving you know your validator's BLS private key. Run this command:

```bash
$ docker run -v `pwd`/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE:$CELO_NETWORK -c "geth account proof-of-possession $CELO_VALIDATOR_ADDRESS"
```

It will prompt you for the passphrase you've chosen for the validator account. Let's save the resulting proof-of-possession to an environment variable:

```bash
$ export CELO_VALIDATOR_POP=<YOUR-VALIDATOR-PROOF-OF-POSSESSION>
```

#### Deploy the validator and proxy nodes

We initialize the docker containers for the validator and the proxy, building from an image for the network and initializing Celo with the genesis block:

```bash
$ docker run -v `pwd`/proxy:/root/.celo $CELO_IMAGE:$CELO_NETWORK init /celo/genesis.json
$ docker run -v `pwd`/validator:/root/.celo $CELO_IMAGE:$CELO_NETWORK init /celo/genesis.json
```

To participate in consensus, we need to set up our nodekey for our accounts. We can do so via the following commands \(it will prompt you for your passphrase\):

```bash
$ docker run -v `pwd`/proxy:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE:$CELO_NETWORK -c "geth account set-node-key $CELO_PROXY_ADDRESS"
$ docker run -v `pwd`/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE:$CELO_NETWORK -c "geth account set-node-key $CELO_VALIDATOR_ADDRESS"
```

In order to allow the node to sync with the network, give it the address of existing nodes in the network:

```bash
$ docker run -v `pwd`/proxy:/root/.celo --entrypoint cp $CELO_IMAGE:$CELO_NETWORK /celo/static-nodes.json /root/.celo/
$ docker run -v `pwd`/validator:/root/.celo --entrypoint cp $CELO_IMAGE:$CELO_NETWORK /celo/static-nodes.json /root/.celo/
```

At this point we are ready to start up the proxy:

```bash
$ docker run --name celo-proxy -p 8545:8545 -p 8546:8546 -p 30303:30303 -p 30303:30303/udp -p 30503:30503 -p 30503:30503/udp -v `pwd`/proxy:/root/.celo $CELO_IMAGE:$CELO_NETWORK --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug --maxpeers 1100 --etherbase=$CELO_PROXY_ADDRESS --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_ADDRESS --proxy.internalendpoint :30503
```

Now we need to obtain the Proxy enode and ip addresses, running the following commands:

```bash
$ export PROXY_ENODE=$(docker exec celo-proxy geth --exec "admin.nodeInfo['enode'].split('//')[1].split('@')[0]" attach | tr -d '"')
$ export PROXY_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' celo-proxy)
```

Now we can start up the validator node:

```bash
$ docker run --name celo-validator -p 127.0.0.1:8547:8545 -p 127.0.0.1:8548:8546 -p 30304:30303 -p 30304:30303/udp -v `pwd`/validator:/root/.celo $CELO_IMAGE:$CELO_NETWORK --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug --maxpeers 125 --mine --istanbul.blockperiod=1 --istanbul.requesttimeout=3000 --etherbase $CELO_VALIDATOR_ADDRESS --nodiscover --proxy.proxied --proxy.proxyenodeurlpair=enode://$PROXY_ENODE@$PROXY_IP:30503\;enode://$PROXY_ENODE@$PROXY_IP:30503
```

{% hint style="danger" %}
**Security**: The command line above includes the parameter `--rpcaddr 0.0.0.0` which makes the Celo Blockchain software listen for incoming RPC requests on all network adaptors. Exercise extreme caution in doing this when running outside Docker, as it means that any unlocked accounts and their funds may be accessed from other machines on the Internet. In the context of running a Docker container on your local machine, this together with the `docker -p` flags allows you to make RPC calls from outside the container, i.e from your local host, but not from outside your machine. Read more about [Docker Networking](https://docs.docker.com/network/network-tutorial-standalone/#use-user-defined-bridge-networks) here.
{% endhint %}

The `mine` flag does not mean the node starts mining blocks, but rather starts trying to participate in the BFT consensus protocol. It cannot do this until it gets elected -- so next we need to stand for election.

The `networkid` parameter value of `44785` indicates we are connecting the Baklava Beta network.

#### Deploy the attestation service

As part of the [lightweight identity protocol](/celo-codebase/protocol/identity), validators are expected to run an attestation service to provide attestations that allow users to map their phone number to an account on Celo. The attestation service is a simple Node.js application that can be run with a docker image:

First we need to create an account. Run:

```bash
$ celocli account:new
```

We copy the account details and assign the Private Key to the `ATTESTATION_SERVICE` environment variable:

```bash
$ export ATTESTATION_KEY=<Private Key>
```

```bash
$ docker run -e ATTESTATION_KEY=$ATTESTATION_KEY -p 3000:80 us.gcr.io/celo-testnet/attestation-service:$CELO_NETWORK
```

In order for users to request attestations from your service, you need to register the endpoint under which your service is reachable in your [metadata](/celo-codebase/protocol/identity/metadata).

```bash
$ celocli identity:create-metadata ./metadata.json
```

Add your URL:

```bash
$ celocli identity:change-attestation-service-url ./metadata.json --url ATTESTATION_SERVICE_URL
```

And then host your metadata somewhere reachable via HTTP. You can register your metadata URL with:

```bash
$ celocli identity:register-metadata --url <METADATA_URL> --from $CELO_VALIDATOR_ADDRESS
```

If everything goes well users should see that you are ready for attestations by running:

```bash
$ celocli identity:get-metadata $CELO_VALIDATOR_ADDRESS
```

You’re all set! Note that elections are finalized at the end of each epoch, roughly once an hour in the Baklava Testnet. After that hour, if you get elected, your node will start participating BFT consensus and validating blocks. Users requesting attestations will hit your registered attestation service.

### Alfajores

First we are going to setup the main environment variables related with the `Alfajores` network. Run:

```bash
$ export CELO_NETWORK=alfajores
$ export CELO_IMAGE=us.gcr.io/celo-testnet/celo-node
$ export NETWORK_ID=44785
$ export URL_VERIFICATION_POOL=https://us-central1-celo-testnet-production.cloudfunctions.net/handleVerificationRequestalfajores/v0.1/sms/
```

#### Pull the Celo Docker image

In all the commands we are going to see the `CELO_IMAGE` and `CELO_NETWORK` variables to refer to the right Docker image and network to use. Now we can get the Docker image:

```bash
$ docker pull $CELO_IMAGE:$CELO_NETWORK
```

#### Create accounts

Create and cd into the directory where you want to store the data and any other files needed to run your node. You can name this whatever you’d like, but here’s a default you can use:

```bash
$ mkdir celo-alfajores-dir
$ cd celo-alfajores-dir
```

Create two accounts, one for the Validator and one for Validator Group, and get their addresses if you don’t already have them. If you already have your accounts, you can skip this step.

To create your two accounts, run this command twice:

```bash
$ docker run -v $PWD:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE:$CELO_NETWORK -c "geth account new"
```

It will prompt you for a passphrase, ask you to confirm it, and then will output your account address: `Address: {<YOUR-ACCOUNT-ADDRESS>}`

Let's save these addresses to environment variables, so that you can reference it later (don't include the braces):

```bash
$ export CELO_VALIDATOR_GROUP_ADDRESS=<YOUR-VALIDATOR-GROUP-ADDRESS>
$ export CELO_VALIDATOR_ADDRESS=<YOUR-VALIDATOR-ADDRESS>
```

In order to register the validator later on, generate a "proof of possession" - a signature proving you know your validator's BLS private key. Run this command:

```bash
$ docker run -v $PWD:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE:$CELO_NETWORK -c "geth account proof-of-possession $CELO_VALIDATOR_ADDRESS"
```

It will prompt you for the passphrase you've chosen for the validator account. Let's save the resulting proof-of-possession to an environment variable:

```bash
$ export CELO_VALIDATOR_POP=<YOUR-VALIDATOR-PROOF-OF-POSSESSION>
```

#### Deploy the validator node

Initialize the docker container, building from an image for the network and initializing Celo with the genesis block:

```bash
$ docker run -v $PWD:/root/.celo $CELO_IMAGE:$CELO_NETWORK init /celo/genesis.json
```

To participate in consensus, we need to set up our nodekey for our account. We can do so via the following command \(it will prompt you for your passphrase\):

```bash
$ docker run -v $PWD:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE:$CELO_NETWORK -c "geth account set-node-key $CELO_VALIDATOR_ADDRESS"
```

In order to allow the node to sync with the network, give it the address of existing nodes in the network:

```bash
$ docker run -v $PWD:/root/.celo --entrypoint cp $CELO_IMAGE:$CELO_NETWORK /celo/static-nodes.json /root/.celo/
```

Start up the node:

```bash
$ docker run -p 127.0.0.1:8545:8545 -p 127.0.0.1:8546:8546 -p 30303:30303 -p 30303:30303/udp -v $PWD:/root/.celo $CELO_IMAGE:$CELO_NETWORK --verbosity 3 --networkid 44785 --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal --maxpeers 1100 --mine --miner.verificationpool=$URL_VERIFICATION_POOL --etherbase $CELO_VALIDATOR_ADDRESS
```

{% hint style="danger" %}
**Security**: The command line above includes the parameter `--rpcaddr 0.0.0.0` which makes the Celo Blockchain software listen for incoming RPC requests on all network adaptors. Exercise extreme caution in doing this when running outside Docker, as it means that any unlocked accounts and their funds may be accessed from other machines on the Internet. In the context of running a Docker container on your local machine, this together with the `docker -p` flags allows you to make RPC calls from outside the container, i.e from your local host, but not from outside your machine. Read more about [Docker Networking](https://docs.docker.com/network/network-tutorial-standalone/#use-user-defined-bridge-networks) here.
{% endhint %}

The `mine` flag will tell geth to try participating in the BFT consensus protocol, which is analogous to mining on the Ethereum PoW network. It will not be allowed to validate until it gets elected -- so next we need to stand for election.

The `networkid` parameter value of `44785` indicates we are connecting the Alfajores Testnet.

Now you may need to wait for your node to complete a full sync. You can check on the sync status with `celocli node:synced`. Your node will be fully synced when it has downloaded and processed the latest block, which you can see on the [Alfajores Testnet Stats](https://alfajores-ethstats.celo-testnet.org/) page.

### Obtain and lock up some Celo Gold for staking

#### Baklava

To participate in The Great Celo Stake Off (aka TGCSO) and get fauceted it's necessary to register online via an [online form](https://docs.google.com/forms/d/e/1FAIpQLSfbn5hTJ4UIWpN92-o2qMTUB0UnrFsL0fm97XqGe4VhhN_r5A/viewform).

#### Alfajores

Visit the [Alfajores Celo Faucet](https://celo.org/build/faucet) to send **both** of your accounts some funds.

In a new tab, unlock your accounts so that you can send transactions. This only unlocks the accounts for the lifetime of the validator that's running, so be sure to unlock `$CELO_VALIDATOR_ADDRESS` again if your node gets restarted:

```bash
# You will be prompted for your password.
$ celocli account:unlock --account $CELO_VALIDATOR_GROUP_ADDRESS
$ celocli account:unlock --account $CELO_VALIDATOR_ADDRESS
```

In a new tab, make a locked Gold account for both of your addresses by running the Celo CLI. This will allow you to stake Celo Gold, which is required to register a validator and validator groups:

```bash
$ celocli account:register --from $CELO_VALIDATOR_GROUP_ADDRESS --name <GROUP_NAME_OF_YOUR_CHOICE>
$ celocli account:register --from $CELO_VALIDATOR_ADDRESS --name <VALIDATOR_NAME_OF_YOUR_CHOICE>
```

#### Lock up Celo Gold

Make a locked Gold commitment for both accounts in order to secure the right to register a validator and validator group. The current requirement is 1 Celo Gold with a notice period of 60 days. If you choose to stake more gold, or a longer notice period, be sure to use those values below:

```bash
$ celocli lockedgold:lockup --from $CELO_VALIDATOR_GROUP_ADDRESS --goldAmount 1000000000000000000 --noticePeriod 5184000
$ celocli lockedgold:lockup --from $CELO_VALIDATOR_ADDRESS --goldAmount 1000000000000000000 --noticePeriod 5184000
```

### Run for election

In order to be elected as a validator, you will first need to register your group and validator and give them each an an ID, which people will know them by (e.g. `Awesome Validators Inc.` and `Alice's Awesome Validator`).

Register your validator group:

```bash
$ celocli validatorgroup:register --id <GROUP_ID_OF_YOUR_CHOICE> --from $CELO_VALIDATOR_GROUP_ADDRESS --noticePeriod 5184000
```

Register your validator:

```bash
$ celocli validator:register --id <VALIDATOR_ID_OF_YOUR_CHOICE> --from $CELO_VALIDATOR_ADDRESS --noticePeriod 5184000 --publicKey 0x`openssl rand -hex 64`$CELO_VALIDATOR_POP
```

{% hint style="info" %}
**Roadmap**: Note that the “publicKey” first part of the public key field is currently ignored, and thus can be set to any 128 character hex value. The rest is used for the BLS public key and proof-of-possession.
{% endhint %}

Affiliate your validator with your validator group. Note that you will not be a member of this group until the validator group accepts you:

```bash
$ celocli validator:affiliate --set $CELO_VALIDATOR_GROUP_ADDRESS --from $CELO_VALIDATOR_ADDRESS
```

Accept the affiliation:

```bash
$ celocli validatorgroup:member --accept $CELO_VALIDATOR_ADDRESS --from $CELO_VALIDATOR_GROUP_ADDRESS
```

Use both accounts to vote for your validator group:

```bash
$ celocli validatorgroup:vote --from $CELO_VALIDATOR_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS
$ celocli validatorgroup:vote --from $CELO_VALIDATOR_GROUP_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS
```

You’re all set! Note that elections are finalized at the end of each epoch, roughly once an hour in the Alfajores or Baklava Testnets. After that hour, if you get elected, your node will start participating BFT consensus and validating blocks.

You can inspect the current state of voting by running:

```bash
$ celocli validatorgroup:list
```

If you find your validator still not getting elected you may need to faucet yourself more funds and bond a greater deposit to command more voting weight!

At any moment you can check if you are validating running the following command:

```bash
TO BE DEFINED
```

You can de-affiliate a validator account of a validator group:

```bash
$ celocli validator:deaffiliate --from $CELO_VALIDATOR_ADDRESS
```

The rewards can be redeem running the following command:

```bash

```

{% hint style="info" %}
**Roadmap**: Different parameters will govern elections in a Celo production network. Epochs are likely to be daily, rather than hourly. Running a Validator will also include setting up proxy nodes to protect against DDoS attacks, and using hardware wallets to secure the key used to sign blocks. We plan to update these instructions with more details soon.
{% endhint %}
