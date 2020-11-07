# Running a Validator in Baklava

The Baklava Testnet is a non-production Testnet for the Validator community. It serves several purposes:

- **Operational excellence**: Build familiarity with the processes used on Mainnet, and to verify the security and stability of your infrastructure with the new software.
- **Detecting vulnerabilities**: Discover bugs in new software releases before they reach Mainnet.
- **Testing ground**: Experiment with new infrastructure configurations in a low-risk environment.

The Baklava testnet is the best place to get started running a validator, or test out new validator configurations before deploying to [Mainnet](mainnet.md).

{% hint style="info" %}
If you are transitioning from the Baklava network prior to the June 24 reset, you will need to start with a fresh chain database. You can create new nodes from fresh machines, as described in this guide, or you may delete your chaindata folder, which is named `celo` in the node data directory, and start over by running the provided `init` commands for each node described below. All on-chain registration steps, the commands completed with `celocli`, will need to be run on the new network.

Key differences are:
* New network ID is `62320`
* A new image has been pushed to `us.gcr.io/celo-org/geth:baklava`
* A new genesis block and bootnode enode are included in the Docker image
* `ReleaseGold` contracts are available for all previously faucetted addresses [here](https://gist.github.com/nategraf/245232883a34cbb162eb599e34afd7c0)
{% endhint %}

## Prerequisites

### Staking Requirements

Celo uses a [proof-of-stake](../celo-codebase/protocol/proof-of-stake) consensus mechanism, which requires Validators to have locked CELO to participate in block production. The current requirement is 10,000 CELO to register a Validator, and 10,000 CELO _per member validator_ to register a Validator Group.

Participating in the Baklava testnet requires testnet units of CELO, which can only be used in the Baklava testnet. You can request a distribution of testnet CELO by filling out [the faucet request form](https://forms.gle/JTYkMAJWTAUQp1sv9). If you need any help getting started, please join the discussion on [Discord](https://chat.celo.org) or email community@celo.org.

Faucetted funds will come as two `ReleaseGold` contracts. At a high level, `ReleaseGold` holds a balance for scheduled release, while allowing the held balance to be used for certain actions such as validating and voting, depending on the configuration of the contract. [Read more about `ReleaseGold`.](../celo-holder-guide/release-gold.md).

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
| NETWORK_ID                           | The Celo Baklava network chain ID                                                                                                    |
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

## Validator Node Setup

This section outlines the steps needed to configure your Proxy and Validator nodes so that they are ready to sign blocks once elected.

### Environment Variables

First we are going to set up the main environment variables related to the Baklava network. Run these on both your **Validator** and **Proxy** machines:

```bash
export CELO_IMAGE=us.gcr.io/celo-org/geth:baklava
export NETWORK_ID=62320
```

### Pull the Celo Docker image

In all the commands we are going to see the `CELO_IMAGE` variable to refer to the Docker image to use. Now we can get the Docker image on your Validator and Proxy machines:

```bash
docker pull $CELO_IMAGE
```

The `us.gcr.io/celo-org/geth:baklava` image contains the [genesis block](https://github.com/celo-org/celo-monorepo/tree/master/packages/celotool/genesis_baklava.json) in addition to the Celo Blockchain binary.

### Start your Accounts node

Next, we'll run a node on your local machine so that we can use these accounts to lock CELO and authorize the keys needed to run your validator. 

To run the node:

```bash
# On your local machine
mkdir celo-accounts-node
cd celo-accounts-node
docker run --name celo-accounts -it --restart always -p 127.0.0.1:8545:8545 -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal --baklava --datadir /root/.celo
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
```

You can then run the proxy with the following command. Be sure to replace `<YOUR-VALIDATOR-NAME>` with the name you'd like to appear on Celostats. The validator name shown in [Celostats](https://baklava-celostats.celo-testnet.org/) will be the name configured in the proxy.

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
docker run --name celo-proxy -it --restart unless-stopped -p 30303:30303 -p 30303:30303/udp -p 30503:30503 -p 30503:30503/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --nousb --syncmode full --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_SIGNER_ADDRESS --proxy.internalendpoint :30503 --etherbase $PROXY_ADDRESS --unlock $PROXY_ADDRESS --password /root/.celo/.password --allow-insecure-unlock --baklava --datadir /root/.celo --celostats=<YOUR-VALIDATOR-NAME>@baklava-celostats-server.celo-testnet.org
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

### Deploy a Validator machine

The Validator machine is node that actually assembles and signs blocks to participate in consensus. We will set it up in this section.

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
docker run --name celo-validator -it --restart unless-stopped -p 30303:30303 -p 30303:30303/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --mine --istanbul.blockperiod=5 --istanbul.requesttimeout=3000 --etherbase $CELO_VALIDATOR_SIGNER_ADDRESS --nodiscover --nousb --proxy.proxied --proxy.proxyenodeurlpairs=enode://$PROXY_ENODE@$PROXY_INTERNAL_IP:30503\;enode://$PROXY_ENODE@$PROXY_EXTERNAL_IP:30303 --unlock=$CELO_VALIDATOR_SIGNER_ADDRESS --password /root/.celo/.password --celostats=<YOUR-VALIDATOR-NAME>@baklava-celostats-server.celo-testnet.org --baklava --datadir /root/.celo
```

The `networkid` parameter value of `62320` indicates we are connecting to the Baklava network.

At this point your Validator and Proxy machines should be configured, and both should be syncing to the network. You should see `Imported new chain segment` in your node logs, about once every 5 seconds once the node is synced to the latest block which you can find on the [Baklava Network Stats](https://baklava-celostats.celo-testnet.org/) page.

{% hint style="info" %}
You can run multiple proxies by deploying additional proxies per the instructions in the [Deploy a proxy](running-a-validator-in-baklava.md#deploy-a-proxy) section.  Then add all of the proxies' enodes as a comma seperated list using the `--proxy.proxyenodeurlpairs` option.  E.g. if there are two proxies, that option's usage would look like `--proxy.proxyenodeurlpairs="enode://$PROXY_ENODE_1@$PROXY_INTERNAL_IP_1:30503\;enode://$PROXY_ENODE_1@$PROXY_EXTERNAL_IP_1:30303,enode://$PROXY_ENODE_2@$PROXY_INTERNAL_IP_2:30503\;enode://$PROXY_ENODE_2@$PROXY_EXTERNAL_IP_2:30303"`
{% endhint %}


## Registering as a Validator

In order to operate as a Validator, you must register on-chain and be elected. Elections will run on each epoch boundary, approximately every 24 hours, after elections have been unfrozen by on-chain governance. Eligible validator groups will be considered in an Election mechanism that will select Validator based on the [D'Hondt method](https://en.wikipedia.org/wiki/D%27Hondt_method).

In the following steps, this guide will assume your CELO is held in a `ReleaseGold` contract, if this is not the case, the commands will need to be adjusted. At a high level, `ReleaseGold` holds a balance for scheduled release, while allowing the held balance to be used for certain actions such as validating and voting, depending on the configuration of the contract. [Read more about `ReleaseGold`.](../celo-holder-guide/release-gold.md)

The following sections outline the actions you will need to take. On a high level, we will:

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

{% hint style="info" %} The first time you authorize a validator signer for a ReleaseGold account the signer address is funded 1 CELO to cover transaction fees. Any subsequent signer keys you authorize will not be funded, and you will need to transfer a nominal amount of CELO to them from other accounts. {% endhint %}

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

If your Validator Group elects validators, you will receive epoch rewards in the form of additional Locked Gold voting for your Validator Group. You can see these rewards accumulate with the commands in the previous set, as well as:

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

## Running the Attestation Service

Validators are expected to run an [Attestation Service](../operations-manual/attestation-service.md) to provide attestations that allow users to map their phone number to an account on Celo. Follow the instructions now to [set up the service](../operations-manual/attestation-service.md).

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
