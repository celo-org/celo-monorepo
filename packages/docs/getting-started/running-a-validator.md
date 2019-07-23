# Running a Validator

This section explains how to get a validator node running on the network, using a Docker image that was built for this purpose. Most of this process is the same as running a full node, but with a few additional steps.

Validators help secure the Celo network by participating in Celo’s Proof of Stake protocol. Validators are organized into Validator Groups, analogous to parties in representative democracies. A validator group is essentially an ordered list of validators, along with metadata like name and URL.

Just as anyone in a democracy can create their own political party, or seek to get selected to represent a party in an election, any Celo user can create a validator group and add themselves to it, or set up a potential validator and work to get an existing validator group to include them.

While other Validator Groups will exist on the Alfajores Testnet, the fastest way to get up and running with a validator will be to register a Validator Group, register a Validator, and add that Validator to your Validator Group. The addresses used to register Validator Groups and Validators must be unique, which will require that you create two accounts in the step-by-step guide below.

{% hint style="info" %}
If you are starting up a validator, please consider leaving it running for a few weeks to support the network.
{% endhint %}

### **Prerequisites**

- **You have Docker installed.**

  If you don’t have it already, follow the instructions here: [Get Started with Docker](https://www.docker.com/get-started). It will involve creating or signing in with a Docker account, downloading a desktop app, and then launching the app to be able to use the Docker CLI. If you are running on a Linux server, follow the instructions for your distro [here](https://docs.docker.com/install/#server). You may be required to run Docker with sudo depending on your installation environment.

- **You have celocli installed.**

  See [Command Line Interface \(CLI\) ](../command-line-interface/introduction.md)for instructions on how to get set up.

- **You are using the latest Node 10.x LTS**

  Some users have reported issues using the most recent version of node. Use the LTS for greater reliability.

### **Create accounts**

Create and cd into the directory where you want to store the data and any other files needed to run your node. You can name this whatever you’d like, but here’s a default you can use:

```
$ mkdir celo-data-dir
$ cd celo-data-dir
```

Create two accounts, one for the Validator and one for Validator Group, and get their addresses if you don’t already have them. If you already have your accounts, you can skip this step.

To create your two accounts, run this command twice:

`` $ docker run -v `pwd`:/root/.celo -it us.gcr.io/celo-testnet/celo-node:alfajores account new ``

It will prompt you for a passphrase, ask you to confirm it, and then will output your account address: `Address: {<YOUR-ACCOUNT-ADDRESS>}`

Let's save these addresses to environment variables, so that you can reference it later:

```
$ export CELO_VALIDATOR_GROUP_ADDRESS=<YOUR-VALIDATOR-GROUP-ADDRESS>
$ export CELO_VALIDATOR_ADDRESS=<YOUR-VALIDATOR-ADDRESS>
```

### Deploy the validator node

Initialize the docker container, building from an image for the network and initializing Celo with the genesis block:

`` $ docker run -v `pwd`:/root/.celo us.gcr.io/celo-testnet/celo-node:alfajores init /celo/genesis.json ``

To participate in consensus, we need to set up our nodekey for our account. We can do so via the following command \(it will prompt you for your passphrase\):

`` $ docker run -it -v `pwd`:/root/.celo us.gcr.io/celo-testnet/celo-node:alfajores account set-node-key $CELO_VALIDATOR_ADDRESS ``

In order to allow the node to sync with the network, give it the address for the bootnode:

`` $ docker run -v `pwd`:/root/.celo --entrypoint cp us.gcr.io/celo-testnet/celo-node:alfajores /celo/static-nodes.json /root/.celo/ ``

Start up the node:

`` $ docker run -p 127.0.0.1:8545:8545 -p 127.0.0.1:8546:8546 -p 30303:30303 -p 30303:30303/udp -v `pwd`:/root/.celo us.gcr.io/celo-testnet/celo-node:alfajores --verbosity 3 --networkid 44781 --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal --maxpeers 1100 --mine --etherbase $CELO_VALIDATOR_ADDRESS ``

{% hint style="danger" %}
**Security**: The command line above includes the parameter `--rpcaddr 0.0.0.0` which makes the Celo Blockchain software listen for incoming RPC requests on all network adaptors. Exercise extreme caution in doing this when running outside Docker, as it means that any unlocked accounts and their funds may be accessed from other machines on the Internet. In the context of running a Docker container on your local machine, this together with the `docker -p` flags allows you to make RPC calls from outside the container, i.e from your local host, but not from outside your machine. Read more about [Docker Networking](https://docs.docker.com/network/network-tutorial-standalone/#use-user-defined-bridge-networks) here.
{% endhint %}

The `mine` flag does not mean the node starts mining blocks, but rather starts trying to participate in the BFT consensus protocol. It cannot do this until it gets elected -- so next we need to rig an election.

The `networkid` parameter value of `44781` indicates we are connecting the Alfajores Testnet.

### Set up deposits

Visit the [Alfajores Faucet](https://celo.org/build/faucet) to send **both** of your accounts some funds.

In a new tab, unlock your accounts so that you can send transactions:

```
$ celocli account:unlock --account $CELO_VALIDATOR_GROUP_ADDRESS --password <YOUR_FIRST_PASSWORD>
$ celocli account:unlock --account $CELO_VALIDATOR_ADDRESS --password <YOUR_SECOND_PASSWORD>
```

In a new tab, make a bonded deposits account for both of your addresses by running the Celo CLI. This will allow you to stake Celo Gold, which is required to register a validator and validator groups:

```
$ celocli bonds:register --from $CELO_VALIDATOR_GROUP_ADDRESS
$ celocli bonds:register --from $CELO_VALIDATOR_ADDRESS
```

Make a bonded deposit for both accounts in order to secure the right to register a validator and validator group. The current requirement is 1 Celo Gold with a notice period of 60 days. If you choose to stake more gold, or a longer notice period, be sure to use those values below:

```
$ celocli bonds:deposit --from $CELO_VALIDATOR_GROUP_ADDRESS --goldAmount 1000000000000000000 --noticePeriod 5184000
$ celocli bonds:deposit --from $CELO_VALIDATOR_ADDRESS --goldAmount 1000000000000000000 --noticePeriod 5184000
```

### Run for election

Register your validator group:

`$ celocli validatorgroup:register --id <GROUP_ID_OF_YOUR_CHOICE> --name <GROUP_NAME_OF_YOUR_CHOICE> --url <GROUP_URL_OF_YOUR_CHOICE> --from $CELO_VALIDATOR_GROUP_ADDRESS --noticePeriod 5184000`

Register your validator:

`` $ celocli validator:register --id <VALIDATOR_ID_OF_YOUR_CHOICE> --name <VALIDATOR_NAME_OF_YOUR_CHOICE> --url <VALIDATOR_URL_OF_YOUR_CHOICE> --from $CELO_VALIDATOR_ADDRESS --noticePeriod 5184000 --publicKey 0x`openssl rand -hex 64` ``

{% hint style="info" %}
**Roadmap**: Note that the “publicKey” field is currently ignored, and thus can be set to any 128 character hex value. This will change when the Celo protocol moves to BLS signatures for consensus.
{% endhint %}

Affiliate your validator with your validator group. Note that you will not be a member of this group until the validator group accepts you:

`$ celocli validator:affiliation --set $CELO_VALIDATOR_GROUP_ADDRESS --from $CELO_VALIDATOR_ADDRESS`

Accept the affiliation:

`$ celocli validatorgroup:member --accept $CELO_VALIDATOR_ADDRESS --from $CELO_VALIDATOR_GROUP_ADDRESS`

Use both accounts to vote for your validator group:

```
$ celocli validatorgroup:vote --from $CELO_VALIDATOR_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS
$ celocli validatorgroup:vote --from $CELO_VALIDATOR_GROUP_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS
```

You’re all set! Note that elections are finalized at the end of each epoch, roughly once an hour in the Alfajores Testnet. After that hour, if you get elected, your node will start participating BFT consensus and validating blocks.

You can inspect the current state of voting by running:

```text
$ celocli validatorgroup:list
```

If you find your validator still not getting elected you may need to faucet yourself more funds and bond a greater deposit to command more voting weight!

{% hint style="info" %}
**Roadmap**: Different parameters will govern elections in a Celo production network. Epochs are likely to be daily, rather than hourly. Running a Validator will also include setting up proxy nodes to protect against DDoS attacks, and using hardware wallets to secure the key used to sign blocks. We plan to update these instructions with more details soon.
{% endhint %}
