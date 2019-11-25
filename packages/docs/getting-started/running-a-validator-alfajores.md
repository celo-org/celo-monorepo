# Running a Validator in Alfajores Network

- [Running a Validator in Alfajores Network](#running-a-validator-in-alfajores-network)
  - [Instructions](#instructions)
    - [Pull the Celo Docker image](#pull-the-celo-docker-image)
    - [Create accounts](#create-accounts)
    - [Deploy the Validator node](#deploy-the-validator-node)
    - [Running the Attestation Service](#running-the-attestation-service)

This section explains how to get a Validator node running on the Alfajores network, using a Docker image that was built for this purpose. Most of this process is the same as running a full node, but with a few additional steps.

This section is specific for Alfajores Network. You can find more details about running a Validator in different networks at [Running a Validator page](running-a-validator.md).

## Instructions

First we are going to setup the main environment variables related with the `Alfajores` network. Run:

```bash
export CELO_IMAGE=us.gcr.io/celo-testnet/celo-node:alfajores
export NETWORK_ID=44785
export URL_VERIFICATION_POOL=https://us-central1-celo-testnet-production.cloudfunctions.net/handleVerificationRequestalfajores/v0.1/sms/
```

### Pull the Celo Docker image

In all the commands we are going to see the `CELO_IMAGE` variable to refer to the right Docker image to use. Now we can get the Docker image:

```bash
docker pull $CELO_IMAGE
```

### Create accounts

Create and cd into the directory where you want to store the data and any other files needed to run your node. You can name this whatever you’d like, but here’s a default you can use:

```bash
mkdir celo-alfajores-dir
cd celo-alfajores-dir
```

Create two accounts, one for the Validator and one for Validator Group, and get their addresses if you don’t already have them. If you already have your accounts, you can skip this step.

To create your two accounts, run this command twice:

```bash
docker run -v $PWD:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account new"
```

It will prompt you for a passphrase, ask you to confirm it, and then will output your account address: `Address: {<YOUR-ACCOUNT-ADDRESS>}`

{% hint style="danger" %}
**Warning**: There is a known issue running geth inside Docker that happens eventually. So if that command fails, please check [this page](https://forum.celo.org/t/setting-up-a-validator-faq/90).
{% endhint %}

Let's save these addresses to environment variables, so that you can reference it later (don't include the braces):

```bash
export CELO_VALIDATOR_GROUP_ADDRESS=<YOUR-VALIDATOR-GROUP-ADDRESS>
export CELO_VALIDATOR_ADDRESS=<YOUR-VALIDATOR-ADDRESS>
```

In order to register the Validator later on, generate a "proof of possession" - a signature proving you know your Validator's BLS private key. Run this command:

```bash
docker run -v $PWD:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account proof-of-possession $CELO_VALIDATOR_ADDRESS"
```

It will prompt you for the passphrase you've chosen for the Validator account. Let's save the resulting proof-of-possession to an environment variable:

```bash
export CELO_VALIDATOR_POP=<YOUR-VALIDATOR-PROOF-OF-POSSESSION>
```

### Deploy the Validator node

Initialize the docker container, building from an image for the network and initializing Celo with the genesis block found inside the Docker image:

```bash
docker run -v $PWD:/root/.celo $CELO_IMAGE init /celo/genesis.json
```

To participate in consensus, we need to set up our nodekey for our account. We can do so via the following command \(it will prompt you for your passphrase\):

```bash
docker run -v $PWD:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account set-node-key $CELO_VALIDATOR_ADDRESS"
```

In order to allow the node to sync with the network, give it the address of existing nodes in the network:

```bash
docker run -v $PWD:/root/.celo --entrypoint cp $CELO_IMAGE /celo/static-nodes.json /root/.celo/
```

Start up the node:

```bash
docker run --name celo-validator --restart always -p 127.0.0.1:8545:8545 -p 127.0.0.1:8546:8546 -p 30303:30303 -p 30303:30303/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid 44785 --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal --maxpeers 1100 --mine --miner.verificationpool=$URL_VERIFICATION_POOL --etherbase $CELO_VALIDATOR_ADDRESS
```

{% hint style="danger" %}
**Security**: The command line above includes the parameter `--rpcaddr 0.0.0.0` which makes the Celo Blockchain software listen for incoming RPC requests on all the interfaces of the Docker container. Exercise extreme caution in doing this when running outside Docker, as it means that any unlocked accounts and their funds may be accessed from other machines on the Internet. In the context of running a Docker container on your local machine, this together with the `docker -p` flags allows you to make RPC calls from outside the container, i.e from your local host, but not from outside your machine. Read more about [Docker Networking](https://docs.docker.com/network/network-tutorial-standalone/#use-user-defined-bridge-networks) here.
{% endhint %}

The `mine` flag will tell geth to try participating in the BFT consensus protocol, which is analogous to mining on the Ethereum PoW network. It will not be allowed to validate until it gets elected -- so next we need to stand for election.

The `networkid` parameter value of `44785` indicates we are connecting the Alfajores Testnet.

### Running the Attestation Service

As part of the [lightweight identity protocol](/celo-codebase/protocol/identity), Validators are expected to run an [Attestation Service](https://github.com/celo-org/celo-monorepo/tree/master/packages/attestation-service) to provide attestations that allow users to map their phone number to an account on Celo.

You can find the complete instructions about how to run the [Attestation Service at the documentation page](running-attestation-service.md).

Now you may need to wait for your node to complete a full sync. You can check on the sync status with `celocli node:synced`. Your node will be fully synced when it has downloaded and processed the latest block, which you can see on the [Alfajores Testnet Stats](https://alfajores-ethstats.celo-testnet.org/) page.
