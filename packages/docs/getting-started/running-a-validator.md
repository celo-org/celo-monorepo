# Running a Validator

- [Running a Validator](#running-a-validator)
  - [Prerequisites](#prerequisites)
    - [Hardware requirements](#hardware-requirements)
    - [Software requirements](#software-requirements)
  - [Celo Networks](#celo-networks)
    - [Obtain and lock up some Celo Gold for staking](#obtain-and-lock-up-some-celo-gold-for-staking)
      - [Baklava](#baklava)
      - [Alfajores](#alfajores)
      - [Lock up Celo Gold](#lock-up-celo-gold)
    - [Run for election](#run-for-election)

This section explains how to get a Validator node running on the network, using a Docker image that was built for this purpose. Most of this process is the same as running a full node, but with a few additional steps.

Validators help secure the Celo network by participating in Celo’s Proof of Stake protocol. Validators are organized into Validator Groups, analogous to parties in representative democracies. A Validator Group is essentially an ordered list of Validators, along with metadata like name and URL.

Just as anyone in a democracy can create their own political party, or seek to get selected to represent a party in an election, any Celo user can create a Validator group and add themselves to it, or set up a potential Validator and work to get an existing Validator group to include them.

While other Validator Groups will exist on the Celo Networks, the fastest way to get up and running with a Validator will be to register a Validator Group, register a Validator, and add that Validator to your Validator Group. The addresses used to register Validator Groups and Validators must be unique, which will require that you create two accounts in the step-by-step guide below.

You can find more details about Celo mission and why becoming a Validator [at the following page](https://medium.com/celohq/calling-all-chefs-become-a-celo-validator-c75d1c2909aa).

{% hint style="info" %}
If you are starting up a Validator, please consider leaving it running for a few weeks to support the network.
{% endhint %}

## Prerequisites

### Hardware requirements

Because Celo network is based in Proof of Stake, the hardware requirements are not very high. Proof of Stake consensus is not so CPU intensive as Proof of Work but has a higher requirements of network connectivity and latency. Here you have a list of the standard requirements for running a Validator node:

- Memory: 8 GB RAM
- CPU: Quad core 3GHz (64-bit)
- Disk: 256 GB of SSD storage
- Network: At least 1 GB input/output dual Ethernet

It is recommended to run the Validator node in an environment that facilitates a 24/7 execution. Deployments in a top-tier datacenter facilitates the security and better uptimes.

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

Celo provides different networks for different purposes. You can find the specifics about how to run a Validator in the Celo networks in the following documentation pages:

- [Running a Validator in Baklava Network](running-a-validator-baklava.md)
- [Running a Validator in Alfajores Network](running-a-validator-alfajores.md)

In this documentation pages we're going to use a Docker image containing the Celo node software.

You can use also this [reference script](../../../scripts/run-docker-validator-network.sh) for running the Celo validator stack using Docker containers.

### Obtain and lock up some Celo Gold for staking

#### Baklava

To participate in The Great Celo Stake Off (aka TGCSO) and get fauceted it's necessary to register online via an [online form](https://docs.google.com/forms/d/e/1FAIpQLSfbn5hTJ4UIWpN92-o2qMTUB0UnrFsL0fm97XqGe4VhhN_r5A/viewform).

#### Alfajores

Visit the [Alfajores Celo Faucet](https://celo.org/build/faucet) to send **both** of your accounts some funds.

In a new tab, unlock your accounts so that you can send transactions. This only unlocks the accounts for the lifetime of the Validator that's running, so be sure to unlock `$CELO_VALIDATOR_ADDRESS` again if your node gets restarted:

```bash
# You will be prompted for your password.
celocli account:unlock --account $CELO_VALIDATOR_GROUP_ADDRESS
celocli account:unlock --account $CELO_VALIDATOR_ADDRESS
```

In a new tab, make a locked Gold account for both of your addresses by running the Celo CLI. This will allow you to stake Celo Gold, which is required to register a Validator and Validator Groups:

```bash
celocli account:register --from $CELO_VALIDATOR_GROUP_ADDRESS --name <GROUP_NAME_OF_YOUR_CHOICE>
celocli account:register --from $CELO_VALIDATOR_ADDRESS --name <VALIDATOR_NAME_OF_YOUR_CHOICE>
```

#### Lock up Celo Gold

Lock up Celo Gold for both accounts in order to secure the right to register a Validator and Validator Group. The current requirement is 10k Celo Gold to register a validator, and 10k Celo Gold _per member validator_ to register a Validator Group. For Validators, this gold remains locked for approximately 60 days following deregistration. For groups, this gold remains locked for approximately 60 days following the removal of the Nth validator from the group.

```bash
celocli lockedgold:lock --from $CELO_VALIDATOR_GROUP_ADDRESS --value 10000000000000000000000
celocli lockedgold:lock --from $CELO_VALIDATOR_ADDRESS --value 10000000000000000000000
```

### Run for election

In order to be elected as a Validator, you will first need to register your group and Validator. Note that when registering a Validator Group, you need to specify a commission, which is the fraction of epoch rewards paid to the group by its members.

Register your Validator Group:

```bash
celocli validatorgroup:register --from $CELO_VALIDATOR_GROUP_ADDRESS --commission 0.1
```

Register your Validator:

```bash
celocli validator:register --from $CELO_VALIDATOR_ADDRESS --blsKey $CELO_VALIDATOR_BLS_PUBLIC_KEY --blsPop $CELO_VALIDATOR_BLS_SIGNATURE
```

Affiliate your Validator with your Validator Group. Note that you will not be a member of this group until the Validator Group accepts you:

```bash
celocli validator:affiliate $CELO_VALIDATOR_GROUP_ADDRESS --from $CELO_VALIDATOR_ADDRESS
```

Accept the affiliation:

```bash
celocli validatorgroup:member --accept $CELO_VALIDATOR_ADDRESS --from $CELO_VALIDATOR_GROUP_ADDRESS
```

Use both accounts to vote for your Validator Group:

```bash
celocli election:vote --from $CELO_VALIDATOR_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS --value 10000000000000000000000
celocli election:vote --from $CELO_VALIDATOR_GROUP_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS --value 10000000000000000000000
```

You’re all set! Note that elections are finalized at the end of each epoch, roughly once an hour in the Alfajores or Baklava Testnets. After that hour, if you get elected, your node will start participating BFT consensus and validating blocks.

You can inspect the current state of voting by running:

```bash
celocli election:list
```

If you find your Validator still not getting elected you may need to faucet yourself more funds and lock more gold in order to be able to cast more votes for your Validator Group!

At any moment you can check the currently elected validators by running the following command:

```bash
celocli election:current
```

### Stop Validating

If for some reason you need to stop running your Validator, please do one or all of the following so that it will no longer be chosen as a participant in BFT:

- Deregister your validator:

```bash
celocli validator:deaffiliate --from $CELO_VALIDATOR_ADDRESS
celocli validator:deregister --from $CELO_VALIDATOR_ADDRESS
```

- Stop voting for your validator group:

```bash
celocli election:revoke --from $CELO_VALIDATOR_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS --value 10000000000000000000000
celocli election:revoke --from $CELO_VALIDATOR_GROUP_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS --value 10000000000000000000000
```

- Deregister your validator group:

```bash
celocli validatorgroup:deregister --from $CELO_VALIDATOR_GORUP_ADDRESS
```

{% hint style="info" %}
**Roadmap**: Different parameters will govern elections in a Celo production network. Epochs are likely to be daily, rather than hourly. Running a Validator will also include setting up proxy nodes to protect against DDoS attacks, and using hardware wallets to secure the key used to sign blocks. We plan to update these instructions with more details soon.
{% endhint %}
