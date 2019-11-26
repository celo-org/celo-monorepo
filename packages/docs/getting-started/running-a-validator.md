# Running a Validator

- [Running a Validator](#running-a-validator)
  - [Prerequisites](#prerequisites)
    - [Hardware requirements](#hardware-requirements)
    - [Software requirements](#software-requirements)
  - [Instructions](#instructions)
    - [Environment variables](#environment-variables)
    - [Pull the Celo Docker image](#pull-the-celo-docker-image)
    - [Create accounts](#create-accounts)
    - [Deploy the Validator and Proxy nodes](#deploy-the-validator-and-proxy-nodes)
      - [Running the Proxy](#running-the-proxy)
      - [Running the Validator](#running-the-validator)
    - [Running the Attestation Service](#running-the-attestation-service)
    - [Stop the containers](#stop-the-containers)
    - [Running the Docker containers in the background](#running-the-docker-containers-in-the-background)
    - [Reference Script](#reference-script)
    - [Obtain and lock up some Celo Gold for staking](#obtain-and-lock-up-some-celo-gold-for-staking)
    - [Lock up Celo Gold](#lock-up-celo-gold)
    - [Run for election](#run-for-election)
    - [Stop Validating](#stop-validating)

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

This section explains how to get a Validator node running on the Baklava network, using a Docker image that was built for this purpose. Most of this process is the same as running a full node, but with a few additional steps.

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

We are going to need to create 4 accounts, 2 for the Validator, 1 for the Proxy and the last one for the Attestation Service. For the Attestation Service the steps are described [this page](running-attestation-service.md##accounts-configuration).

First we create three accounts, one for the Validator, one for the Validator Group and the last one for the Proxy. You can generate their addresses using the below commands if you don’t already have them. If you already have some accounts, you can skip this step.

To create the accounts needed, run the following commands. The first two blocks create the accounts for the Validator, the third one for the Proxy. Also we save these addresses to environment variables, so that you can reference it later (don't include the braces):

```bash
docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account new"
export CELO_VALIDATOR_GROUP_ADDRESS=<YOUR-VALIDATOR-GROUP-ADDRESS>

docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account new"
export CELO_VALIDATOR_ADDRESS=<YOUR-VALIDATOR-ADDRESS>

docker run -v $PWD/proxy:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account new"
export CELO_PROXY_ADDRESS=<YOUR-PROXY-ADDRESS>
```

Those commands will prompt you for a passphrase, ask you to confirm it, and then will output your account address: `Address: {<YOUR-ACCOUNT-ADDRESS>}`

{% hint style="danger" %}
**Warning**: There is a known issue `(Fatal: Failed to read passphrase: liner: function not supported in this terminal” rather than just failing)` running geth inside Docker that happens eventually. So if that command fails, please try again, and if it continues to fail after several attempts, check this page [this page](https://forum.celo.org/t/setting-up-a-validator-faq/90).
{% endhint %}

In order to register the Validator later on, generate a "proof of possession" - a signature proving you know your Validator's BLS private key. Run this command to generate this "proof-of-possession", which consists of a the BLS public key and a signature:

```bash
docker run -v $PWD/validator:/root/.celo --entrypoint /bin/sh -it $CELO_IMAGE -c "geth account proof-of-possession $CELO_VALIDATOR_ADDRESS $CELO_VALIDATOR_ADDRESS"
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

{% hint style="danger" %}
**Warning**: There is a known issue `(Fatal: Failed to read passphrase: liner: function not supported in this terminal” rather than just failing)` running geth inside Docker that happens eventually. So if that command fails, please try again, and if it continues to fail after several attempts, check this page [this page](https://forum.celo.org/t/setting-up-a-validator-faq/90).
{% endhint %}

In order to allow the node to sync with the network, give it the address of existing nodes in the network to the Proxy. The Validator will sync through the Proxy:

```bash
docker run -v $PWD/proxy:/root/.celo --entrypoint cp $CELO_IMAGE /celo/static-nodes.json /root/.celo/
```

#### Running the Proxy

At this point we are ready to start up the Proxy:

```bash
docker run --name celo-proxy -d --restart always -p 8555:8545 -p 8556:8546 -p 30313:30303 -p 30313:30303/udp -p 30503:30503 -p 30503:30503/udp -v $PWD/proxy:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal,istanbul --etherbase=$CELO_PROXY_ADDRESS --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_ADDRESS --proxy.internalendpoint :30503
```

#### Running the Validator

Now that we have the Proxy up and running, we need to obtain its enode and IP address, so that we can connect the Validator to the proxy. You can do that running the following commands:

```bash
export PROXY_ENODE=$(docker exec celo-proxy geth --exec "admin.nodeInfo['enode'].split('//')[1].split('@')[0]" attach | tr -d '"')
export PROXY_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' celo-proxy)
```

Now we can start up the Validator node. In the below command remember to replace the **VALIDATOR_ADDRESS_PASSWORD** for the password you used when you created the `CELO_VALIDATOR_ADDRESS`:

```bash
docker run -v $PWD/validator:/root/.celo --entrypoint sh --rm $CELO_IMAGE -c "echo VALIDATOR_ADDRESS_PASSWORD > /root/.celo/.password"
docker run --name celo-validator -d --restart always -p 127.0.0.1:8545:8545 -p 127.0.0.1:8546:8546 -p 30303:30303 -p 30303:30303/udp -v $PWD/validator:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal,istanbul --mine --istanbul.blockperiod=5 --istanbul.requesttimeout=3000 --etherbase $CELO_VALIDATOR_ADDRESS --nodiscover --proxy.proxied --proxy.proxyenodeurlpair=enode://$PROXY_ENODE@$PROXY_IP:30503\;enode://$PROXY_ENODE@$PROXY_IP:30303  --unlock=$CELO_VALIDATOR_ADDRESS --password /root/.celo/.password
```

**Security**: The command line above includes the parameter `--rpcaddr 0.0.0.0` which makes the Celo Blockchain software listen for incoming RPC requests on all the interfaces of the Docker container. Exercise extreme caution in doing this when running outside Docker, as it means that any unlocked accounts and their funds may be accessed from other machines on the Internet. In the context of running a Docker container on your local machine, this together with the `docker -p` flags allows you to make RPC calls from outside the container, i.e from your local host, but not from outside your machine. Read more about [Docker Networking](https://docs.docker.com/network/network-tutorial-standalone/#use-user-defined-bridge-networks) here.

The `mine` flag does not mean the node starts mining blocks, but rather starts trying to participate in the BFT consensus protocol. It cannot do this until it gets elected -- so next we need to stand for election.

The `networkid` parameter value of `1101` indicates we are connecting the Baklava Beta network.

### Running the Attestation Service

As part of the [lightweight identity protocol](/celo-codebase/protocol/identity), Validators are expected to run an [Attestation Service](https://github.com/celo-org/celo-monorepo/tree/master/packages/attestation-service) to provide attestations that allow users to map their phone number to an account on Celo.

You can find the complete instructions about how to run the [Attestation Service at the documentation page](running-attestation-service.md).

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

### Obtain and lock up some Celo Gold for staking

To participate in The Great Celo Stake Off (aka TGCSO) and get fauceted it's necessary to register online via an [online form](https://docs.google.com/forms/d/e/1FAIpQLSfbn5hTJ4UIWpN92-o2qMTUB0UnrFsL0fm97XqGe4VhhN_r5A/viewform).

### Lock up Celo Gold

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
You’re all set! Note that elections are finalized at the end of each epoch, roughly once an hour in the Baklava Testnet. After that hour, if you get elected, your node will start participating BFT consensus and validating blocks. Users requesting attestations will hit your registered Attestation Service.
{% endhint %}

{% hint style="info" %}
**Roadmap**: Different parameters will govern elections in a Celo production network. Epochs are likely to be daily, rather than hourly. Running a Validator will also include setting up proxy nodes to protect against DDoS attacks, and using hardware wallets to secure the key used to sign blocks. We plan to update these instructions with more details soon.
{% endhint %}
