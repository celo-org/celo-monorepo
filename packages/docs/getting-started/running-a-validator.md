# Running a Validator

- [Running a Validator](#running-a-validator)
  - [Prerequisites](#prerequisites)
    - [Hardware requirements](#hardware-requirements)
    - [Software requirements](#software-requirements)
  - [Setup Instructions](#instructions)
    - [Environment variables](#environment-variables)
    - [Pull the Celo Docker image](#pull-the-celo-docker-image)
    - [Create accounts](#create-accounts)
    - [Deploy the Validator and Proxy nodes](#deploy-the-validator-and-proxy-nodes)
      - [Running the Proxy](#running-the-proxy)
      - [Running the Validator](#running-the-validator)
    - [Running the Attestation Service](#running-the-attestation-service)
    - [Stop the containers](#stop-the-containers)
  - [Get elected as validator](#get-elected-as-validator)
    - [Running the Docker containers in the background](#running-the-docker-containers-in-the-background)
    - [Reference Script](#reference-script)
    - [Obtain and lock up some Celo Gold for staking](#obtain-and-lock-up-some-celo-gold-for-staking)
    - [Lock up Celo Gold](#lock-up-celo-gold)
    - [Run for election](#run-for-election)
    - [Stop Validating](#stop-validating)

This section explains how to get a Validator node running on the network, using the same docker image used for running a full node.

Validators help secure the Celo network by participating in Celo’s Proof of Stake protocol. Validators are organized into Validator Groups, analogous to parties in representative democracies. A Validator Group is essentially an ordered list of Validators.

Just as anyone in a democracy can create their own political party, or seek to get selected to represent a party in an election, any Celo user can create a Validator group and add themselves to it, or set up a potential Validator and work to get an existing Validator group to include them.

While other Validator Groups will exist on the Celo Networks, the fastest way to get up and running with a Validator will be to register a Validator Group, register a Validator, and add that Validator to your Validator Group. The addresses used to register Validator Groups and Validators must be unique, which will require that you create two accounts in the step-by-step guide below.

Because of the importance of Validator security and availability, Validators are expected to run one or more additional "proxy" nodes. In this setup, the proxy node connects with the rest of the network, and the machine running the Validator communicates only with the proxy, ideally via a private network.

Additionally, Validators are expected to run an [Attestation Service](https://github.com/celo-org/celo-monorepo/tree/master/packages/attestation-service) as part of the [lightweight identity protocol](/celo-codebase/protocol/identity), to provide attestations that allow users to map their phone number to a Celo address.

You can find more details about Celo mission and why to become a Validator [at the following page](https://medium.com/celohq/calling-all-chefs-become-a-celo-validator-c75d1c2909aa).

{% hint style="info" %}
If you are starting up a Validator, please consider leaving it running for a few weeks to support the network.
{% endhint %}

## Prerequisites

### Hardware requirements

Celo is a Proof of Stake network, which has different hardware requirements than a Proof of Work network. Proof of Stake consensus is less CPU intensive, but has higher network connectivity and latency requirements. Below is a list of standard requirements for running a Validator node on the Celo Network:

- Memory: 8 GB RAM
- CPU: Quad core 3GHz (64-bit)
- Disk: 256 GB of SSD storage
- Network: At least 1 GB input/output dual Ethernet

The recommended Celo Validator setup involves continually running three nodes on three separate machines:

- 1 Validator node in a highly secure environment like a top-tier datacenter with 24/7 execution
- 1 Validator Proxy node, in a highly available, environment, but with lesser security requirements
- 1 Attestation node that runs the Attestation service and signs attestations, which can be a light node, and thus has lower requirements

### Software requirements

- **You have Docker installed.**

  If you don’t have it already, follow the instructions here: [Get Started with Docker](https://www.docker.com/get-started). It will involve creating or signing in with a Docker account, downloading a desktop app, and then launching the app to be able to use the Docker CLI. If you are running on a Linux server, follow the instructions for your distro [here](https://docs.docker.com/install/#server). You may be required to run Docker with sudo depending on your installation environment.
  You can check you have Docker installed and running if the command `docker info` works properly.

- **You have celocli installed.**

  See [Command Line Interface \(CLI\) ](../command-line-interface/introduction.md)for instructions on how to get set up.

- **You are using the latest Node 10.x LTS**

  Some users have reported issues using the most recent version of node. Use the LTS for greater reliability.

{% hint style="info" %}
A note about conventions:
The code you'll see on this page is bash commands and their output.

When you see text in angle brackets &lt;&gt;, replace them and the text inside with your own value of what it refers to. Don't include the &lt;&gt; in the command.
{% endhint %}

## Instructions

### Key Management

Private keys are the central primitive of any cryptographic system and need to be handled with extreme care. Loss of your private key can lead to irreversible loss of value.

#### Unlocking

Celo nodes store private keys encrypted on disk with a password, and need to be "unlocked" before use. Private keys can be unlocked in two ways:

1.  By running the `celocli account:unlock` command. Note that the node must have the "personal" RPC API enabled in order for this command to work.
2.  By setting the `--unlock` flag when starting the node.

It is important to note that when a key is unlocked you need to be particularly careful about enabling access to the node's RPC APIs.

#### Account and Signer keys

Running a Celo Validator node requires the management of several different keys, each with different privileges. Keys that need to be accessed frequently (e.g. for signing blocks) are at greater risk of being compromised, and thus have more limited permissions, while keys that need to be accessed infrequently (e.g. for locking Celo Gold) are less onerous to store securely, and thus have more expansive permissions. Below is a summary of the various keys that are used in the Celo network, and a description of their permissions.

| Name of the key        | Purpose                                                                                                                                                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account key            | This is the key with the highest level of permissions, and is thus the most sensitive. It can be used to lock and unlock Celo Gold, and authorize vote, validator, and attestation keys. Note that the account key also has all of the permissions of the other keys. |  |
| Validator signer key   | This is the key that has permission to register and manage a Validator or Validator Group, and participate in BFT consensus.                                                                                                                                          |  |
| Vote signer key        | This key can be used to vote in Validator elections and on-chain governance.                                                                                                                                                                                          |  |
| Attestation signer key | This key is used to sign attestations in Celo's lightweight identity protocol.                                                                                                                                                                                        |  |

Note that account and signer keys must be unique and may not be reused.

### Environment variables

| Variable                      | Explanation                                                               |
| ----------------------------- | ------------------------------------------------------------------------- |
| CELO_IMAGE                    | The Docker image used for the Validator and Proxy containers              |  |
| NETWORK_ID                    | The Celo Baklava network chain ID                                         |  |
| CELO_VALIDATOR_GROUP_ADDRESS  | The account address for the Validator Group                               |  |
| CELO_VALIDATOR_ADDRESS        | The account address for the Validator                                     |  |
| CELO_VALIDATOR_SIGNER_ADDRESS | The address of the validator signer authorized by the validator account   |  |
| CELO_VALIDATOR_SIGNER_POP     | The proof-of-possession of the validator signer key                       |  |
| CELO_VALIDATOR_BLS_PUBLIC_KEY | The BLS public key for the Validator instance                             |  |
| CELO_VALIDATOR_BLS_SIGNATURE  | A proof-of-possession of the BLS public key                               |  |
| PROXY_ENODE                   | The enode address for the Validator proxy                                 |  |
| PROXY_IP                      | The Proxy container internal IP address from docker pool address          |  |
| ATTESTATION_SIGNER_ADDRESS    | The address of the attestation signer authorized by the validator account |  |
| ATTESTATION_SIGNER_POP        | The proof-of-possession of the attestation signer key                     |  |
| ATTESTATION_SERVICE_URL       | The URL to access the deployed Attestation Service                        |  |
| METADATA_URL                  | The URL to access the metadata file for your Attestation Service          |  |

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

### Create the Validator and Validator Group accounts

First, you'll need to generate account keys for your Validator and Validator Group. These are the keys that will have access to your locked Celo Gold, and thus should be handled with care. For the purposes of this guide, we will be storing these keys on your local machine, but we recommend that you store then in a more secure manner.

```bash
# On your local machine
mkdir -p celo-data-dir/accounts
cd celo-data-dir/accounts
docker run -v $PWD/accounts:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account new"
docker run -v $PWD/accounts:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account new"
```

This should generate two accounts in your current directory and print them out, set them in an environment variables:

```bash
# On your local machine
export CELO_VALIDATOR_GROUP_ADDRESS=<YOUR-VALIDATOR-GROUP-ADDRESS>
export CELO_VALIDATOR_ADDRESS=<YOUR-VALIDATOR-ADDRESS>
```

Next, we'll run a node on your local machine so that we can use these accounts to lock Celo Gold and authorize the keys needed to run your validator. To do this, we need to run the following commands, which fetch the genesis block and a list of other nodes in the network to connect to.

```bash
# On your local machine
docker run -v $PWD/accounts:/root/.celo $CELO_IMAGE init /celo/genesis.json
docker run -v $PWD/accounts:/root/.celo --entrypoint cp $CELO_IMAGE /celo/static-nodes.json /root/.celo/
```

To run the node:

```bash
# On your local machine
docker run --name celo-accounts -d --restart always -p 8545:8545 -v $PWD/accounts:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal
```

### Obtain and lock up some Celo Gold for staking

To participate in The Great Celo Stake Off (aka TGCSO) and get fauceted it's necessary to register online via an [online form](https://docs.google.com/forms/d/e/1FAIpQLSfbn5hTJ4UIWpN92-o2qMTUB0UnrFsL0fm97XqGe4VhhN_r5A/viewform). While you wait, let's deploy the remaining components:

### Deploy a Validator

To actually register as a validator, we'll need to generate a validating signer key. On your Validator machine (which should not be accessible from the public internet), follow very similar steps:

```bash
# On the validator machine
mkdir -p celo-data-dir/validator
cd celo-data-dir/validator
docker run -v $PWD/validator:/root/.celo $CELO_IMAGE init /celo/genesis.json
docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account new"
export CELO_VALIDATOR_SIGNER_ADDRESS=<YOUR-VALIDATOR-SIGNER-ADDRESS>
```

In order to authorize our Validator signer, we need to create a proof that we have possession of the corresponding private key. We do so by signing a message that consists of the Validator account address. To generate the proof-of-possession, run the following command:

```bash
# On the validator machine
# Note that you have to export CELO_VALIDATOR_ADDRESS on this machine
export $CELO_VALIDATOR_ADDRESS=<CELO_VALIDATOR_ADDRESS>
docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account proof-of-possession $CELO_VALIDATOR_SIGNER_ADDRESS $CELO_VALIDATOR_ADDRESS"
```

Validators on the Celo network use BLS aggregated signatures to create blocks in addition to the Validator signer (ECDSA) key. While an independent BLS key can be specified, the simplest thing to do is to derive the BLS key from the Validator signer key. When we register our Validator, we'll need to prove possession of the BLS key as well, which can be done by running the following command:

```bash
# On the validator machine
docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account proof-of-possession $CELO_VALIDATOR_SIGNER_ADDRESS $CELO_VALIDATOR_ADDRESS --bls"
```

It will prompt you for the passphrase you've chosen for the Validator signer key. Let's save the resulting proof-of-possession to three environment variables:

```bash
# On your local machine
export CELO_VALIDATOR_SIGNER_POP=<YOUR-VALIDATOR-SIGNER-POP>
export CELO_VALIDATOR_BLS_PUBLIC_KEY=<YOUR-VALIDATOR-BLS-PUBLIC-KEY>
export CELO_VALIDATOR_BLS_SIGNATURE=<YOUR-VALIDATOR-BLS-SIGNATURE>
```

We'll get back to this machine later, but for now, let's give it a proxy.

### Deploy a proxy

To avoid exposing the validator to the public internet, we are deploying a proxy node which is responsible to communicate with the network. On our Proxy machine, we'll setup the node as per usual now:

```bash
# On the proxy machine
mkdir -p celo-data-dir/proxy
cd celo-data-dir/proxy
docker run -v $PWD/proxy:/root/.celo $CELO_IMAGE init /celo/genesis.json
docker run -v $PWD/proxy:/root/.celo --entrypoint cp $CELO_IMAGE /celo/static-nodes.json /root/.celo/
```

You can then run the proxy with

```bash
# On the proxy machine
# Note that you'll have to export CELO_VALIDATOR_SIGNER_ADDRESS on this machine
docker run --name celo-proxy -d --restart always -p 30313:30303 -p 30313:30303/udp -p 30503:30503 -p 30503:30503/udp -v $PWD/proxy:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_SIGNER_ADDRESS --proxy.internalendpoint :30503
```

Once the proxy is running, we will need to retrieve it's enode so that the validator will be able to connect to it.

```bash
# On the proxy machine, retrieve the proxy enode
echo $(docker exec celo-proxy geth --exec "admin.nodeInfo['enode'].split('//')[1].split('@')[0]" attach | tr -d '"')
```

Now we need to set the proxy enode and proxy IP address in environment variables on the validator machine.

```bash
# On the validator machine
export PROXY_ENODE=<proxy enode>
export PROXY_IP=<proxy ip address>
```

Let's connect the validator to the proxy:

### Connect the Validator to the Proxy

When starting up your validator, it will attempt to create a network connection between the validator machine and the proxy machine. You will need make sure that your proxy machine has the appropriate firewall settings to allow the validator to connect to it.

Specifically, on the proxy machine, port 30303 should allow TCP and UDP connections from all IP addresses. And port 30503 should allow TCP connections from the IP address of your validator machine.

Once that it completed, go ahead and run the validator.

```bash
# On the validator machine
docker run -v $PWD/validator:/root/.celo --entrypoint sh --rm $CELO_IMAGE -c "echo VALIDATOR_SIGNER_PASSWORD > /root/.celo/.password"
docker run --name celo-validator -d --restart always -p 30303:30303 -p 30303:30303/udp -v $PWD/validator:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --mine --istanbul.blockperiod=5 --istanbul.requesttimeout=3000 --etherbase $CELO_VALIDATOR_ADDRESS --nodiscover --proxy.proxied --proxy.proxyenodeurlpair=enode://$PROXY_ENODE@$PROXY_IP:30503\;enode://$PROXY_ENODE@$PROXY_IP:30303  --unlock=$CELO_VALIDATOR_SIGNER_ADDRESS --password /root/.celo/.password
```

The `mine` flag does not mean the node starts mining blocks, but rather starts trying to participate in the BFT consensus protocol. It cannot do this until it gets elected -- so next we need to stand for election.

The `networkid` parameter value of `1101` indicates we are connecting the Baklava Beta network.

### Register the Accounts

By now 12,000 Celo Gold should have been sent to your Validator and Validator Group account addresses. This will allow you to submit transactions to the network via the `celocli`. To do so, you'll need to have a running node with access to the account keys. Start one by running the following commands on your local machine:

```bash
# On your local machine
docker run -v $PWD/accounts:/root/.celo $CELO_IMAGE init /celo/genesis.json
docker run -v $PWD/accounts:/root/.celo --entrypoint cp $CELO_IMAGE /celo/static-nodes.json /root/.celo/
docker run --name celo-accounts -d --restart always -p 8545:8545 -v $PWD/accounts:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal
```

Once the node is synced, we can register our accounts:

```bash
# On your local machine
celocli accounts:register --from $CELO_VALIDATOR_GROUP_ADDRESS --name <NAME YOUR VALIDATOR GROUP>
celocli accounts:register --from $CELO_VALIDATOR_ADDRESS --name <NAME YOUR VALIDATOR>
```

### Lock up Celo Gold

Lock up Celo Gold for both accounts in order to secure the right to register a Validator and Validator Group. The current requirement is 10k Celo Gold to register a validator, and 10k Celo Gold _per member validator_ to register a Validator Group. For Validators, this gold remains locked for approximately 60 days following deregistration. For groups, this gold remains locked for approximately 60 days following the removal of the Nth validator from the group.

```bash
# On your local machine
celocli lockedgold:lock --from $CELO_VALIDATOR_GROUP_ADDRESS --value 10000000000000000000000
celocli lockedgold:lock --from $CELO_VALIDATOR_ADDRESS --value 10000000000000000000000
```

### Run for election

In order to be elected as a Validator, you will first need to register your group and Validator. Note that when registering a Validator Group, you need to specify a commission, which is the fraction of epoch rewards paid to the group by its members.

We don't want to use our account key for validating, so first let's authorize the validator signing key:

```bash
# On your local machine
celocli account:authorize --from $CELO_VALIDATOR_ADDRESS --role validator --pop $CELO_VALIDATOR_SIGNER_POP --signer $CELO_VALIDATOR_SIGNER_ADDRESS
```

Register your Validator Group by running the following command. Note that because we did not authorize a Validator signer for our Validator Group account, we register the Validator Group with the account key.

```bash
# On your local machine
celocli validatorgroup:register --from $CELO_VALIDATOR_GROUP_ADDRESS --commission 0.1
```

Next, register your Validator by running the following command. Note that because we have authorized a Validator signer, this step could also be performed on the Validator machine. Running it on the local machine allows us to avoid needing to install the celocli on the Validator machine.

```bash
# On your local machine
celocli validator:register --from $CELO_VALIDATOR_ADDRESS --blsKey $CELO_VALIDATOR_BLS_PUBLIC_KEY --blsPop $CELO_VALIDATOR_BLS_SIGNATURE
```

Affiliate your Validator with your Validator Group. Note that you will not be a member of this group until the Validator Group accepts you. This command could also be run from the Validator signer, if running on the validator machine.

```bash
# On your local machine
celocli validator:affiliate $CELO_VALIDATOR_GROUP_ADDRESS --from $CELO_VALIDATOR_ADDRESS
```

Accept the affiliation:

```bash
# On your local machine
celocli validatorgroup:member --accept $CELO_VALIDATOR_ADDRESS --from $CELO_VALIDATOR_GROUP_ADDRESS
```

Use both accounts to vote for your Validator Group. Note that because we have not authorized a vote signer for either account, these transactions must be sent from the account keys. Since you're likely to need to place additional votes throughout the course of the stake-off, consider creating and authorizing vote signers for additional operational security.

```bash
# On your local machine
celocli election:vote --from $CELO_VALIDATOR_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS --value 10000000000000000000000
celocli election:vote --from $CELO_VALIDATOR_GROUP_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS --value 10000000000000000000000
```

You’re all set! Note that elections are finalized at the end of each epoch, roughly once an hour in the Alfajores or Baklava Testnets. After that hour, if you get elected, your node will start participating BFT consensus and validating blocks.

You can inspect the current state of the validator elections by running:

```bash
# On your local machine
celocli election:list
```

If you find your Validator still not getting elected you may need to faucet yourself more funds and lock more gold in order to be able to cast more votes for your Validator Group!

At any moment you can check the currently elected validators by running the following command:

```bash
# On your local machine
celocli election:current
```

### Running the Attestation Service

As part of the [lightweight identity protocol](/celo-codebase/protocol/identity), Validators are expected to run an [Attestation Service](https://github.com/celo-org/celo-monorepo/tree/master/packages/attestation-service) to provide attestations that allow users to map their phone number to an account on Celo.

Just like with the Validator signer, we'll want to authorize a separate Attestation signer. For that let's start our node on the Attestations machine:

```bash
# On the Attestation machine
# You have to export CELO_VALIDATOR_ADDRESS on this machine
export $CELO_VALIDATOR_ADDRESS=<CELO_VALIDATOR_ADDRESS>
mkdir -p celo-data-dir/attestations
cd celo-data-dir/attestations
docker run -v $PWD/attestations:/root/.celo $CELO_IMAGE init /celo/genesis.json
docker run -v $PWD/attestations:/root/.celo --entrypoint cp $CELO_IMAGE /celo/static-nodes.json /root/.celo/
docker run -v $PWD/attestations:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account new"
export ATTESTATION_SIGNER_ADDRESS=<YOUR-ATTESTATION-SIGNER-ADDRESS>
```

Let's generate the proof-of-possession for the attestation signer

```bash
# On the Attestation machine
# Note that you have to export CELO_VALIDATOR_ADDRESS on this machine
export $CELO_VALIDATOR_ADDRESS=<CELO_VALIDATOR_ADDRESS>
docker run -v $PWD/attestations:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account proof-of-possession $CELO_ATTESTATION_SIGNER_ADDRESS $CELO_VALIDATOR_ADDRESS"
```

With this proof, authorize the attestation signer on your local machine:

```bash
# On your local machine
celocli account:authorize --from $CELO_VALIDATOR_ADDRESS --role attestation --pop <ATTESTATION_SIGNER_POP> --signer $ATTESTATION_SIGNER_ADDRESS
```

You can now run the node for the attestation service in the background:

```bash
# On the Attestation machine
docker run --name celo-attestations -d --restart always -p 8545:8545 -v $PWD/accounts:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin --unlock $ATTESTATION_SIGNER_ADDRESS
```

By now, you should have setup your Validator account appropriately. You can finish the actual deploy of the attestation service under the [Attestation Service at the documentation page](running-attestation-service.md).

### Stop the containers

You can stop the Docker containers at any time without problem. If you stop your containers that means those containers stop of providing service.
The data dir of the validator and the proxy are Docker volumes mounted in the containers from the `celo-data-dir` you created at the very beginning. So if you don't remove that folder, you can stop or restart the containers without losing any data.

You can stop the `celo-validator` and `celo-proxy` containers running:

```bash
docker stop celo-validator celo-proxy
```

And you can remove the containers (not the data dir) running:

```bash
docker rm -f celo-validator celo-proxy
```

### Running the Docker containers in the background

There are different option for executing Docker containers in the background. The most typical one is to use in your docker run commands the `-d` option. Also for long running processes, specially when you run in a remote computer, you can use a tool like [screen](https://ss64.com/osx/screen.html). It allows to connect and disconnect from running processes providing an easy way to manage long run processes.

It's out of the scope of this documentation to go through the `screen` options, but you can use the following command format with your `docker` commands:

```bash
screen -S <SESSION NAME> -d -m <YOUR COMMAND>
```

For example:

```bash
screen -S celo-validator -d -m docker run --name celo-validator --restart always -p 127.0.0.1:8545:8545 .......
```

You can list your existing `screen` sessions:

```bash
screen -ls
```

And re-atach to any of the existing sessions:

```bash
screen -r -S celo-validator
```

### Reference Script

You can use (and modify if you want) this [reference bash script](../../../scripts/run-docker-validator-network.sh) automating all the above steps. It requires Docker and screen.

You can see all the options using the following command:

```bash
./run-docker-validator-network.sh help
```

## Stop Validating

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
You’re all set! Note that elections are finalized at the end of each epoch, roughly once an hour in the Baklava Testnet. After that hour, if you get elected, your node will start participating BFT consensus and validating blocks. Users requesting attestations will hit your registered Attestation Service.
{% endhint %}

{% hint style="info" %}
**Roadmap**: Different parameters will govern elections in a Celo production network. Epochs are likely to be daily, rather than hourly. Running a Validator will also include setting up proxy nodes to protect against DDoS attacks, and using hardware wallets to secure the key used to sign blocks. We plan to update these instructions with more details soon.
{% endhint %}
