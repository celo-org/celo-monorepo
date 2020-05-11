# Running a Validator in RC1

This section explains how to get a Validator node running on Mainnet Release Candidate 1 (RC1) Network.

Validators help secure the Celo network by participating in Celo’s proof-of-stake protocol. Validators are organized into Validator Groups, analogous to parties in representative democracies. A Validator Group is essentially an ordered list of Validators.

Just as anyone in a democracy can create their own political party, or seek to get selected to represent a party in an election, any Celo user can create a Validator group and add themselves to it, or set up a potential Validator and work to get an existing Validator group to include them.

While other Validator Groups will exist on the Celo Network, the fastest way to get up and running with a Validator will be to register a Validator Group, register a Validator, and affliate that Validator with your Validator Group. The addresses used to register Validator Groups and Validators must be unique, which will require that you create two accounts in the step-by-step guide below.

Because of the importance of Validator security and availability, Validators are expected to run a "proxy" node in front of each Validator node. In this setup, the Proxy node connects with the rest of the network, and the Validator node communicates only with the Proxy, ideally via a private network.

Additionally, Validators are expected to run an [Attestation Service](https://github.com/celo-org/celo-monorepo/tree/master/packages/attestation-service) as part of the [lightweight identity protocol](../celo-codebase/protocol/identity), to provide attestations that allow users to map their phone number to a Celo address.

[Read more about Celo's mission and why you may want to become a Validator.](https://medium.com/celoorg/calling-all-chefs-become-a-celo-validator-c75d1c2909aa)

## Prerequisites

### Staking Requirements

Celo uses a [proof-of-stake](../celo-codebase/protocol/proof-of-stake) consensus mechanism, which requires Validators to have locked Celo Gold to participate in block production. The current requirement is 10,000 cGLD to register a Validator, and 10,000 cGLD _per member validator_ to register a Validator Group.

If you do not have the required Celo Gold to lock up, you can try out of the process of creating a validator on the Baklava network by following the [Running a Validator in Baklava guide](running-a-validator-in-baklava.md)

We will not discuss obtaining Celo Gold here, but it is a prerequisite that you obtain the required Celo Gold, and it is assumed in this guide that your gold is held in two `ReleaseGold` contracts, one for the Validator and one for the Validator Group. If that is not the case, the provided commands will need to be adjusted, but the guide will still provide the required steps.

At a high level, `ReleaseGold` holds a balance for scheduled release, while allowing the held balance to be used for certain actions such as validating and voting, depending on the configuration of the contract. [Read more about `ReleaseGold`](../celo-gold-holder-guide/release-gold.md).

### Hardware requirements

The recommended Celo Validator setup involves continually running three instances:

- 1 **Validator node**: should be deployed to single-tenant hardware in a secure, high availability data center
- 1 **Validator Proxy node**: can be a VM or container in a multi-tenant environment (e.g. a public cloud), but requires high availability
- 1 **Attestation node**: can be a VM or container in a multi-tenant environment (e.g. a public cloud), and has moderate availability requirements

Celo is a proof-of-stake network, which has different hardware requirements than a Proof of Work network. proof-of-stake consensus is less CPU intensive, but is more sensitive to network connectivity and latency. Below is a list of standard requirements for running Validator and Proxy nodes on the Celo Network:

- Memory: 8 GB RAM
- CPU: Quad core 3GHz (64-bit)
- Disk: 256 GB of SSD storage, plus a secondary HDD desirable
- Network: At least 1 GB input/output Ethernet with a fiber Internet connection, ideally redundant connections and HA switches

Attestation Service nodes consume less resources and can run on machines with less memory and compute.

In addition, to get things started, it will be useful to run a node on your local machine that you can issue CLI commands against.

### Networking requirements

In order for your Validator to participate in consensus and complete attestations, it is **critically** important to configure your network correctly.

Your Proxy and Attestations nodes must have static, external IP addresses, and your Validator node must be able to communicate with the Proxy, either via an internal network or via the Proxy's external IP address.

On the Validator machine, port 30503 should accept TCP connections from the IP address of your Proxy machine. This port is used by the Validator to communicate with the Proxy.

On the Proxy machine, port 30503 should accept TCP connections from the IP address of your Validator machine. This port is used by the Proxy to communicate with the Validator.

On the Proxy and Attestations machines, port 30303 should accept TCP and UDP connections from all IP addresses. This port is used to communicate with other nodes in the network.

On the Attestations machine, port 80 should accept TCP connections from all IP addresses. This port is used by users to request attestations from you.

To illustrate this, you may refer to the following table:

| Machine \\ IPs open to | 0\.0\.0\.0/0 \(all\) | your\-validator\-ip | your\-proxy\-ip |
|------------------------|----------------------|-----------------------|-------------------|
| Validator              |                      |                       | tcp:30503        |
| Proxy                  | tcp:30303, udp:30303 | tcp:30503             |                   |
| Attestation            | tcp:80               |                       |                   |

### Software requirements

#### On each machine

- **You have Docker installed.**

  If you don’t have it already, follow the instructions here: [Get Started with Docker](https://www.docker.com/get-started). It will involve creating or signing in with a Docker account, downloading a desktop app, and then launching the app to be able to use the Docker CLI. If you are running on a Linux server, follow the instructions for your distro [here](https://docs.docker.com/install/#server). You may be required to run Docker with `sudo` depending on your installation environment.
  You can check you have Docker installed and running if the command `docker info` works properly.

#### On your local machine

- **You have celocli installed.**

  See [Command Line Interface \(CLI\) ](../command-line-interface/introduction.md)for instructions on how to get set up.

- **You are using the latest Node 10.x LTS**

  Some users have reported issues using the most recent version of node. Use the LTS for greater reliability.

{% hint style="info" %}
A note about conventions:
The code snippets you'll see on this page are bash commands and their output.

When you see text in angle brackets &lt;&gt;, replace them and the text inside with your own value of what it refers to. Don't include the &lt;&gt; in the command.
{% endhint %}

### Key Management

Private keys are the central primitive of any cryptographic system and need to be handled with extreme care. Loss of your private key can lead to irreversible loss of value.

This guide contains a large number of keys, so it is important to understand the purpose of each key. [Read more about key management.](../operations-manual/key-management/summary.md)

#### Unlocking

Celo nodes store private keys encrypted on disk with a password, and need to be "unlocked" before use. Private keys can be unlocked in two ways:

1.  By running the `celocli account:unlock` command. Note that the node must have the "personal" RPC API enabled in order for this command to work.
2.  By setting the `--unlock` flag when starting the node.

It is important to note that when a key is unlocked you need to be particularly careful about enabling access to the node's RPC APIs.

### Environment variables

There are a number of environment variables in this guide, and you may use this table as a reference.

| Variable                             | Explanation                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| CELO_IMAGE                           | The Docker image used for the Validator and proxy containers                                                                         |
| NETWORK_ID                           | The Celo RC1 network chain ID                                                                                                    |
| CELO_VALIDATOR_GROUP_ADDRESS         | The account address for the Validator Group; the `ReleaseGold` beneficiary address for the Validator Group                                                                                          |
| CELO_VALIDATOR_ADDRESS         | The account address for the Validator; the `ReleaseGold` beneficiary address for the Validator                                                                                          |
| CELO_VALIDATOR_GROUP_RG_ADDRESS         | The `ReleaseGold` contract address for the Validator Group                                                                                          |
| CELO_VALIDATOR_RG_ADDRESS         | The `ReleaseGold` contract address for the Validator                                                                                          |
| CELO_VALIDATOR_GROUP_SIGNER_ADDRESS        | The validator (group) signer address authorized by the Validator Group account.
| CELO_VALIDATOR_GROUP_SIGNER_SIGNATURE      | The proof-of-possession of the Validator Group signer key                                                                                  |
| CELO_VALIDATOR_SIGNER_ADDRESS        | The validator signer address authorized by the Validator Account
| CELO_VALIDATOR_SIGNER_PUBLIC_KEY     | The ECDSA public key associated with the Validator signer address                                                                    |
| CELO_VALIDATOR_SIGNER_SIGNATURE      | The proof-of-possession of the Validator signer key                                                                                  |
| CELO_VALIDATOR_SIGNER_BLS_PUBLIC_KEY | The BLS public key for the Validator instance                                                                                        |
| CELO_VALIDATOR_SIGNER_BLS_SIGNATURE  | A proof-of-possession of the BLS public key                                                                                          |
| CELO_VALIDATOR_GROUP_VOTE_SIGNER_ADDRESS        | The address of the Validator Group vote signer                                                              |
| CELO_VALIDATOR_GROUP_VOTE_SIGNER_PUBLIC_KEY     | The ECDSA public key associated with the Validator Group vote signer address                                                                    |
| CELO_VALIDATOR_GROUP_VOTE_SIGNER_SIGNATURE      | The proof-of-possession of the Validator Group vote signer key                                                                                  |
| CELO_VALIDATOR_VOTE_SIGNER_ADDRESS        | The address of the Validator vote signer                                                              |
| CELO_VALIDATOR_VOTE_SIGNER_PUBLIC_KEY     | The ECDSA public key associated with the Validator vote signer address                                                                    |
| CELO_VALIDATOR_VOTE_SIGNER_SIGNATURE      | The proof-of-possession of the Validator vote signer key                                                                                  |
| PROXY_ENODE                          | The enode address for the Validator proxy                                                                                            |
| PROXY_INTERNAL_IP                    | (Optional) The internal IP address over which your Validator can communicate with your proxy                                         |
| PROXY_EXTERNAL_IP                    | The external IP address of the proxy. May be used by the Validator to communicate with the proxy if PROXY_INTERNAL_IP is unspecified |
| CELO_ATTESTATION_SIGNER_ADDRESS           | The address of the attestation signer authorized by the Validator Account                                                            |
| CELO_ATTESTATION_SIGNER_SIGNATURE         | The proof-of-possession of the attestation signer key                                                                                |
| CELO_ATTESTATION_SERVICE_URL              | The URL to access the deployed Attestation Service                                                                                   |
| METADATA_URL                         | The URL to access the metadata file for your Attestation Service                                                                     |
| DATABASE_URL                         | The URL under which your database is accessible, currently supported are `postgres://`, `mysql://` and `sqlite://`                   |
| APP_SIGNATURE                        | The hash with which clients can auto-read SMS messages on android                                                                    |
| SMS_PROVIDERS                        | A comma-separated list of providers you want to configure, Celo currently supports `nexmo` & `twilio`                                   |

## Network Deployment Timeline

The setup of RC1 is similar to the new Baklava network and the deployment timeline is as follows (all dates are subject to change):

* 4/19 00:00 UTC: Docker image with genesis block distributed
* 4/19 - 4/22: Infrastructure setup
* 4/22 16:00 UTC: Block production begins
* 4/22: Celo Core Contracts and `ReleaseGold` contracts are deployed
* 4/27: Governance proposals submitted to unfreeze validator elections and validator epoch rewards
* 5/1: Elections and validator rewards enabled if governance proposals pass; validators have been registered and affiliated with a Validator Group for first election
* 5/9: Governance proposals submitted to enable voter rewards and enable Celo Gold (cGLD) transfers
* 5/13: RC1 is declared Mainnet and cGLD transfers are enabled, if governance proposals pass
* 5/22: Governance proposal submitted to unfreeze stability protocol
* 5/26: Stability protocol goes live if governance proposal passes

{% hint style="info" %}
A [timeline](https://forum.celo.org/t/release-candidate-1-rc1-timeline-and-details/428) of the Release Candidate 1 is available to provide further context.
{% endhint %}

## Validator Node Setup

This section outlines the steps needed to configure your Proxy and Validator nodes so that they are ready to sign blocks once elected.

### Environment Variables

First we are going to set up the main environment variables related to the RC1 network. Run these on both your **Validator** and **Proxy** machines:

```bash
export CELO_IMAGE=us.gcr.io/celo-testnet/celo-node:rc1
export NETWORK_ID=42220
```

### Pull the Celo Docker image

In all the commands we are going to see the `CELO_IMAGE` variable to refer to the Docker image to use. Now we can get the Docker image on your Validator and Proxy machines:

```bash
docker pull $CELO_IMAGE
```

The `us.gcr.io/celo-testnet/celo-node:rc1` image contains the [genesis block](https://github.com/celo-org/celo-monorepo/blob/master/packages/celotool/genesis_rc1.json) in addition to the Celo Blockchain binary.

### Start your Accounts node

Next, we'll run a node on your local machine so that we can use these accounts to lock Celo Gold and authorize the keys needed to run your validator. To do this, we need to run the following commands, which fetch the genesis block and a list of other nodes in the network to connect to.

```bash
# On your local machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE init /celo/genesis.json
export BOOTNODE_ENODES=`docker run --rm --entrypoint cat $CELO_IMAGE /celo/bootnodes`
```

To run the node:

```bash
# On your local machine
mkdir celo-accounts-node
cd celo-accounts-node
docker run --name celo-accounts -it --restart always -p 127.0.0.1:8545:8545 -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal --bootnodes $BOOTNODE_ENODES
```

{% hint style="danger" %}
**Security**: The command line above includes the parameter `--rpcaddr 0.0.0.0` which makes the Celo Blockchain software listen for incoming RPC requests on all network adaptors. Exercise extreme caution in doing this when running outside Docker, as it means that any unlocked accounts and their funds may be accessed from other machines on the Internet. In the context of running a Docker container on your local machine, this together with the `docker -p 127.0.0.1:localport:containerport` flags allows you to make RPC calls from outside the container, i.e from your local host, but not from outside your machine. Read more about [Docker Networking](https://docs.docker.com/network/network-tutorial-standalone/#use-user-defined-bridge-networks) here.
{% endhint %}


### Deploy a proxy

```bash
# On the proxy machine
mkdir celo-proxy-node
cd celo-proxy-node
export CELO_VALIDATOR_SIGNER_ADDRESS=<YOUR-VALIDATOR-SIGNER-ADDRESS>
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE init /celo/genesis.json
export BOOTNODE_ENODES="$(docker run --rm --entrypoint cat $CELO_IMAGE /celo/bootnodes)"
```

You can then run the proxy with the following command. Be sure to replace `<YOUR-VALIDATOR-NAME>` with the name you'd like to appear on Celostats. The validator name shown in [Celostats](https://stats.celo.org/) will be the name configured in the proxy.

Additionally, you need to unlock the account configured in the `etherbase` option. It is recommended to create a new account and independent account only for this purpose. Be sure to write a new password to `./.password` for this account (different to the Validator Signer password)

```bash
# On the proxy machine
# First, we create a new account for the proxy
docker run --name celo-proxy-password -it --rm  -v $PWD:/root/.celo $CELO_IMAGE account new --password /root/.celo/.password
```

Notice the public address returned by this command, that can be exported and used for running the proxy node:

```bash
# On the proxy machine
export PROXY_ADDRESS=<PROXY-PUBLIC-ADDRESS>
docker run --name celo-proxy -it --restart unless-stopped -p 30303:30303 -p 30303:30303/udp -p 30503:30503 -p 30503:30503/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --nousb --syncmode full --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_SIGNER_ADDRESS --proxy.internalendpoint :30503 --etherbase $PROXY_ADDRESS --unlock $PROXY_ADDRESS --password /root/.celo/.password --allow-insecure-unlock --bootnodes $BOOTNODE_ENODES --ethstats=<YOUR-VALIDATOR-NAME>@stats-server.celo.org
```

**OPTIONAL**
In addition to the bootnode enode URLs provided by the cLabs team, the Celo validator community will contribute full node peers to help kickstart your nodes' peer discovery and block synchronisation processes. Here is the current list, set to `COMMUNITY_ENODES`:
```bash
export COMMUNITY_ENODES="enode://f65013f1ac6827e275c2d2737ce13357f620d4364124d02227a19321c57f8fbf9214a9411de49d49f180b085b031d9d23211a6ead4499fc5f9d3592b55322123@50.17.60.161:30303"
```

To use the nodes, set them to the value of the `bootnodes` or `bootnodesv4` options when running your node-starting `docker run...` commands (in this example, we will use `bootnodesv4` to keep the original command intact). To bootstrap your proxy node, you can run the command below (the same command at line 239 appended with `--bootnodesv4 $COMMUNITY_ENODES`):
```bash
export COMMUNITY_ENODES="enode://f65013f1ac6827e275c2d2737ce13357f620d4364124d02227a19321c57f8fbf9214a9411de49d49f180b085b031d9d23211a6ead4499fc5f9d3592b55322123@50.17.60.161:30303"
export PROXY_ADDRESS=<PROXY-PUBLIC-ADDRESS>
docker run --name celo-proxy -it --restart unless-stopped -p 30303:30303 -p 30303:30303/udp -p 30503:30503 -p 30503:30503/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --nousb --syncmode full --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_SIGNER_ADDRESS --proxy.internalendpoint :30503 --etherbase $PROXY_ADDRESS --unlock $PROXY_ADDRESS --password /root/.celo/.password --allow-insecure-unlock --bootnodes $BOOTNODE_ENODES --ethstats=<YOUR-VALIDATOR-NAME>@stats-server.celo.org --bootnodesv4 $COMMUNITY_ENODES
```

Hint: If you are running into trouble peering with the full nodes, one of the first things to check is whether your container's ports are properly configured (i.e. specifically, `-p 30303:30303 -p 30303:30303/udp` - which is set in the proxy node's command, but not the account node's command).

{% hint style="info" %}
You can detach from the running container by pressing `ctrl+p ctrl+q`, or start it with `-d` instead of `-it` to start detached. Access the logs for a container in the background with the `docker logs` command.
{% endhint %}

### Get your Proxy's connection info

Once the Proxy is running, we will need to retrieve its enode and IP address so that the Validator will be able to connect to it.

```bash
# On the proxy machine, retrieve the proxy enode
docker exec celo-proxy geth --exec "admin.nodeInfo['enode'].split('//')[1].split('@')[0]" attach | tr -d '"'
```

Now we need to set the Proxy enode and Proxy IP address in environment variables on the Validator machine.

If you don't have an internal IP address over which the Validator and Proxy can communicate, you can set the internal IP address to the external IP address.

If you don't know your proxy's external IP address, you can get it by running the following command:

```bash
# On the proxy machine
dig +short myip.opendns.com @resolver1.opendns.com
```

Then, export the variables on your Validator machine.

```bash
# On the Validator machine
export PROXY_ENODE=<YOUR-PROXY-ENODE>
export PROXY_EXTERNAL_IP=<PROXY-MACHINE-EXTERNAL-IP-ADDRESS>
export PROXY_INTERNAL_IP=<PROXY-MACHINE-INTERNAL-IP-ADDRESS>
```

You will also need to export `PROXY_EXTERNAL_IP` on your local machine.

```bash
# On your local machine
export PROXY_EXTERNAL_IP=<PROXY-MACHINE-EXTERNAL-IP-ADDRESS>
```

### Deploy a Validator Machine

The Validator machine is node that actually assembles and signs blocks to particpate in consesnsus. We will set it up in this section.

To operate as a validator, you'll need to generate a validator signer key. On your Validator machine (which should not be accessible from the public internet), follow very similar steps:

```bash
# On the validator machine
mkdir celo-validator-node
cd celo-validator-node
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account new
export CELO_VALIDATOR_SIGNER_ADDRESS=<YOUR-VALIDATOR-SIGNER-ADDRESS>
```

When your Validator starts up it will attempt to create a network connection with the proxy machine. You will need to make sure that your proxy machine has the appropriate firewall settings to allow the Validator to connect to it.

Specifically, on the proxy machine, port 30303 should allow TCP and UDP connections from all IP addresses. And port 30503 should allow TCP connections from the IP address of your Validator machine.

Test that your network is configured correctly by running the following commands:

```bash
# On your local machine, test that your proxy is accepting TCP connections over port 30303.
# Note that it will also need to be accepting UDP connections over this port.
nc -vz $PROXY_EXTERNAL_IP 30303
```

```bash
# On your Validator machine, test that your proxy is accepting TCP connections over port 30503.
nc -vz $PROXY_INTERNAL_IP 30503
```

Once that is completed, go ahead and run the Validator. Be sure to write your Validator signer password to `./.password` for the following command to work, or provide your password another way.

```bash
# On the Validator machine
cd celo-validator-node
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE init /celo/genesis.json
docker run --name celo-validator -it --restart unless-stopped -p 30303:30303 -p 30303:30303/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --mine --istanbul.blockperiod=5 --istanbul.requesttimeout=3000 --etherbase $CELO_VALIDATOR_SIGNER_ADDRESS --nodiscover --nousb --proxy.proxied --proxy.proxyenodeurlpair=enode://$PROXY_ENODE@$PROXY_INTERNAL_IP:30503\;enode://$PROXY_ENODE@$PROXY_EXTERNAL_IP:30303 --unlock=$CELO_VALIDATOR_SIGNER_ADDRESS --password /root/.celo/.password --ethstats=<YOUR-VALIDATOR-NAME>@stats-server.celo.org
```

The `networkid` parameter value of `42220` indicates we are connecting to the Mainnet Release Candidate 1 network.

At this point your Validator and Proxy machines should be configured, and both should be syncing to the network. You should see `Imported new chain segment` in your node logs, about once every 5 seconds once the node is synced to the latest block which you can find on the [Network Stats](https://stats.celo.org) page.

## Registering as a Validator

In order to operate as a Validator, you must register on-chain and be elected. Elections will run on each epoch boundary, approximatly every 24 hours, after elections have been unfrozen by on-chain governance. Eligible validator groups will be considered in an Election mechanism that will select Validator based on the [D'Hondt method](https://en.wikipedia.org/wiki/D%27Hondt_method).

In the following steps, this guide will assume your Celo Gold is held in a `ReleaseGold` contract, if this is not the case, the commands will need to be adjusted. At a high level, `ReleaseGold` holds a balance for scheduled release, while allowing the held balance to be used for certain actions such as validating and voting, depending on the configuration of the contract. [Read more about `ReleaseGold`.](../celo-gold-holder-guide/release-gold.md)

**Once elections are running, the genesis validators will be replaced by the elected validators, so it is important to register and vote even if you are in the genesis set.**

The following sections outline the actions you will need to take. On a high level, you will:

- Create Accounts and lock up the balance of each `ReleaseGold` contract
- Register a Validator
- Register a Validator Group
- Add the registered Validator to the Validator Group
- Vote for the group with funds from each `ReleaseGold` contract

### Create Accounts from the `ReleaseGold` contracts

In order to participate on the network (lock gold, vote, validate) from a `ReleaseGold` contract, we need to create a registered Account with the address of the `ReleaseGold` contract.

```bash
# On your local machine
export CELO_VALIDATOR_GROUP_RG_ADDRESS=<YOUR-CELO-VALIDATOR-GROUP-RG-ADDRESS>
export CELO_VALIDATOR_RG_ADDRESS=<YOUR-CELO-VALIDATOR-RG-ADDRESS>
```

Show the configuration and balance of your `ReleaseGold` contracts:

```bash
# On your local machine
celocli releasegold:show --contract $CELO_VALIDATOR_GROUP_RG_ADDRESS
celocli releasegold:show --contract $CELO_VALIDATOR_RG_ADDRESS
```

{% hint style="info" %}
When running the following commands, the Beneficiary keys should be [unlocked](#unlocking).
{% endhint %}

Create a registered Account for each of the Validator and Validator Group's `ReleaseGold` contracts:

```bash
# On your local machine
celocli releasegold:create-account --contract $CELO_VALIDATOR_GROUP_RG_ADDRESS
celocli releasegold:create-account --contract $CELO_VALIDATOR_RG_ADDRESS
```

By running the following commands, you can see that the `ReleaseGold` contract addresses are now also associated with a registered Account.

```bash
# On your local machine
celocli account:show $CELO_VALIDATOR_GROUP_RG_ADDRESS
celocli account:show $CELO_VALIDATOR_RG_ADDRESS
```

Lock cGLD from your `ReleaseGold` contracts to fulfill the lock-up requirements to register a Validator and Validator Group. The current requirement is 10,000 cGLD to register a Validator, and 10,000 cGLD _per member validator_ to register a Validator Group.

```bash
celocli releasegold:locked-gold --contract $CELO_VALIDATOR_GROUP_RG_ADDRESS --action lock --value 10000e18
celocli releasegold:locked-gold --contract $CELO_VALIDATOR_RG_ADDRESS --action lock --value 10000e18
```

Check that your cGLD was successfully locked with the following commands:

```bash
# On your local machine
celocli lockedgold:show $CELO_VALIDATOR_GROUP_RG_ADDRESS
celocli lockedgold:show $CELO_VALIDATOR_RG_ADDRESS
```

### Register as a Validator

In order to perform Validator actions with the Account created in the previous step, you will need to authorize a [Validator signer](../operations-manual/key-management/detailed.md#authorized-validator-signers) for the `ReleaseGold` contract account.

```bash
# On the Validator machine
export CELO_VALIDATOR_RG_ADDRESS=<YOUR-CELO-VALIDATOR-RG-ADDRESS>
export CELO_VALIDATOR_SIGNER_ADDRESS=<YOUR-VALIDATOR-SIGNER-ADDRESS>
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE --nousb account proof-of-possession $CELO_VALIDATOR_SIGNER_ADDRESS $CELO_VALIDATOR_RG_ADDRESS
```

Save the signer address, public key, and proof-of-possession signature to your local machine:

```bash
# On your local machine
export CELO_VALIDATOR_SIGNER_ADDRESS=<YOUR-VALIDATOR-SIGNER-ADDRESS>
export CELO_VALIDATOR_SIGNER_SIGNATURE=<YOUR-VALIDATOR-SIGNER-SIGNATURE>
export CELO_VALIDATOR_SIGNER_PUBLIC_KEY=<YOUR-VALIDATOR-SIGNER-PUBLIC-KEY>
```

Validators on the Celo network use BLS aggregated signatures to create blocks in addition to the Validator signer (ECDSA) key. While an independent BLS key can be specified, the simplest thing to do is to derive the BLS key from the Validator signer. When we register our Validator, we'll need to prove possession of the BLS key as well, which can be done by running the following command.

If you were part of the genesis validator set, you will have already generated this key and submitted it via Gist. Note that if you are planning to run more than one validator, each validator will need a distinct BLS key.

```bash
# On the Validator machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE --nousb account proof-of-possession $CELO_VALIDATOR_SIGNER_ADDRESS $CELO_VALIDATOR_RG_ADDRESS --bls
```

Save the resulting signature and public key to your local machine:

```bash
# On your local machine
export CELO_VALIDATOR_SIGNER_BLS_SIGNATURE=<YOUR-VALIDATOR-SIGNER-SIGNATURE>
export CELO_VALIDATOR_SIGNER_BLS_PUBLIC_KEY=<YOUR-VALIDATOR-SIGNER-BLS-PUBLIC-KEY>
```

In order to validate we need to authorize the Validator signer:

```bash
# On your local machine
celocli releasegold:authorize --contract $CELO_VALIDATOR_RG_ADDRESS --role validator --signature 0x$CELO_VALIDATOR_SIGNER_SIGNATURE --signer $CELO_VALIDATOR_SIGNER_ADDRESS
```

Using the newly authorized Validator signer, register a validator on behalf of the registered Account:

{% hint style="info" %}
Running the following command requires the keys for the validator signer address. This command can be run on the validator machine, or if the keys are also available on your local machine, it can be run there.
{% endhint %}

```bash
# On a machine with CELO_VALIDATOR_SIGNER_ADDRESS unlocked.
celocli validator:register --blsKey $CELO_VALIDATOR_SIGNER_BLS_PUBLIC_KEY --blsSignature $CELO_VALIDATOR_SIGNER_BLS_SIGNATURE --ecdsaKey $CELO_VALIDATOR_SIGNER_PUBLIC_KEY --from $CELO_VALIDATOR_SIGNER_ADDRESS
```

You can view information about your Validator by running the following command:

```bash
# On your local machine
celocli validator:show $CELO_VALIDATOR_RG_ADDRESS
```

### Register as a Validator Group

In order to register a Validator Group, you will need to authorize a validator (group) signer on behalf of the `ReleaseGold` registered Account. In these steps you will create a new key on your local machine for this purpose.

```bash
# On your local machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account new
```

And save this new address:

```bash
export CELO_VALIDATOR_GROUP_SIGNER_ADDRESS=<YOUR-VALIDATOR-GROUP-SIGNER-ADDRESS>
```

In order to authorize our Validator Group signer, we need to create a proof that we have possession of the Validator Group signer private key. We do so by signing a message that consists of the authorizing registered Account address, in this case, the `ReleaseGold` contract address.

To generate the proof-of-possession, run the following command:

```bash
# On your local machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE --nousb account proof-of-possession $CELO_VALIDATOR_GROUP_SIGNER_ADDRESS $CELO_VALIDATOR_GROUP_RG_ADDRESS
```

Save the signer address, public key, and proof-of-possession signature to your local machine:

```bash
export CELO_VALIDATOR_GROUP_SIGNER_SIGNATURE=<YOUR-VALIDATOR-GROUP-SIGNER-SIGNATURE>
```

Authorize your Validator Group signer:

```bash
# On your local machine
celocli releasegold:authorize --contract $CELO_VALIDATOR_GROUP_RG_ADDRESS --role validator --signature 0x$CELO_VALIDATOR_GROUP_SIGNER_SIGNATURE --signer $CELO_VALIDATOR_GROUP_SIGNER_ADDRESS
```

With this newly authorized signer, you can register a Validator Group on behalf of the regsitered Account:

```bash
# On your local machine
celocli validatorgroup:register --from $CELO_VALIDATOR_GROUP_SIGNER_ADDRESS --commission 0.1
```

You can view information about your Validator Group by running the following command:

```bash
# On your local machine
celocli validatorgroup:show $CELO_VALIDATOR_GROUP_RG_ADDRESS
```

### Affiliate the Validator with the group

Now that the Validator and the group are registered, you can affiliate the Validator with the group, indicating that Validator's desire to join the group.

```bash
# On the Validator machine
celocli validator:affiliate $CELO_VALIDATOR_GROUP_RG_ADDRESS --from $CELO_VALIDATOR_SIGNER_ADDRESS
```

The Validator Group can then accept the Validator as a member:

```bash
# On your local machine
celocli validatorgroup:member --accept $CELO_VALIDATOR_RG_ADDRESS --from $CELO_VALIDATOR_GROUP_SIGNER_ADDRESS
```

Verify that your Validator is now a member of your Validator Group:

```bash
# On your local machine
celocli validator:show $CELO_VALIDATOR_RG_ADDRESS
celocli validatorgroup:show $CELO_VALIDATOR_GROUP_RG_ADDRESS
```

### Vote in the Election

In order to get elected as a Validator, you will need to use the balance of your `ReleaseGold` contracts to vote for your group.

#### Authorize vote signer

In order to vote on behalf of the `ReleaseGold` registered Accounts you will need to authorize vote signers.

Create the vote signer keys:

```bash
# On your local machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account new
export CELO_VALIDATOR_VOTE_SIGNER_ADDRESS=<YOUR-VALIDATOR-VOTE-SIGNER-ADDRESS>

docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account new
export CELO_VALIDATOR_GROUP_VOTE_SIGNER_ADDRESS=<YOUR-VALIDATOR-GROUP-VOTE-SIGNER-ADDRESS>
```

Produce the proof-of-possessions needed to authorize the vote signers:

```bash
# On your local machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE --nousb account proof-of-possession $CELO_VALIDATOR_VOTE_SIGNER_ADDRESS $CELO_VALIDATOR_RG_ADDRESS
export CELO_VALIDATOR_VOTE_SIGNER_SIGNATURE=<YOUR-VALIDATOR-VOTE-SIGNER-SIGNATURE>

docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE --nousb account proof-of-possession $CELO_VALIDATOR_GROUP_VOTE_SIGNER_ADDRESS $CELO_VALIDATOR_GROUP_RG_ADDRESS
export CELO_VALIDATOR_GROUP_VOTE_SIGNER_SIGNATURE=<YOUR-VALIDATOR-GROUP-VOTE-SIGNER-SIGNATURE>
```

Authorize the vote signing keys:

```bash
# On your local machine
celocli releasegold:authorize --contract $CELO_VALIDATOR_RG_ADDRESS --role vote --signature 0x$CELO_VALIDATOR_VOTE_SIGNER_SIGNATURE --signer $CELO_VALIDATOR_VOTE_SIGNER_ADDRESS
celocli releasegold:authorize --contract $CELO_VALIDATOR_GROUP_RG_ADDRESS --role vote --signature 0x$CELO_VALIDATOR_GROUP_VOTE_SIGNER_SIGNATURE --signer $CELO_VALIDATOR_GROUP_VOTE_SIGNER_ADDRESS
```

#### Submit your votes

Now the newly authorized vote signers can be used to vote for your validator group:

```bash
# On your local machine
celocli election:vote --from $CELO_VALIDATOR_VOTE_SIGNER_ADDRESS --for $CELO_VALIDATOR_GROUP_RG_ADDRESS --value 10000e18
celocli election:vote --from $CELO_VALIDATOR_GROUP_VOTE_SIGNER_ADDRESS --for $CELO_VALIDATOR_GROUP_RG_ADDRESS --value 10000e18
```

Verify that your votes were cast successfully:

```bash
# On your local machine
celocli election:show $CELO_VALIDATOR_GROUP_RG_ADDRESS --group
celocli election:show $CELO_VALIDATOR_GROUP_RG_ADDRESS --voter
celocli election:show $CELO_VALIDATOR_RG_ADDRESS --voter
```

Users in the Celo protocol receive epoch rewards for voting in Validator Elections only after submitting a special transaction to enable rewards. This must be done every time new votes are cast, and can only be made after the most recent epoch has ended. For convenience, we can use the following command, which will wait until the epoch has ended before sending a transaction:

{% hint style="info" %}
Epoch lengths in the RC1 network are set to be the number of blocks produced in a day. As a result, votes may need to be activated up to 24 hours after they are cast.
{% endhint %}

```bash
# On your local machine
# Note that this command will wait for the next epoch transition, which may be up to 24 hours in the future.
celocli election:activate --from $CELO_VALIDATOR_VOTE_SIGNER_ADDRESS --wait && celocli election:activate --from $CELO_VALIDATOR_GROUP_VOTE_SIGNER_ADDRESS --wait
```

Check that your votes were activated by re-running the following commands:

```bash
# On your local machine
celocli election:show $CELO_VALIDATOR_GROUP_RG_ADDRESS --voter
celocli election:show $CELO_VALIDATOR_RG_ADDRESS --voter
```

If your Validator Group elects validators, you will receive epoch rewards in the form of additional Locked Gold voting for your Validator Group. You can see these rewards accumulate with the commands in the previous set, as well as:

```bash
# On your local machine
celocli lockedgold:show $CELO_VALIDATOR_GROUP_RG_ADDRESS
celocli lockedgold:show $CELO_VALIDATOR_RG_ADDRESS
```

You're all set! Elections are finalized at the end of each epoch, roughly once a day in the RC1 network. If you get elected, your node will start participating in BFT consensus and validating blocks. After the first epoch in which your Validator participates in BFT, you should receive your first set of epoch rewards.

You can inspect the current state of the Validator elections by running:

```bash
# On your local machine
celocli election:list
```

You can check the status of your Validator, including whether it is elected and signing blocks, at [stats.celo.org/](https://stats.celo.org/) or by running:

```bash
# On your local machine
celocli validator:status --validator $CELO_VALIDATOR_RG_ADDRESS
```

You can see additional information about your Validator, including uptime score, by running:

```bash
# On your local machine
celocli validator:show $CELO_VALIDATOR_RG_ADDRESS
```

### Running the Attestation Service

As part of the [lightweight identity protocol](/celo-codebase/protocol/identity), Validators are expected to run an [Attestation Service](https://github.com/celo-org/celo-monorepo/tree/master/packages/attestation-service) to provide attestations that allow users to map their phone number to an account on Celo. Be sure to allow TCP connections to your Attestations machine on port 80 for all IP addresses.

Just like with the Validator and Vote signer, we'll want to authorize a separate Attestation signer. For that let's start our node on the Attestations machine (keep track of the password you use for this account):

```bash
# On the Attestation machine
# Note that you have to export CELO_IMAGE, NETWORK_ID and CELO_VALIDATOR_RG_ADDRESS on this machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE init /celo/genesis.json
export BOOTNODE_ENODES="$(docker run --rm --entrypoint cat $CELO_IMAGE /celo/bootnodes)"
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account new
export CELO_ATTESTATION_SIGNER_ADDRESS=<YOUR-ATTESTATION-SIGNER-ADDRESS>
```

Let's generate the proof-of-possession for the attestation signer:

```bash
# On the Attestation machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account proof-of-possession $CELO_ATTESTATION_SIGNER_ADDRESS $CELO_VALIDATOR_RG_ADDRESS
```

With this proof, authorize the attestation signer on your local machine:

```bash
# On your local machine
export CELO_ATTESTATION_SIGNER_SIGNATURE=<ATTESTATION-SIGNER-SIGNATURE>
export CELO_ATTESTATION_SIGNER_ADDRESS=<YOUR-ATTESTATION-SIGNER-ADDRESS>
celocli releasegold:authorize --contract $CELO_VALIDATOR_RG_ADDRESS --role attestation --signature 0x$CELO_ATTESTATION_SIGNER_SIGNATURE --signer 0x$CELO_ATTESTATION_SIGNER_ADDRESS
```

You can now run the node for the attestation service in the background. In the below command remember to specify the password you used during the creation of the `CELO_ATTESTATION_SIGNER_ADDRESS`:

```bash
# On the Attestation machine
echo <CELO-ATTESTATION-SIGNER-PASSWORD> > .password
docker run --name celo-attestations -it --restart always -p 127.0.0.1:8545:8545 -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin --unlock $CELO_ATTESTATION_SIGNER_ADDRESS --password /root/.celo/.password --bootnodes $BOOTNODE_ENODES
```

Next we will set up the Attestation Service itself. First, specify the following environment variables:

```bash
# On the Attestation machine
export CELO_IMAGE_ATTESTATION=us.gcr.io/celo-testnet/celo-monorepo:attestation-service-rc1
# if you followed the instruction of setting up the attestation signer
export CELO_PROVIDER=http://localhost:8545
```

### SMS Providers

Currently the SMS providers supported are [Twilio](https://www.twilio.com/try-twilio) and [Nexmo Sign Up form](https://dashboard.nexmo.com/sign-up).

**Twilio**

Twilio is the most common and popular provider. For that you will need to provision the following variables:

| Variable                     | Explanation                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| TWILIO_ACCOUNT_SID           | The Twilio account ID                                           |
| TWILIO_MESSAGING_SERVICE_SID | The Twilio Message Service ID. Starts by `MG`                   |
| TWILIO_AUTH_TOKEN            | The API authentication token                                    |
| TWILIO_BLACKLIST             | A comma-separated list of country codes you do not want to serve |

After you signed up for Twilio at [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio), you should see your `ACCOUNT SID` and your `AUTH_TOKEN` in the top right of the console. You'll also want to enter in a credit card to fund the account. For most text messages, the costs are typically very low (and significantly lower than the attestation fee paid by the user). Find a more comprehensive price list at [https://www.twilio.com/sms/pricing](https://www.twilio.com/sms/pricing). If there are countries that you do not want to serve, you can specify them with the `TWILIO_BLACKLIST`. In any case, you'll want to adjust your Geo settings to serve phone numbers globally under [https://www.twilio.com/console/sms/settings/geo-permissions](https://www.twilio.com/console/sms/settings/geo-permissions).

{% hint style="info" %}
Make sure you can serve requests for numbers in US, Europe, Australia, Mexico, Argentina, the Philippines, and Kenya.
{% endhint %}

To actually be able to send SMS, you need to create a messaging service under [Programmable SMS > SMS](https://www.twilio.com/console/sms/services). The resulting `SID` you want to specify under the `TWILIO_MESSAGING_SERVICE_SID`. Now that you have provisioned your messaging service, you need to buy at least 1 phone number to send SMS from. You can do so under the `Numbers` option of the messaging service page. To maximize the chances of reliable and prompt SMS sending (and thus attestation fee revenue), you can buy numbers in many locales, and Twilio will intelligently select the best number to send each SMS.

**Nexmo**

Here is the list of the environment variables needed to use the Nexmo SMS broker:

| Variable        | Explanation                                                     |
| --------------- | --------------------------------------------------------------- |
| NEXMO_KEY       | The API key to the Nexmo API                                    |
| NEXMO_SECRET    | The API secret to the Nexmo API                                 |
| NEXMO_BLACKLIST | A comma-separated list of country codes you do not want to serve |

### Database Configuration

For storing and retrieving the attestation requests the service needs a database to persist that information. Currently `sqlite`, `postgres` and `mysql` are supported. For testing purposes you can use `sqlite` but it's recommended to run a stand-alone database server using `mysql` or `postgres` if your intention is running the Attestation Service in a production environment. If you are running on a popular cloud provider, consider using their hosted SQL services.

Depending on your database technology you need to create a database with the access for a specific user and password.

For specifying the database url you need to setup the `DATABASE_URL` variable in one of these ways:

```bash
# On the Attestation machine
export DATABASE_URL="sqlite://db/attestation.db"
export DATABASE_URL="mysql://user:password@mysql.example.com:3306/attestation-service"
export DATABASE_URL="postgres://user:password@postgres.example.com:5432/attestation-service"
```

**Example of setting up a local postgres database on Ubuntu**:

```bash
apt install postgresql
sudo -u postgres createdb attestation-service
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '<DATABASE_PASSWORD>';"
export DATABASE_URL="postgres://postgres:<DATABASE_PASSWORD>@localhost:5432/attestation-service"
```

## Running the Attestation Service

The following command for running the Attestation Service is using Twilio and uses `--network host` to access a local database (only works on Linux):

```bash
# On the Attestation machine
docker run --name celo-attestation-service -it --restart always --entrypoint /bin/bash --network host -e ATTESTATION_SIGNER_ADDRESS=0x$CELO_ATTESTATION_SIGNER_ADDRESS -e CELO_VALIDATOR_ADDRESS=0x$CELO_VALIDATOR_RG_ADDRESS -e CELO_PROVIDER=$CELO_PROVIDER -e DATABASE_URL=$DATABASE_URL -e SMS_PROVIDERS=twilio -e TWILIO_MESSAGING_SERVICE_SID=$TWILIO_MESSAGING_SERVICE_SID -e TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID -e TWILIO_BLACKLIST=$TWILIO_BLACKLIST -e TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN -e PORT=80 -p 80:80 $CELO_IMAGE_ATTESTATION -c " cd /celo-monorepo/packages/attestation-service && yarn run db:migrate && yarn start "
```

### Registering Metadata

Celo uses [Metadata](../celo-codebase/protocol/identity/metadata.md) to allow accounts to make certain claims without having to do so on-chain. Users can use any authorized signer address to make claims on behalf of the registered Account. For convenience this guide uses the `CELO_ATTESTATION_SIGNER_ADDRESS`, but any authorized signer will work. To complete the metadata process, we have to claim which URL users can request attestations from.

Run the following commands on your local machine:

```bash
# On your local machine
celocli account:create-metadata ./metadata.json --from 0x$CELO_VALIDATOR_RG_ADDRESS
```

The `CELO_ATTESTATION_SERVICE_URL` variable stores the URL to access the Attestation Service deployed. In the following command we specify the URL where this Attestation Service is:

```bash
# On your local machine
celocli account:claim-attestation-service-url ./metadata.json --url $CELO_ATTESTATION_SERVICE_URL --from 0x$CELO_ATTESTATION_SIGNER_ADDRESS
```

You should now host your metadata somewhere reachable via HTTP. You can use a service like [gist.github.com](https://gist.github.com). Create a gist with the contents of the file and then click on the `Raw` button to receive the permalink to the machine-readable file.

Now we can register this url for others to see. To do this, we must have the `beneficiary` address of the `ReleaseGold` contract (`CELO_VALIDATOR_ADDRESS`) unlocked:

```bash
# On your local machine
celocli releasegold:set-account --contract $CELO_VALIDATOR_RG_ADDRESS --property metaURL --value <METADATA_URL>
```

If everything goes well users should be able to see your claims by running:

```bash
# On your local machine
celocli account:get-metadata $CELO_VALIDATOR_RG_ADDRESS
```

You can run the following command to test if you properly setup your attestation service:

```bash
# On your local machine
celocli identity:test-attestation-service --from $CELO_ATTESTATION_SIGNER_ADDRESS --phoneNumber <YOUR-PHONE-NUMBER-E164-FORMAT> --message <YOUR_MESSAGE>
```

If this works then your attestation service should be successfully deployed!

## Deployment Tips

### Running the Docker containers in the background

There are different options for executing Docker containers in the background. The most typical one is to use in your docker run commands the `-d` option. Also for long running processes, especially when you run in on a remote machine, you can use a tool like [screen](https://ss64.com/osx/screen.html). It allows you to connect and disconnect from running processes providing an easy way to manage long running processes.

It's out of the scope of this documentation to go through the `screen` options, but you can use the following command format with your `docker` commands:

```bash
screen -S <SESSION NAME> -d -m <YOUR COMMAND>
```

For example:

```bash
screen -S celo-validator -d -m docker run --name celo-validator -it --restart unless-stopped -p 127.0.0.1:8545:8545 .......
```

You can list your existing `screen` sessions:

```bash
screen -ls
```

And re-attach to any of the existing sessions:

```bash
screen -r -S celo-validator
```

### Stopping containers

You can stop the Docker containers at any time without problem. If you stop your containers that means those containers stop providing service.
The data directory of the Validator and the proxy are Docker volumes mounted in the containers from the `celo-*-dir` you created at the very beginning. So if you don't remove that folder, you can stop or restart the containers without losing any data.

It is recommended to use the Docker stop timeout parameter `-t` when stopping the containers. This allows time, in this case 60 seconds, for the Celo nodes to flush recent chain data it keeps in memory into the data directories. Omitting this may cause your blockchain data to corrupt, requiring the node to start syncing from scratch.

You can stop the `celo-validator` and `celo-proxy` containers running:

```bash
docker stop celo-validator celo-proxy -t 60
```

And you can remove the containers (not the data directory) by running:

```bash
docker rm -f celo-validator celo-proxy
```
