# Running a Validator

This section explains how to get a validator node running on the network, using a Docker image that was built for this purpose. Most of this process is the same as running a full node, but with a few additional steps.

Validators help secure the Celo network by participating in Celo’s Proof of Stake protocol. Validators are organized into Validator Groups, analogous to parties in representative democracies. A validator group is essentially an ordered list of validators, along with metadata like name and URL.

Just as anyone in a democracy can create their own political party, or seek to get selected to represent a party in an election, any Celo user can create a validator group and add themselves to it, or set up a potential validator and work to get an existing validator group to include them.

While other Validator Groups will exist on the Alfajores Testnet, the fastest way to get up and running with a validator will be to register a Validator Group, register a Validator, and add that Validator to your Validator Group. The addresses used to register Validator Groups and Validators must be unique, which will require that you create two accounts in the step-by-step guide below.

{% hint style="info" %}
If you are starting up a validator, please consider leaving it running for a few weeks to support the network.
{% endhint %}

## **Prerequisites**

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

## **Pull the Celo Docker image**

We're going to use a Docker image containing the Celo node software in this tutorial.

If you are re-running these instructions, the Celo Docker image may have been updated, and it's important to get the latest version.

Run:

```bash
docker pull us.gcr.io/celo-testnet/celo-node:alfajores`
```

## **Create accounts**

Create and cd into the directory where you want to store the data and any other files needed to run your node. You can name this whatever you’d like, but here’s a default you can use:

```bash
mkdir celo-data-dir
cd celo-data-dir
```

Create two accounts, one for the Validator and one for Validator Group, and get their addresses if you don’t already have them. If you already have your accounts, you can skip this step.

To create your two accounts, run this command twice:

```bash
docker run -v $PWD:/root/.celo --entrypoint /bin/sh -it us.gcr.io/celo-testnet/celo-node:alfajores -c "geth account new"
```

It will prompt you for a passphrase, ask you to confirm it, and then will output your account address: `Address: {<YOUR-ACCOUNT-ADDRESS>}`

Let's save these addresses to environment variables, so that you can reference it later (don't include the braces):

```bash
export CELO_VALIDATOR_GROUP_ADDRESS=<YOUR-VALIDATOR-GROUP-ADDRESS>
export CELO_VALIDATOR_ADDRESS=<YOUR-VALIDATOR-ADDRESS>
```

In order to register the validator later on, generate a "proof of possession" - a signature proving you know your validator's BLS private key. Run this command:

```bash
docker run -v $PWD:/root/.celo --entrypoint /bin/sh -it us.gcr.io/celo-testnet/celo-node:alfajores -c "geth account proof-of-possession $CELO_VALIDATOR_ADDRESS"
```

It will prompt you for the passphrase you've chosen for the validator account. Let's save the resulting proof-of-possession to an environment variable:

```bash
export CELO_VALIDATOR_POP=<YOUR-VALIDATOR-PROOF-OF-POSSESSION>
```

## Deploy the validator node

Initialize the docker container, building from an image for the network and initializing Celo with the genesis block:

```bash
docker run -v $PWD:/root/.celo us.gcr.io/celo-testnet/celo-node:alfajores init /celo/genesis.json
```

To participate in consensus, we need to set up our nodekey for our account. We can do so via the following command \(it will prompt you for your passphrase\):

```bash
docker run -v $PWD:/root/.celo --entrypoint /bin/sh -it us.gcr.io/celo-testnet/celo-node:alfajores -c "geth account set-node-key $CELO_VALIDATOR_ADDRESS"
```

In order to allow the node to sync with the network, give it the address of existing nodes in the network:

```bash
docker run -v $PWD:/root/.celo --entrypoint cp us.gcr.io/celo-testnet/celo-node:alfajores /celo/static-nodes.json /root/.celo/
```

Start up the node:

```bash
docker run -p 127.0.0.1:8545:8545 -p 127.0.0.1:8546:8546 -p 30303:30303 -p 30303:30303/udp -v $PWD:/root/.celo us.gcr.io/celo-testnet/celo-node:alfajores --verbosity 3 --networkid 44785 --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal --maxpeers 1100 --mine --miner.verificationpool=https://us-central1-celo-testnet-production.cloudfunctions.net/handleVerificationRequestalfajores/v0.1/sms/ --etherbase $CELO_VALIDATOR_ADDRESS
```

{% hint style="danger" %}
**Security**: The command line above includes the parameter `--rpcaddr 0.0.0.0` which makes the Celo Blockchain software listen for incoming RPC requests on all network adaptors. Exercise extreme caution in doing this when running outside Docker, as it means that any unlocked accounts and their funds may be accessed from other machines on the Internet. In the context of running a Docker container on your local machine, this together with the `docker -p` flags allows you to make RPC calls from outside the container, i.e from your local host, but not from outside your machine. Read more about [Docker Networking](https://docs.docker.com/network/network-tutorial-standalone/#use-user-defined-bridge-networks) here.
{% endhint %}

The `mine` flag will tell geth to try participating in the BFT consensus protocol, which is analogous to mining on the Ethereum PoW network. It will not be allowed to validate until it gets elected -- so next we need to stand for election.

The `networkid` parameter value of `44785` indicates we are connecting the Alfajores Testnet.

Now you may need to wait for your node to complete a full sync. You can check on the sync status with `celocli node:synced`. Your node will be fully synced when it has downloaded and processed the latest block, which you can see on the [Alfajores Testnet Stats](https://alfajores-ethstats.celo-testnet.org/) page.

## Obtain and lock up some Celo Gold for staking

Visit the [Alfajores Faucet](https://celo.org/build/faucet) to send **both** of your accounts some funds.

In a new tab, unlock your accounts so that you can send transactions. This only unlocks the accounts for the lifetime of the validator that's running, so be sure to unlock `$CELO_VALIDATOR_ADDRESS` again if your node gets restarted:

```bash
# You will be prompted for your password.
celocli account:unlock --account $CELO_VALIDATOR_GROUP_ADDRESS
celocli account:unlock --account $CELO_VALIDATOR_ADDRESS
```

In a new tab, make a locked Gold account for both of your addresses by running the Celo CLI. This will allow you to stake Celo Gold, which is required to register a validator and validator groups:

```bash
celocli account:register --from $CELO_VALIDATOR_GROUP_ADDRESS --name <GROUP_NAME_OF_YOUR_CHOICE>
celocli account:register --from $CELO_VALIDATOR_ADDRESS --name <VALIDATOR_NAME_OF_YOUR_CHOICE>
```

Make a locked Gold commitment for both accounts in order to secure the right to register a validator and validator group. The current requirement is 1 Celo Gold with a notice period of 60 days. If you choose to stake more gold, or a longer notice period, be sure to use those values below:

```bash
celocli lockedgold:lockup --from $CELO_VALIDATOR_GROUP_ADDRESS --goldAmount 1000000000000000000 --noticePeriod 5184000
celocli lockedgold:lockup --from $CELO_VALIDATOR_ADDRESS --goldAmount 1000000000000000000 --noticePeriod 5184000
```

## Run for election

In order to be elected as a validator, you will first need to register your group and validator and give them each an an ID, which people will know them by (e.g. `Awesome Validators Inc.` and `Alice's Awesome Validator`).

Register your validator group:

```bash
celocli validatorgroup:register --id <GROUP_ID_OF_YOUR_CHOICE> --from $CELO_VALIDATOR_GROUP_ADDRESS --noticePeriod 5184000
```

Register your validator:

```bash
celocli validator:register --id <VALIDATOR_ID_OF_YOUR_CHOICE> --from $CELO_VALIDATOR_ADDRESS --noticePeriod 5184000 --publicKey 0x`openssl rand -hex 64`$CELO_VALIDATOR_POP
```

{% hint style="info" %}
**Roadmap**: Note that the “publicKey” first part of the public key field is currently ignored, and thus can be set to any 128 character hex value. The rest is used for the BLS public key and proof-of-possession.
{% endhint %}

Affiliate your validator with your validator group. Note that you will not be a member of this group until the validator group accepts you:

```bash
celocli validator:affiliation --set $CELO_VALIDATOR_GROUP_ADDRESS --from $CELO_VALIDATOR_ADDRESS
```

Accept the affiliation:

```bash
celocli validatorgroup:member --accept $CELO_VALIDATOR_ADDRESS --from $CELO_VALIDATOR_GROUP_ADDRESS
```

Use both accounts to vote for your validator group:

```bash
celocli validatorgroup:vote --from $CELO_VALIDATOR_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS
celocli validatorgroup:vote --from $CELO_VALIDATOR_GROUP_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS
```

You’re all set! Note that elections are finalized at the end of each epoch, roughly once an hour in the Alfajores Testnet. After that hour, if you get elected, your node will start participating BFT consensus and validating blocks.

You can inspect the current state of voting by running:

```bash
celocli validatorgroup:list
```

If you find your validator still not getting elected you may need to faucet yourself more funds and bond a greater deposit to command more voting weight!

{% hint style="info" %}
**Roadmap**: Different parameters will govern elections in a Celo production network. Epochs are likely to be daily, rather than hourly. Running a Validator will also include setting up proxy nodes to protect against DDoS attacks, and using hardware wallets to secure the key used to sign blocks. We plan to update these instructions with more details soon.
{% endhint %}
