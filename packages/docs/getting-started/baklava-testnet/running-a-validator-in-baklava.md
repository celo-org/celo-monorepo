# Running a Validator

The Baklava Testnet is a non-production Testnet for the Validator community. It serves several purposes:

* **Operational excellence**: Build familiarity with the processes used on Mainnet, and to verify the security and stability of your infrastructure with the new software.
* **Detecting vulnerabilities**: Discover bugs in new software releases before they reach Mainnet.
* **Testing ground**: Experiment with new infrastructure configurations in a low-risk environment.

{% hint style="info" %}
If you would like to keep up-to-date with all the news happening in the Celo community, including validation, node operation and governance, please sign up to our [Celo Signal mailing list here](https://celo.activehosted.com/f/15).

You can add the [Celo Signal public calendar](https://calendar.google.com/calendar/u/0/embed?src=c_9su6ich1uhmetr4ob3sij6kaqs@group.calendar.google.com) as well which has relevant dates.
{% endhint %}

The Baklava testnet is the best place to get started running a validator, or test out new validator configurations before deploying to [Mainnet](../mainnet/).

{% hint style="info" %}
If you are transitioning from the Baklava network prior to the June 24 reset, you will need to start with a fresh chain database. You can create new nodes from fresh machines, as described in this guide, or you may delete your chaindata folder, which is named `celo` in the node data directory, and start over by running the provided `init` commands for each node described below. All on-chain registration steps, the commands completed with `celocli`, will need to be run on the new network.

Key differences are:

* New network ID is `62320`
* A new image has been pushed to `us.gcr.io/celo-org/geth:baklava`
* A new genesis block, bootnode enode, and the new network ID are included in the Docker image
* `ReleaseGold` contracts are available for all previously faucetted addresses [here](https://gist.github.com/nategraf/245232883a34cbb162eb599e34afd7c0)
{% endhint %}

This page also has separate steps for both ReleaseGold and non-ReleaseGold steps for validating.

{% hint style="info" %}
If you are new to validating on Celo, please follow the Non-ReleaseGold instructions for validating.
{% endhint %}

## Prerequisites

### Staking Requirements

Celo uses a [proof-of-stake](../../celo-codebase/protocol/proof-of-stake/) consensus mechanism, which requires Validators to have locked CELO to participate in block production. The current requirement is 10,000 CELO to register a Validator, and 10,000 CELO _per member validator_ to register a Validator Group.

Participating in the Baklava testnet requires testnet units of CELO, which can only be used in the Baklava testnet. You can request a distribution of testnet CELO by filling out [the faucet request form](https://forms.gle/JTYkMAJWTAUQp1sv9). If you need any help getting started, please join the discussion on [Discord](https://chat.celo.org) or email community@celo.org.

Faucetted funds come two different ways, depending on whether you're using a ReleaseGold smart contract or you are validating the non-ReleaseGold way. For every new validator, we encourage going the non-ReleaseGold route.

#### ReleaseGold

Faucetted funds will come as two `ReleaseGold` contracts. At a high level, `ReleaseGold` holds a balance for scheduled release, while allowing the held balance to be used for certain actions such as validating and voting, depending on the configuration of the contract. [Read more about `ReleaseGold`](../../celo-owner-guide/release-gold.md).

#### Non-ReleaseGold

{% hint style="info" %}
If you are new to validating on Celo, please follow the Non-ReleaseGold instructions for validating.
{% endhint %}

Faucetted funds will come as 2 transactions, one for your validator address and another for your validator group address.

### Hardware requirements

The recommended Celo Validator setup involves continually running three instances:

* 1 **Validator node**: should be deployed to single-tenant hardware in a secure, high availability data center
* 1 **Validator Proxy node**: can be a VM or container in a multi-tenant environment \(e.g. a public cloud\), but requires high availability
* 1 **Attestation node**: can be a VM or container in a multi-tenant environment \(e.g. a public cloud\), and has moderate availability requirements

Celo is a proof-of-stake network, which has different hardware requirements than a Proof of Work network. proof-of-stake consensus is less CPU intensive, but is more sensitive to network connectivity and latency. Below is a list of standard requirements for running Validator and Proxy nodes on the Celo Network:

* Memory: 8 GB RAM
* CPU: Quad core 3GHz \(64-bit\)
* Disk: 256 GB of SSD storage, plus a secondary HDD desirable
* Network: At least 1 GB input/output Ethernet with a fiber Internet connection, ideally redundant connections and HA switches

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

| Machine \ IPs open to | 0.0.0.0/0 \(all\) | your-validator-ip | your-proxy-ip |
| :--- | :--- | :--- | :--- |
| Validator |  |  | tcp:30503 |
| Proxy | tcp:30303, udp:30303 | tcp:30503 |  |
| Attestation | tcp:80 |  |  |

### Software requirements

#### On each machine

* **You have Docker installed.**

  If you don’t have it already, follow the instructions here: [Get Started with Docker](https://www.docker.com/get-started). It will involve creating or signing in with a Docker account, downloading a desktop app, and then launching the app to be able to use the Docker CLI. If you are running on a Linux server, follow the instructions for your distro [here](https://docs.docker.com/install/#server). You may be required to run Docker with `sudo` depending on your installation environment. You can check you have Docker installed and running if the command `docker info` works properly.

#### On your local machine

* **You have celocli installed.**

  See [Command Line Interface \(CLI\) ](../../command-line-interface/introduction.md)for instructions on how to get set up.

* **You are using the latest Node.js v12.x**

  Some users have reported issues using the most recent version of node. Use the LTS for greater reliability.

{% hint style="info" %}
A note about conventions: The code snippets you'll see on this page are bash commands and their output.

When you see text in angle brackets &lt;&gt;, replace them and the text inside with your own value of what it refers to. Don't include the &lt;&gt; in the command.
{% endhint %}

### Key Management

Private keys are the central primitive of any cryptographic system and need to be handled with extreme care. Loss of your private key can lead to irreversible loss of value.

This guide contains a large number of keys, so it is important to understand the purpose of each key. [Read more about key management.](../../validator-guide/summary/)

#### Unlocking

Celo nodes store private keys encrypted on disk with a password, and need to be "unlocked" before use. Private keys can be unlocked in two ways:

1. By running the `celocli account:unlock` command. Note that the node must have the "personal" RPC API enabled in order for this command to work.
2. By setting the `--unlock` flag when starting the node.

It is important to note that when a key is unlocked you need to be particularly careful about enabling access to the node's RPC APIs.

### Environment variables

There are a number of environment variables in this guide, and you may use this table as a reference.

| Variable | Explanation |
| :--- | :--- |
| CELO\_IMAGE | The Docker image used for the Validator and proxy containers |
| CELO\_VALIDATOR\_GROUP\_ADDRESS | The account address for the Validator Group; the `ReleaseGold` beneficiary address for the Validator Group |
| CELO\_VALIDATOR\_ADDRESS | The account address for the Validator; the `ReleaseGold` beneficiary address for the Validator |
| CELO\_VALIDATOR\_GROUP\_RG\_ADDRESS | The `ReleaseGold` contract address for the Validator Group \(Not Applicable for New Validators\) |
| CELO\_VALIDATOR\_RG\_ADDRESS | The `ReleaseGold` contract address for the Validator \(Not Applicable for New Validators\) |
| CELO\_VALIDATOR\_GROUP\_SIGNER\_ADDRESS | The validator \(group\) signer address authorized by the Validator Group account. |
| CELO\_VALIDATOR\_GROUP\_SIGNER\_SIGNATURE | The proof-of-possession of the Validator Group signer key |
| CELO\_VALIDATOR\_SIGNER\_ADDRESS | The validator signer address authorized by the Validator Account |
| CELO\_VALIDATOR\_SIGNER\_PUBLIC\_KEY | The ECDSA public key associated with the Validator signer address |
| CELO\_VALIDATOR\_SIGNER\_SIGNATURE | The proof-of-possession of the Validator signer key |
| CELO\_VALIDATOR\_SIGNER\_BLS\_PUBLIC\_KEY | The BLS public key for the Validator instance |
| CELO\_VALIDATOR\_SIGNER\_BLS\_SIGNATURE | A proof-of-possession of the BLS public key |
| CELO\_VALIDATOR\_GROUP\_VOTE\_SIGNER\_ADDRESS | The address of the Validator Group vote signer |
| CELO\_VALIDATOR\_GROUP\_VOTE\_SIGNER\_PUBLIC\_KEY | The ECDSA public key associated with the Validator Group vote signer address |
| CELO\_VALIDATOR\_GROUP\_VOTE\_SIGNER\_SIGNATURE | The proof-of-possession of the Validator Group vote signer key |
| CELO\_VALIDATOR\_VOTE\_SIGNER\_ADDRESS | The address of the Validator vote signer |
| CELO\_VALIDATOR\_VOTE\_SIGNER\_PUBLIC\_KEY | The ECDSA public key associated with the Validator vote signer address |
| CELO\_VALIDATOR\_VOTE\_SIGNER\_SIGNATURE | The proof-of-possession of the Validator vote signer key |
| PROXY\_ENODE | The enode address for the Validator proxy |
| PROXY\_INTERNAL\_IP | \(Optional\) The internal IP address over which your Validator can communicate with your proxy |
| PROXY\_EXTERNAL\_IP | The external IP address of the proxy. May be used by the Validator to communicate with the proxy if PROXY\_INTERNAL\_IP is unspecified |
| CELO\_ATTESTATION\_SIGNER\_ADDRESS | The address of the attestation signer authorized by the Validator Account |
| CELO\_ATTESTATION\_SIGNER\_SIGNATURE | The proof-of-possession of the attestation signer key |
| CELO\_ATTESTATION\_SERVICE\_URL | The URL to access the deployed Attestation Service |
| METADATA\_URL | The URL to access the metadata file for your Attestation Service |
| DATABASE\_URL | The URL under which your database is accessible, currently supported are `postgres://`, `mysql://` and `sqlite://` |
| APP\_SIGNATURE | The hash with which clients can auto-read SMS messages on android |
| SMS\_PROVIDERS | A comma-separated list of providers you want to configure, Celo currently supports `nexmo` & `twilio` |

## Validator Node Setup

This section outlines the steps needed to configure your Proxy and Validator nodes so that they are ready to sign blocks once elected.

### Environment Variables

First we are going to set up the main environment variables related to the Baklava network. Run these on both your **Validator** and **Proxy** machines:

```bash
export CELO_IMAGE=us.gcr.io/celo-org/geth:baklava
```

### Pull the Celo Docker image

In all the commands we are going to see the `CELO_IMAGE` variable to refer to the Docker image to use. Now we can get the Docker image on your Validator and Proxy machines:

```bash
docker pull $CELO_IMAGE
```

The `us.gcr.io/celo-org/geth:baklava` image contains the [genesis block](https://github.com/celo-org/celo-monorepo/tree/master/packages/celotool/genesis_baklava.json) in addition to the Celo Blockchain binary.

#### Account Creation \(For non-ReleaseGold\)

{% hint style="info" %}
Please complete this section if you are new to validating on Celo.
{% endhint %}

If you're a new validator, then you are going to follow the non-ReleaseGold flow method for this step to create your account keys.

**Account and Signer keys**

Running a Celo Validator node requires the management of several different keys, each with different privileges. Keys that need to be accessed frequently \(e.g. for signing blocks\) are at greater risk of being compromised, and thus have more limited permissions, while keys that need to be accessed infrequently \(e.g. for locking CELO\) are less onerous to store securely, and thus have more expansive permissions. Below is a summary of the various keys that are used in the Celo network, and a description of their permissions.

| Name of the key | Purpose |
| :--- | :--- |
| Account key | This is the key with the highest level of permissions, and is thus the most sensitive. It can be used to lock and unlock CELO, and authorize vote, validator, and attestation keys. Note that the account key also has all of the permissions of the other keys. |
| Validator signer key | This is the key that has permission to register and manage a Validator or Validator Group, and participate in BFT consensus. |
| Vote signer key | This key can be used to vote in Validator elections and on-chain governance. |
| Attestation signer key | This key is used to sign attestations in Celo's lightweight identity protocol. |

Note that Account and all the signer keys must be unique and may not be reused.

**Generating Validator and Validator Group Keys**

First, you'll need to generate account keys for your Validator and Validator Group.

{% hint style="danger" %}
These keys will control your locked CELO, and thus should be handled with care. Store and back these keys up in a secure manner, as there will be no way to recover them if lost or stolen.
{% endhint %}

```bash
# On your local machine
mkdir celo-accounts-node
cd celo-accounts-node
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account new
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account new
```

This will create a new keystore in the current directory with two new accounts. Copy the addresses from the terminal and set the following environment variables:

```bash
# On your local machine
export CELO_VALIDATOR_GROUP_ADDRESS=<YOUR-VALIDATOR-GROUP-ADDRESS>
export CELO_VALIDATOR_ADDRESS=<YOUR-VALIDATOR-ADDRESS>
```

### Start your Accounts node

Next, we'll run a node on your local machine so that we can use these accounts to lock CELO and authorize the keys needed to run your validator.

To run the node:

```bash
# On your local machine
mkdir celo-accounts-node
cd celo-accounts-node
docker run --name celo-accounts -it --restart always --stop-timeout 300 -p 127.0.0.1:8545:8545 -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal --baklava --light.serve 0 --datadir /root/.celo
```

{% hint style="danger" %}
**Security**: The command line above includes the parameter `--rpcaddr 0.0.0.0` which makes the Celo Blockchain software listen for incoming RPC requests on all network adaptors. Exercise extreme caution in doing this when running outside Docker, as it means that any unlocked accounts and their funds may be accessed from other machines on the Internet. In the context of running a Docker container on your local machine, this together with the `docker -p 127.0.0.1:localport:containerport` flags allows you to make RPC calls from outside the container, i.e from your local host, but not from outside your machine. Read more about [Docker Networking](https://docs.docker.com/network/network-tutorial-standalone/#use-user-defined-bridge-networks) here.
{% endhint %}

### Deploy a Validator

To actually register as a validator, we'll need to generate a validating signer key. On your Validator machine \(which should not be accessible from the public internet\), follow very similar steps:

```bash
# On the validator machine
# Note that you have to export $CELO_IMAGE on this machine
export CELO_IMAGE=us.gcr.io/celo-org/geth:baklava
mkdir celo-validator-node
cd celo-validator-node
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account new
export CELO_VALIDATOR_SIGNER_ADDRESS=<YOUR-VALIDATOR-SIGNER-ADDRESS>
```

#### Proof-of-Possession \(Non-ReleaseGold Step\)

{% hint style="info" %}
Please complete this step if you are running a validator on Celo for the first time.
{% endhint %}

In order to authorize our Validator signer, we need to create a proof that we have possession of the Validator signer private key. We do so by signing a message that consists of the Validator account address. To generate the proof-of-possession, run the following command:

```bash
# On the validator machine
# Note that you have to export CELO_VALIDATOR_ADDRESS on this machine
export CELO_VALIDATOR_ADDRESS=<CELO-VALIDATOR-ADDRESS>
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account proof-of-possession $CELO_VALIDATOR_SIGNER_ADDRESS $CELO_VALIDATOR_ADDRESS
```

Save the signer address, public key, and proof-of-possession signature to your local machine:

```bash
# On your local machine
export CELO_VALIDATOR_SIGNER_ADDRESS=<YOUR-VALIDATOR-SIGNER-ADDRESS>
export CELO_VALIDATOR_SIGNER_SIGNATURE=<YOUR-VALIDATOR-SIGNER-SIGNATURE>
export CELO_VALIDATOR_SIGNER_PUBLIC_KEY=<YOUR-VALIDATOR-SIGNER-PUBLIC-KEY>
```

Validators on the Celo network use BLS aggregated signatures to create blocks in addition to the Validator signer \(ECDSA\) key. While an independent BLS key can be specified, the simplest thing to do is to derive the BLS key from the Validator signer key. When we register our Validator, we'll need to prove possession of the BLS key as well, which can be done by running the following command:

```bash
# On the validator machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account proof-of-possession $CELO_VALIDATOR_SIGNER_ADDRESS $CELO_VALIDATOR_ADDRESS --bls
```

Save the resulting signature and public key to your local machine:

```bash
# On your local machine
export CELO_VALIDATOR_SIGNER_BLS_SIGNATURE=<YOUR-VALIDATOR-SIGNER-SIGNATURE>
export CELO_VALIDATOR_SIGNER_BLS_PUBLIC_KEY=<YOUR-VALIDATOR-SIGNER-BLS-PUBLIC-KEY>
```

We'll get back to this machine later, but for now, let's give it a proxy.

### Deploy a proxy

```bash
# On the proxy machine
mkdir celo-proxy-node
cd celo-proxy-node
export CELO_VALIDATOR_SIGNER_ADDRESS=<YOUR-VALIDATOR-SIGNER-ADDRESS>
```

You can then run the proxy with the following command. Be sure to replace `<YOUR-VALIDATOR-NAME>` with the name you'd like to appear on Celostats. The validator name shown in [Celostats](https://baklava-celostats.celo-testnet.org/) will be the name configured in the proxy.

Additionally, you need to unlock the account configured in the `etherbase` option. It is recommended to create a new account and independent account only for this purpose. Be sure to write a new password to `./.password` for this account \(different to the Validator Signer password\)

```bash
# On the proxy machine
# First, we create a new account for the proxy
docker run --name celo-proxy-password -it --rm  -v $PWD:/root/.celo $CELO_IMAGE account new --password /root/.celo/.password
```

Notice the public address returned by this command, that can be exported and used for running the proxy node:

```bash
# On the proxy machine
export PROXY_ADDRESS=<PROXY-PUBLIC-ADDRESS>
docker run --name celo-proxy -it --restart unless-stopped --stop-timeout 300 -p 30303:30303 -p 30303:30303/udp -p 30503:30503 -p 30503:30503/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --nousb --syncmode full --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_SIGNER_ADDRESS --proxy.internalendpoint :30503 --etherbase $PROXY_ADDRESS --unlock $PROXY_ADDRESS --password /root/.celo/.password --allow-insecure-unlock --baklava --datadir /root/.celo --celostats=<YOUR-VALIDATOR-NAME>@baklava-celostats-server.celo-testnet.org
```

{% hint style="info" %}
You can detach from the running container by pressing `ctrl+p ctrl+q`, or start it with `-d` instead of `-it` to start detached. Access the logs for a container in the background with the `docker logs` command.
{% endhint %}

**NOTES**

* For the proxy to be able to send stats to [Celostats](https://baklava-celostats.celo-testnet.org/), both the proxy and the validator should set the `celostats` flag
* If you are deploying multiple proxies for the same validator, the `celostats` flag should be added in only one of them

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

### Connect the Validator to the Proxy

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
docker run --name celo-validator -it --restart unless-stopped --stop-timeout 300 -p 30303:30303 -p 30303:30303/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --syncmode full --mine --etherbase $CELO_VALIDATOR_SIGNER_ADDRESS --nodiscover --nousb --proxy.proxied --proxy.proxyenodeurlpairs=enode://$PROXY_ENODE@$PROXY_INTERNAL_IP:30503\;enode://$PROXY_ENODE@$PROXY_EXTERNAL_IP:30303 --unlock=$CELO_VALIDATOR_SIGNER_ADDRESS --password /root/.celo/.password --celostats=<YOUR-VALIDATOR-NAME>@baklava-celostats-server.celo-testnet.org --baklava --datadir /root/.celo
```

At this point your Validator and Proxy machines should be configured, and both should be syncing to the network. You should see `Imported new chain segment` in your node logs, about once every 5 seconds once the node is synced to the latest block which you can find on the [Baklava Network Stats](https://baklava-celostats.celo-testnet.org/) page.

{% hint style="info" %}
You can run multiple proxies by deploying additional proxies per the instructions in the [Deploy a proxy](running-a-validator-in-baklava.md#deploy-a-proxy) section. Then add all of the proxies' enodes as a comma seperated list using the `--proxy.proxyenodeurlpairs` option. E.g. if there are two proxies, that option's usage would look like `--proxy.proxyenodeurlpairs=enode://$PROXY_ENODE_1@$PROXY_INTERNAL_IP_1:30503\;enode://$PROXY_ENODE_1@$PROXY_EXTERNAL_IP_1:30303,enode://$PROXY_ENODE_2@$PROXY_INTERNAL_IP_2:30503\;enode://$PROXY_ENODE_2@$PROXY_EXTERNAL_IP_2:30303`
{% endhint %}

## Registering as a Validator \(ReleaseGold Registration\)

In order to operate as a Validator, you must register on-chain and be elected. Elections will run on each epoch boundary, approximately every 24 hours, after elections have been unfrozen by on-chain governance. Eligible validator groups will be considered in an Election mechanism that will select Validator based on the [D'Hondt method](https://en.wikipedia.org/wiki/D%27Hondt_method).

In the following steps, this guide will assume your CELO is held in a `ReleaseGold` contract, if this is not the case, the commands will need to be adjusted. At a high level, `ReleaseGold` holds a balance for scheduled release, while allowing the held balance to be used for certain actions such as validating and voting, depending on the configuration of the contract. [Read more about `ReleaseGold`.](../../celo-owner-guide/release-gold.md)

The following sections outline the actions you will need to take. On a high level, we will:

* Create Accounts and lock up the balance of each `ReleaseGold` contract
* Register a Validator
* Register a Validator Group
* Add the registered Validator to the Validator Group
* Vote for the group with funds from each `ReleaseGold` contract

### Create Accounts from the `ReleaseGold` contracts

In order to participate on the network \(lock gold, vote, validate\) from a `ReleaseGold` contract, we need to create a registered Account with the address of the `ReleaseGold` contract.

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
When running the following commands, the Beneficiary keys should be [unlocked](running-a-validator-in-baklava.md#unlocking).
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

Lock CELO from your `ReleaseGold` contracts to fulfill the lock-up requirements to register a Validator and Validator Group. The current requirement is any value strictly greater than 10,000 CELO to register a Validator, and any value strictly greater than 10,000 CELO _per member validator_ to register a Validator Group. Here we lock up 10000.1 CELO for each.

```bash
celocli releasegold:locked-gold --contract $CELO_VALIDATOR_GROUP_RG_ADDRESS --action lock --value 100001e17
celocli releasegold:locked-gold --contract $CELO_VALIDATOR_RG_ADDRESS --action lock --value 100001e17
```

Check that your CELO was successfully locked with the following commands:

```bash
# On your local machine
celocli lockedgold:show $CELO_VALIDATOR_GROUP_RG_ADDRESS
celocli lockedgold:show $CELO_VALIDATOR_RG_ADDRESS
```

### Register as a Validator

In order to perform Validator actions with the Account created in the previous step, you will need to authorize a [Validator signer](../../validator-guide/summary/detailed.md#authorized-validator-signers) for the `ReleaseGold` contract account.

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

Validators on the Celo network use BLS aggregated signatures to create blocks in addition to the Validator signer \(ECDSA\) key. While an independent BLS key can be specified, the simplest thing to do is to derive the BLS key from the Validator signer. When we register our Validator, we'll need to prove possession of the BLS key as well, which can be done by running the following command.

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
celocli releasegold:authorize --contract $CELO_VALIDATOR_RG_ADDRESS --role validator --signature 0x$CELO_VALIDATOR_SIGNER_SIGNATURE --signer $CELO_VALIDATOR_SIGNER_ADDRESS --blsKey $CELO_VALIDATOR_SIGNER_BLS_PUBLIC_KEY --blsPop $CELO_VALIDATOR_SIGNER_BLS_SIGNATURE
```

{% hint style="info" %}
The first time you authorize a validator signer for a ReleaseGold account the signer address is funded 1 CELO to cover transaction fees. Any subsequent signer keys you authorize will not be funded, and you will need to transfer a nominal amount of CELO to them from other accounts.
{% endhint %}

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

In order to register a Validator Group, you will need to authorize a validator \(group\) signer on behalf of the `ReleaseGold` registered Account. In these steps you will create a new key on your local machine for this purpose.

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

With this newly authorized signer, you can register a Validator Group on behalf of the registered Account:

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
Epoch lengths in the Baklava network are set to be the number of blocks produced in a day. As a result, votes may need to be activated up to 24 hours after they are cast.
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

If your Validator Group elects validators, you will receive epoch rewards in the form of additional Locked CELO voting for your Validator Group. You can see these rewards accumulate with the commands in the previous set, as well as:

```bash
# On your local machine
celocli lockedgold:show $CELO_VALIDATOR_GROUP_RG_ADDRESS
celocli lockedgold:show $CELO_VALIDATOR_RG_ADDRESS
```

You're all set! Elections are finalized at the end of each epoch, roughly once a day in the Baklava testnet. If you get elected, your node will start participating in BFT consensus and validating blocks. After the first epoch in which your Validator participates in BFT, you should receive your first set of epoch rewards.

You can inspect the current state of the Validator elections by running:

```bash
# On your local machine
celocli election:list
```

You can check the status of your Validator, including whether it is elected and signing blocks, at [baklava-celostats.celo-testnet.org](https://baklava-celostats.celo-testnet.org) or by running:

```bash
# On your local machine
celocli validator:status --validator $CELO_VALIDATOR_RG_ADDRESS
```

You can see additional information about your Validator, including uptime score, by running:

```bash
# On your local machine
celocli validator:show $CELO_VALIDATOR_RG_ADDRESS
```

## Registering as a Validator \(Non-ReleaseGold\)

If you are new to validating on Baklava, then you most likely need to be following the Non-ReleaseGold steps for getting your validator up and running. ReleaseGold is done in the previous section and only concerns those who are generating accounts with ReleaseGold smart contract.

### Register the Accounts

You've now done all the infrastructure setup to get a validator and proxy running. The cLabs team will review your submission to receive funds and send you 12,000 Baklava testnet CELO to each of your Validator and Validator Group account addresses. These funds have no real world value but will allow you to submit transactions to the network via [`celocli`](https://docs.celo.org/command-line-interface/introduction) and put up a stake to register as a validator and validator group.

You can view your CELO balances by running the following commands:

```bash
# On your local machine
celocli account:balance $CELO_VALIDATOR_GROUP_ADDRESS
celocli account:balance $CELO_VALIDATOR_ADDRESS
```

At some point the output of these commands will change from `0` to `12e12`, indicating you have received the testnet CELO. This process involves a human, so please be patient. If you haven't received a balance within 24 hours, please get in touch again.

You can also look at an account's current balance and transaction history on [Blockscout](https://baklava-blockscout.celo-testnet.org/). Enter the address into the search bar.

Once these accounts have a balance, unlock them so that we can sign transactions. Then, we will register the accounts with the Celo core smart contracts:

```bash
# On your local machine
celocli account:unlock $CELO_VALIDATOR_GROUP_ADDRESS
celocli account:unlock $CELO_VALIDATOR_ADDRESS
celocli account:register --from $CELO_VALIDATOR_GROUP_ADDRESS --name <NAME YOUR VALIDATOR GROUP>
celocli account:register --from $CELO_VALIDATOR_ADDRESS --name <NAME YOUR VALIDATOR>
```

Check that your accounts were registered successfully with the following commands:

```bash
# On your local machine
celocli account:show $CELO_VALIDATOR_GROUP_ADDRESS
celocli account:show $CELO_VALIDATOR_ADDRESS`
```

### Lock up CELO

Lock up testnet CELO for both accounts in order to secure the right to register a Validator and Validator Group. The current requirement is 10,000 CELO to register a validator, and 10,000 CELO _per member validator_ to register a Validator Group. For Validators, this gold remains locked for approximately 60 days following deregistration. For groups, this gold remains locked for approximately 60 days following the removal of the Nth validator from the group.

```bash
# On your local machine
celocli lockedgold:lock --from $CELO_VALIDATOR_GROUP_ADDRESS --value 10000000000000000000000
celocli lockedgold:lock --from $CELO_VALIDATOR_ADDRESS --value 10000000000000000000000
```

This amount \(10,000 CELO\) represents the minimum amount needed to be locked in order to register a Validator and Validator group. Since your balance is in fact higher than this, you may wish to lock more with these accounts. Note that you will want to be sure to leave enough CELO unlocked to be able to continue to pay transaction fees for future transactions \(such as those issued by running some CLI commands\).

Check that your CELO was successfully locked with the following commands:

```bash
# On your local machine
celocli lockedgold:show $CELO_VALIDATOR_GROUP_ADDRESS
celocli lockedgold:show $CELO_VALIDATOR_ADDRESS
```

### Run for election

In order to be elected as a Validator, you will first need to register your group and Validator. Note that when registering a Validator Group, you need to specify a [commission](../../celo-codebase/protocol/proof-of-stake/validator-groups.md#group-share), which is the fraction of epoch rewards paid to the group by its members.

We don't want to use our account key for validating, so first let's authorize the validator signing key:

```bash
# On your local machine
celocli account:authorize --from $CELO_VALIDATOR_ADDRESS --role validator --signature 0x$CELO_VALIDATOR_SIGNER_SIGNATURE --signer 0x$CELO_VALIDATOR_SIGNER_ADDRESS
```

Confirm by checking the authorized Validator signer for your Validator:

```bash
# On your local machine
celocli account:show $CELO_VALIDATOR_ADDRESS
```

Then, register your Validator Group by running the following command. Note that because we did not authorize a Validator signer for our Validator Group account, we register the Validator Group with the account key.

```bash
# On your local machine
celocli validatorgroup:register --from $CELO_VALIDATOR_GROUP_ADDRESS --commission 0.1
```

You can view information about your Validator Group by running the following command:

```bash
# On your local machine
celocli validatorgroup:show $CELO_VALIDATOR_GROUP_ADDRESS
```

Next, register your Validator by running the following command. Note that because we have authorized a Validator signer, this step could also be performed on the Validator machine. Running it on the local machine allows us to avoid needing to install the [`celocli`](https://docs.celo.org/command-line-interface/introduction) on the Validator machine.

```bash
# On your local machine
celocli validator:register --from $CELO_VALIDATOR_ADDRESS --ecdsaKey $CELO_VALIDATOR_SIGNER_PUBLIC_KEY --blsKey $CELO_VALIDATOR_SIGNER_BLS_PUBLIC_KEY --blsSignature $CELO_VALIDATOR_SIGNER_BLS_SIGNATURE
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

Next, double check that your Validator is now a member of your Validator Group:

```bash
# On your local machine
celocli validator:show $CELO_VALIDATOR_ADDRESS
celocli validatorgroup:show $CELO_VALIDATOR_GROUP_ADDRESS
```

Use both accounts to vote for your Validator Group. Note that because we have not authorized a vote signer for either account, these transactions must be sent from the account keys. Since you're likely to need to place additional votes throughout the course of the stake-off, consider creating and authorizing vote signers for additional operational security.

```bash
# On your local machine
celocli election:vote --from $CELO_VALIDATOR_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS --value 10000000000000000000000
celocli election:vote --from $CELO_VALIDATOR_GROUP_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS --value 10000000000000000000000
```

Double check that your votes were cast successfully:

```bash
# On your local machine
celocli election:show $CELO_VALIDATOR_GROUP_ADDRESS --group
celocli election:show $CELO_VALIDATOR_GROUP_ADDRESS --voter
celocli election:show $CELO_VALIDATOR_ADDRESS --voter
```

Users in the Celo protocol receive epoch rewards for voting in Validator Elections only after submitting a special transaction to enable them. This must be done every time new votes are cast, and can only be made after the most recent epoch has ended. For convenience, we can use the following command, which will wait until the epoch has ended before sending a transaction:

```bash
# On your local machine
# Note that this may take some time, as the epoch needs to end before votes can be activated
celocli election:activate --from $CELO_VALIDATOR_ADDRESS --wait && celocli election:activate --from $CELO_VALIDATOR_GROUP_ADDRESS --wait
```

Check that your votes were activated by re-running the following commands:

```bash
# On your local machine
celocli election:show $CELO_VALIDATOR_GROUP_ADDRESS --voter
celocli election:show $CELO_VALIDATOR_ADDRESS --voter
```

If your Validator Group elects validators, you will receive epoch rewards in the form of additional Locked CELO voting for your Validator Group from your account addresses. You can see these rewards accumulate with the commands in the previous set, as well as:

```bash
# On your local machine
celocli lockedgold:show $CELO_VALIDATOR_GROUP_ADDRESS
celocli lockedgold:show $CELO_VALIDATOR_ADDRESS
```

You're all set! Elections are finalized at the end of each epoch, roughly once an hour in the Alfajores or Baklava Testnets. After that hour, if you get elected, your node will start participating BFT consensus and validating blocks. After the first epoch in which your Validator participates in BFT, you should receive your first set of epoch rewards.

{% hint style="info" %}
**Roadmap**: Different parameters will govern elections in a Celo production network. Epochs are likely to be daily, rather than hourly. Running a Validator will also include setting up proxy nodes to protect against DDoS attacks, and using hardware wallets to secure the key used to sign blocks. We plan to update these instructions with more details soon.
{% endhint %}

You can inspect the current state of the validator elections by running:

```bash
# On your local machine
celocli election:list
```

If you find your Validator still not getting elected you may need to faucet yourself more funds and lock more gold in order to be able to cast more votes for your Validator Group!

You can check the status of your validator, including whether it is elected and signing blocks, at [baklava-ethstats.celo-testnet.org](https://baklava-ethstats.celo-testnet.org) or by running:

```bash
# On your local machine with celocli >= 0.0.30-beta9
celocli validator:status --validator $CELO_VALIDATOR_ADDRESS
```

You can see additional information about your validator, including uptime score, by running:

```bash
# On your local machine
celocli validator:show $CELO_VALIDATOR_ADDRESS
```

## Running the Attestation Service

Validators are expected to run an [Attestation Service](../../validator-guide/attestation-service.md) to provide attestations that allow users to map their phone number to an account on Celo. Follow the instructions now to [set up the service](../../validator-guide/attestation-service.md).

## Deployment Tips

### Running the Docker containers in the background

There are different options for executing Docker containers in the background. The most typical one is to use in your docker run commands the `-d` option. Also for long running processes, especially when you run in on a remote machine, you can use a tool like [screen](https://ss64.com/osx/screen.html). It allows you to connect and disconnect from running processes providing an easy way to manage long running processes.

It's out of the scope of this documentation to go through the `screen` options, but you can use the following command format with your `docker` commands:

```bash
screen -S <SESSION NAME> -d -m <YOUR COMMAND>
```

For example:

```bash
screen -S celo-validator -d -m docker run --name celo-validator -it --restart unless-stopped  --stop-timeout 300 -p 127.0.0.1:8545:8545 .......
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

You can stop the Docker containers at any time without problem. If you stop your containers that means those containers stop providing service. The data directory of the Validator and the proxy are Docker volumes mounted in the containers from the `celo-*-dir` you created at the very beginning. So if you don't remove that folder, you can stop or restart the containers without losing any data.

It is recommended to use the Docker stop timeout parameter `-t` when stopping the containers. This allows time, in this case 60 seconds, for the Celo nodes to flush recent chain data it keeps in memory into the data directories. Omitting this may cause your blockchain data to corrupt, requiring the node to start syncing from scratch.

You can stop the `celo-validator` and `celo-proxy` containers running:

```bash
docker stop celo-validator celo-proxy -t 60
```

And you can remove the containers \(not the data directory\) by running:

```bash
docker rm -f celo-validator celo-proxy
```

