# Running a Validator

This section explains how to get a Validator node running on the network, using the same docker image used for running a full node.

Validators help secure the Celo network by participating in Celo’s Proof of Stake protocol. Validators are organized into Validator Groups, analogous to parties in representative democracies. A Validator Group is essentially an ordered list of Validators.

Just as anyone in a democracy can create their own political party, or seek to get selected to represent a party in an election, any Celo user can create a Validator group and add themselves to it, or set up a potential Validator and work to get an existing Validator group to include them.

While other Validator Groups will exist on the Celo Networks, the fastest way to get up and running with a Validator will be to register a Validator Group, register a Validator, and add that Validator to your Validator Group. The addresses used to register Validator Groups and Validators must be unique, which will require that you create two accounts in the step-by-step guide below.

Because of the importance of Validator security and availability, Validators are expected to run one or more additional "proxy" nodes. In this setup, the proxy node connects with the rest of the network, and the machine running the Validator communicates only with the proxy, ideally via a private network.

Additionally, Validators are expected to run an [Attestation Service](https://github.com/celo-org/celo-monorepo/tree/master/packages/attestation-service) as part of the [lightweight identity protocol](../celo-codebase/protocol/identity), to provide attestations that allow users to map their phone number to a Celo address.

You can find more details about Celo mission and why to become a Validator [in our Medium article](https://medium.com/celohq/calling-all-chefs-become-a-celo-validator-c75d1c2909aa).

## Register for the Stake Off

Participation in The Great Celo Stake Off is subject to these [Terms and Conditions](https://docs.google.com/document/d/1b5SzeRbq60nx50NeezAEMpwLkaBDQ9hjZc0QAh4Mbdk/). If you agree to those, register online via an [online form](https://docs.google.com/forms/d/e/1FAIpQLSfbn5hTJ4UIWpN92-o2qMTUB0UnrFsL0fm97XqGe4VhhN_r5A/viewform). **Once the C-Labs team receives your registration, they will send you instructions to get fauceted funds to run a Validator on the Baklava testnet.** Do this first.

## Prerequisites

### Hardware requirements

The recommended Celo Validator setup involves continually running three nodes on separate hardware:

- 1 **Validator node**: should be deployed to single-tenant hardware in a secure, high availability data center
- 1 **Validator Proxy node**: can be a VM or container in a multi-tenant environment (e.g. a public cloud), but requires high availability
- 1 **Attestation node**: can be a VM or container in a multi-tenant environment (e.g. a public cloud), and has moderate availability requirements

Celo is a Proof of Stake network, which has different hardware requirements than a Proof of Work network. Proof of Stake consensus is less CPU intensive, but is more sensitive to network connectivity and latency. Below is a list of standard requirements for running a Validator node on the Celo Network:

- Memory: 8 GB RAM
- CPU: Quad core 3GHz (64-bit)
- Disk: 256 GB of SSD storage, plus a secondary HDD desirable
- Network: At least 1 GB input/output Ethernet with a fiber Internet connection, ideally redundant connections and HA switches

In addition, to get things started, it will be useful to temporarily run a node on your local machine.

### Networking requirements

In order for your Validator to participate in consensus and complete attestations, it is **critically** important to configure your network correctly.

Your Proxy and Attestations nodes must have static, external IP addresses, and your Validator node must be able to communicate with your proxy, either via an internal network or via the Proxy's external IP address.

On the Proxy and Attestations machines, port 30303 should accept TCP and UDP connections from all IP addresses. This port is used to communicate with other nodes in the network.

On the Proxy machine, port 30503 should accept TCP connections from the IP address of your Validator machine. This port is used by the Proxy to communicate with the Validator.

On the Attestations machine, port 80 should accept TCP connections from all IP addresses. This port is used by users to request attestations from you.

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
| Account key            | This is the key with the highest level of permissions, and is thus the most sensitive. It can be used to lock and unlock Celo Gold, and authorize vote, validator, and attestation keys. Note that the account key also has all of the permissions of the other keys. |
| Validator signer key   | This is the key that has permission to register and manage a Validator or Validator Group, and participate in BFT consensus.                                                                                                                                          |
| Vote signer key        | This key can be used to vote in Validator elections and on-chain governance.                                                                                                                                                                                          |
| Attestation signer key | This key is used to sign attestations in Celo's lightweight identity protocol.                                                                                                                                                                                        |

Note that account and signer keys must be unique and may not be reused.

### Environment variables

| Variable                             | Explanation                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| CELO_IMAGE                           | The Docker image used for the Validator and Proxy containers                                                                         |
| NETWORK_ID                           | The Celo Baklava network chain ID                                                                                                    |
| CELO_VALIDATOR_GROUP_ADDRESS         | The account address for the Validator Group                                                                                          |
| CELO_VALIDATOR_ADDRESS               | The account address for the Validator                                                                                                |
| CELO_VALIDATOR_SIGNER_ADDRESS        | The address of the validator signer authorized by the validator account                                                              |
| CELO_VALIDATOR_SIGNER_PUBLIC_KEY     | The ECDSA public key associated with the validator signer address                                                                    |
| CELO_VALIDATOR_SIGNER_SIGNATURE      | The proof-of-possession of the validator signer key                                                                                  |
| CELO_VALIDATOR_SIGNER_BLS_PUBLIC_KEY | The BLS public key for the Validator instance                                                                                        |
| CELO_VALIDATOR_SIGNER_BLS_SIGNATURE  | A proof-of-possession of the BLS public key                                                                                          |
| PROXY_ENODE                          | The enode address for the Validator proxy                                                                                            |
| PROXY_INTERNAL_IP                    | (Optional) The internal IP address over which your Validator can communicate with your Proxy                                         |
| PROXY_EXTERNAL_IP                    | The external IP address of the Proxy. May be used by the Validator to communicate with the Proxy if PROXY_INTERNAL_IP is unspecified |
| ATTESTATION_SIGNER_ADDRESS           | The address of the attestation signer authorized by the validator account                                                            |
| ATTESTATION_SIGNER_SIGNATURE         | The proof-of-possession of the attestation signer key                                                                                |
| ATTESTATION_SERVICE_URL              | The URL to access the deployed Attestation Service                                                                                   |
| METADATA_URL                         | The URL to access the metadata file for your Attestation Service                                                                     |
| DATABASE_URL                         | The URL under which your database is accessible, currently supported are `postgres://`, `mysql://` and `sqlite://`                   |
| APP_SIGNATURE                        | The hash with which clients can auto-read SMS messages on android                                                                    |
| SMS_PROVIDERS                        | A comma-separated list of providers you want to configure, we currently support `nexmo` & `twilio`                                   |

First we are going to setup the main environment variables related with the `Baklava` network. Run:

```bash
export CELO_IMAGE=us.gcr.io/celo-testnet/celo-node:baklava
export NETWORK_ID=121119
```

### Pull the Celo Docker image

In all the commands we are going to see the `CELO_IMAGE` variable to refer to the right Docker image to use. Now we can get the Docker image:

```bash
docker pull $CELO_IMAGE
```

### Create the Validator and Validator Group accounts

First, you'll need to generate account keys for your Validator and Validator Group.

{% hint style="danger" %}
These keys will control your locked Celo Gold, and thus should be handled with care.
Store and back these keys up in a secure manner, as there will be no way to recover if them if lost or stolen.
{% endhint %}

```bash
# On your local machine
mkdir celo-accounts-node
cd celo-accounts-node
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account new
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account new
```

This will create a new keystore in the current directory with two new accounts.
Copy the addresses from the terminal and set the following environment variables:

```bash
# On your local machine
export CELO_VALIDATOR_GROUP_ADDRESS=<YOUR-VALIDATOR-GROUP-ADDRESS>
export CELO_VALIDATOR_ADDRESS=<YOUR-VALIDATOR-ADDRESS>
```

### Start your Accounts node

Next, we'll run a node on your local machine so that we can use these accounts to lock Celo Gold and authorize the keys needed to run your validator. To do this, we need to run the following commands, which fetch the genesis block and a list of other nodes in the network to connect to.

```bash
# On your local machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE init /celo/genesis.json
docker run -v $PWD:/root/.celo --rm -it --entrypoint cp $CELO_IMAGE /celo/static-nodes.json /root/.celo/
```

To run the node:

```bash
# On your local machine
docker run --name celo-accounts -it --restart always -p 127.0.0.1:8545:8545 -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal
```

{% hint style="danger" %}
**Security**: The command line above includes the parameter `--rpcaddr 0.0.0.0` which makes the Celo Blockchain software listen for incoming RPC requests on all network adaptors. Exercise extreme caution in doing this when running outside Docker, as it means that any unlocked accounts and their funds may be accessed from other machines on the Internet. In the context of running a Docker container on your local machine, this together with the `docker -p 127.0.0.1:localport:containerport` flags allows you to make RPC calls from outside the container, i.e from your local host, but not from outside your machine. Read more about [Docker Networking](https://docs.docker.com/network/network-tutorial-standalone/#use-user-defined-bridge-networks) here.
{% endhint %}

### Obtain and lock up some Celo Gold for staking

To participate in The Great Celo Stake Off (aka TGCSO) and get fauceted it's necessary to register online via an [online form](https://docs.google.com/forms/d/e/1FAIpQLSfbn5hTJ4UIWpN92-o2qMTUB0UnrFsL0fm97XqGe4VhhN_r5A/viewform). Once the C-Labs team receives your registration, they'll send you instructions to get fauceted. Follow those instructions now. Then, while you wait, let's deploy the remaining components:

### Deploy a Validator

To actually register as a validator, we'll need to generate a validating signer key. On your Validator machine (which should not be accessible from the public internet), follow very similar steps:

```bash
# On the validator machine
# Note that you have to export $CELO_IMAGE and $NETWORK_ID on this machine
export CELO_IMAGE=us.gcr.io/celo-testnet/celo-node:baklava
export NETWORK_ID=121119
mkdir celo-validator-node
cd celo-validator-node
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account new
export CELO_VALIDATOR_SIGNER_ADDRESS=<YOUR-VALIDATOR-SIGNER-ADDRESS>
```

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

Validators on the Celo network use BLS aggregated signatures to create blocks in addition to the Validator signer (ECDSA) key. While an independent BLS key can be specified, the simplest thing to do is to derive the BLS key from the Validator signer key. When we register our Validator, we'll need to prove possession of the BLS key as well, which can be done by running the following command:

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

To avoid exposing the validator to the public internet, we are deploying a proxy node which is responsible to communicate with the network. On our Proxy machine, we'll set up the node and get the bootnode enode URLs to use for discovering other nodes.

```bash
# On the proxy machine
# Note that you have to export $CELO_IMAGE on this machine
export CELO_IMAGE=us.gcr.io/celo-testnet/celo-node:baklava
mkdir celo-proxy-node
cd celo-proxy-node
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE init /celo/genesis.json
export BOOTNODE_ENODES=`docker run --rm --entrypoint cat $CELO_IMAGE /celo/bootnodes`
```

You can then run the proxy with the following command. Be sure to replace `<YOUR-VALIDATOR-NAME>` with the name you'd like to use for your Validator account.

```bash
# On the proxy machine
# Note that you'll have to export CELO_VALIDATOR_SIGNER_ADDRESS and $NETWORK_ID on this machine
export NETWORK_ID=121119
export CELO_VALIDATOR_SIGNER_ADDRESS=<YOUR-VALIDATOR-SIGNER-ADDRESS>
docker run --name celo-proxy -it --restart always -p 30303:30303 -p 30303:30303/udp -p 30503:30503 -p 30503:30503/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_SIGNER_ADDRESS --proxy.internalendpoint :30503 --etherbase $CELO_VALIDATOR_SIGNER_ADDRESS --bootnodes $BOOTNODE_ENODES --ethstats=<YOUR-VALIDATOR-NAME>-proxy@baklava-ethstats.celo-testnet.org
```

{% hint style="info" %}
You can detach from the running container by pressing `ctrl+p ctrl+q`, or start it without `-d` instead of `it` to start detached. Access the logs for a container in the background with the `docker logs` command.
{% endhint %}

### Get your Proxy's connection info

Once the proxy is running, we will need to retrieve its enode and IP address so that the validator will be able to connect to it.

```bash
# On the proxy machine, retrieve the proxy enode
docker exec celo-proxy geth --exec "admin.nodeInfo['enode'].split('//')[1].split('@')[0]" attach | tr -d '"'
```

Now we need to set the proxy enode and proxy IP address in environment variables on the validator machine.
If you don't have an internal IP address over which the Validator and Proxy can communicate, feel free to set the internal IP address to the external IP address.

If you don't know your Proxy's external IP address, you can get it by running the following command:

```bash
# On the proxy machine
dig +short myip.opendns.com @resolver1.opendns.com
```

Then, export the variables on your validator machine.

```bash
# On the validator machine
export PROXY_ENODE=<YOUR-PROXY-ENODE>
export PROXY_EXTERNAL_IP=<PROXY-MACHINE-EXTERNAL-IP-ADDRESS>
export PROXY_INTERNAL_IP=<PROXY-MACHINE-INTERNAL-IP-ADDRESS>
```

### Connect the Validator to the Proxy

When starting up your validator, it will attempt to create a network connection between the validator machine and the proxy machine. You will need make sure that your proxy machine has the appropriate firewall settings to allow the validator to connect to it.

Specifically, on the proxy machine, port 30303 should allow TCP and UDP connections from all IP addresses. And port 30503 should allow TCP connections from the IP address of your validator machine.

Test that your network is configured correctly by running the following commands:

```bash
# On your local machine, test that your Proxy is accepting TCP connections over port 30303.
# Note that it will also need to be accepting UDP connections over this port.
telnet $PROXY_EXTERNAL_IP 30303
```

```bash
# On your Validator machine, test that your Proxy is accepting TCP connections over port 30503.
telnet $PROXY_INTERNAL_IP 30503
```

Once that is completed, go ahead and run the validator. Be sure to replace `<VALIDATOR-SIGNER-PASSWORD>` with the password for your Validator signer. You should see the validator begin syncing via the Proxy within a few seconds.

```bash
# On the validator machine
echo <VALIDATOR-SIGNER-PASSWORD> > .password
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE init /celo/genesis.json
docker run --name celo-validator --rm -it --restart always -p 30303:30303 -p 30303:30303/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --mine --istanbul.blockperiod=5 --istanbul.requesttimeout=3000 --etherbase $CELO_VALIDATOR_SIGNER_ADDRESS --nodiscover --proxy.proxied --proxy.proxyenodeurlpair=enode://$PROXY_ENODE@$PROXY_INTERNAL_IP:30503\;enode://$PROXY_ENODE@$PROXY_EXTERNAL_IP:30303  --unlock=$CELO_VALIDATOR_SIGNER_ADDRESS --password /root/.celo/.password --ethstats=<YOUR-VALIDATOR-NAME>@baklava-ethstats.celo-testnet.org
```

The `mine` flag does not mean the node starts mining blocks, but rather starts trying to participate in the BFT consensus protocol. It cannot do this until it gets elected -- so next we need to stand for election.

The `networkid` parameter value of `121119` indicates we are connecting to the Baklava network, Stake Off Phase 1.

Note that if you are running the validator and the proxy on the same machine, then you should set the validator's listening port to something other than `30303`. E.g. you could use the flag `--port 30313` and set the docker port forwarding rules accordingly (e.g. use the flags `-p 30313:30313` and `-p 30313:30313/udp`).

### Register the Accounts

You've now done all the infrastructure setup to get a validator and proxy running. The C-Labs team will review your submission to receive funds and send you 12,000 testnet Celo Gold to each of your Validator and Validator Group account addresses. These funds have no real world value but will allow you to submit transactions to the network via [`celocli`](../command-line-interface/introduction.md) and put up a stake to register as a validator and validator group.

You can view your Celo Gold balances by running the following commands:

```bash
# On your local machine
celocli account:balance $CELO_VALIDATOR_GROUP_ADDRESS
celocli account:balance $CELO_VALIDATOR_ADDRESS
```

At some point the output of these commands will change from `0` to `12e12`, indicating you have received the testnet Celo Gold. This process involves a human, so please be patient. If you haven't received a balance within 24 hours, please get in touch again.

You can also look at an account's current balance and transaction history on [Blockscout](https://baklava-blockscout.celo-testnet.org/). Enter the address into the search bar.

Once these accounts have a balance, unlock them so that we can sign transactions. Then, we will register the accounts with the Celo core smart contracts:

```bash
# On your local machine
celocli account:unlock --account $CELO_VALIDATOR_GROUP_ADDRESS
celocli account:unlock --account $CELO_VALIDATOR_ADDRESS
celocli account:register --from $CELO_VALIDATOR_GROUP_ADDRESS --name <NAME YOUR VALIDATOR GROUP>
celocli account:register --from $CELO_VALIDATOR_ADDRESS --name <NAME YOUR VALIDATOR>
```

Check that your accounts were registered successfully with the following commands:

```bash
# On your local machine
celocli account:show $CELO_VALIDATOR_GROUP_ADDRESS
celocli account:show $CELO_VALIDATOR_ADDRESS
```

### Lock up Celo Gold

Lock up testnet Celo Gold for both accounts in order to secure the right to register a Validator and Validator Group. The current requirement is 10k Celo Gold to register a validator, and 10,000 Celo Gold _per member validator_ to register a Validator Group. For Validators, this gold remains locked for approximately 60 days following deregistration. For groups, this gold remains locked for approximately 60 days following the removal of the Nth validator from the group.

```bash
# On your local machine
celocli lockedgold:lock --from $CELO_VALIDATOR_GROUP_ADDRESS --value 10000000000000000000000
celocli lockedgold:lock --from $CELO_VALIDATOR_ADDRESS --value 10000000000000000000000
```

This amount (10,000 Celo Gold) represents the minimum amount needed to be locked in order to register a Validator and Validator group. Since your balance is in fact higher than this, you may wish to lock more with these accounts. Note that you will want to be sure to leave enough Gold unlocked to be able to continue to pay transaction fees for future transactions (such as those issued by running some CLI commands).

Check that your Celo Gold was successfully locked with the following commands:

```bash
# On your local machine
celocli lockedgold:show $CELO_VALIDATOR_GROUP_ADDRESS
celocli lockedgold:show $CELO_VALIDATOR_ADDRESS
```

### Run for election

In order to be elected as a Validator, you will first need to register your group and Validator. Note that when registering a Validator Group, you need to specify a [commission](../celo-codebase/protocol/proof-of-stake/validator-groups.md#group-share), which is the fraction of epoch rewards paid to the group by its members.

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

Next, register your Validator by running the following command. Note that because we have authorized a Validator signer, this step could also be performed on the Validator machine. Running it on the local machine allows us to avoid needing to install the celocli on the Validator machine.

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

Users in the Celo protocol receive epoch rewards for voting in Validator Elections only after submitting a special transaction to enable them. This must be done every time new votes are cast, and can only be made after the most recent epoch has ended. For convenience, we can use the following command, which will wait until the epoch has ended before sending a transaction.

```bash
# On your local machine
celocli election:activate --from $CELO_VALIDATOR_ADDRESS --wait && celocli election:activate --from $CELO_VALIDATOR_GROUP_ADDRESS --wait
```

Check that your votes were activated by re-running the following commands:

```bash
# On your local machine
celocli election:show $CELO_VALIDATOR_GROUP_ADDRESS --voter
celocli election:show $CELO_VALIDATOR_ADDRESS --voter
```

If your Validator Group elects validators, you will receive epoch rewards in the form of additional Locked Gold voting for your Validator Group from your account addresses. You can see these rewards accumulate with the commands in the previous set, as well as:

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

### Running the Attestation Service

As part of the [lightweight identity protocol](/celo-codebase/protocol/identity), Validators are expected to run an [Attestation Service](https://github.com/celo-org/celo-monorepo/tree/master/packages/attestation-service) to provide attestations that allow users to map their phone number to an account on Celo. Be sure to allow TCP connections to your Attestations machine on port 80 for all IP addresses.

Just like with the Validator signer, we'll want to authorize a separate Attestation signer. For that let's start our node on the Attestations machine:

```bash
# On the Attestation machine
# Note that you have to export CELO_IMAGE, NETWORK_ID and CELO_VALIDATOR_ADDRESS on this machine
export CELO_IMAGE=us.gcr.io/celo-testnet/celo-node:baklava
export NETWORK_ID=121119
export CELO_VALIDATOR_ADDRESS=<CELO_VALIDATOR_ADDRESS>
mkdir celo-attestations-node
cd celo-attestations-node
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE init /celo/genesis.json
export BOOTNODE_ENODES=`docker run --rm --entrypoint cat $CELO_IMAGE /celo/bootnodes`
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account new
export CELO_ATTESTATION_SIGNER_ADDRESS=<YOUR-ATTESTATION-SIGNER-ADDRESS>
```

Let's generate the proof-of-possession for the attestation signer

```bash
# On the Attestation machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account proof-of-possession $CELO_ATTESTATION_SIGNER_ADDRESS $CELO_VALIDATOR_ADDRESS
```

With this proof, authorize the attestation signer on your local machine:

```bash
# On your local machine
export CELO_ATTESTATION_SIGNER_SIGNATURE=<ATTESTATION-SIGNER-SIGNATURE>
export CELO_ATTESTATION_SIGNER_ADDRESS=<YOUR-ATTESTATION-SIGNER-ADDRESS>
celocli account:authorize --from $CELO_VALIDATOR_ADDRESS --role attestation --signature 0x$CELO_ATTESTATION_SIGNER_SIGNATURE --signer 0x$CELO_ATTESTATION_SIGNER_ADDRESS
```

You can now run the node for the attestation service in the background. In the below command remember to specify the password you used during the creation of the `CELO_ATTESTATION_SIGNER_ADDRESS` account:

```bash
# On the Attestation machine
echo <ATTESTATION-SIGNER-PASSWORD> > .password
docker run --name celo-attestations -it --restart always -p 8545:8545 -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin --unlock $CELO_ATTESTATION_SIGNER_ADDRESS --password /root/.celo/.password --bootnodes $BOOTNODE_ENODES
```

Next we will set up the Attestation Service itself. First, specify the following environment variables:

```bash
# On the Attestation machine
export CELO_IMAGE_ATTESTATION=us.gcr.io/celo-testnet/celo-monorepo:attestation-service-baklava
# if you followed the instruction of setting up the attestation signer
export CELO_PROVIDER=http://localhost:8545
```

### SMS Providers

Currently the SMS providers supported are [Twilio](https://www.twilio.com/try-twilio) and [Nexmo Sign Up form](https://dashboard.nexmo.com/sign-up). We recommend using [Twilio](https://www.twilio.com/try-twilio).

**Twilio**

Twilio is the most common and popular provider. For that you will need to provision the following variables:

| Variable                     | Explanation                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| TWILIO_ACCOUNT_SID           | The Twilio account ID                                           |
| TWILIO_MESSAGING_SERVICE_SID | The Twilio Message Service ID. Starts by `MG`                   |
| TWILIO_AUTH_TOKEN            | The API authentication token                                    |
| TWILIO_BLACKLIST             | A comma-sperated list of country codes you do not want to serve |

After you signed up for Twilio at [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio), you should see your `ACCOUNT SID` and your `AUTH_TOKEN` in the top right of the console. You'll also want to enter in a credit card to fund the account. For most text messages, the costs will be very low (and on mainnet easily exceeded by the attestation fee paid by the user). Find a more comprehensive price list at [https://www.twilio.com/sms/pricing](https://www.twilio.com/sms/pricing). If there are countries that you do not want to serve, you can specify them with the `TWILIO_BLACKLIST`. In any case, you'll want to adjust your Geo settings to serve phone numbers globally under [https://www.twilio.com/console/sms/settings/geo-permissions](https://www.twilio.com/console/sms/settings/geo-permissions).

To actually be able to send SMS, you need to create a messaging service under [Programmable SMS > SMS](https://www.twilio.com/console/sms/services). The resulting `SID` you want to specify under the `TWILIO_MESSAGING_SERVICE_SID`. Now that you have provisioned your messaging service, you need to buy at least 1 phone number to send SMS from. You can do so under the `Numbers` option of the messaging service page. To maximize the chances of reliable and prompt SMS sending (and thus attestation fee revenue), you can buy numbers in many locales, and Twilio will intelligently select the best number to send each SMS.

**Nexmo**

Here is the list of the enviromnet variables needed to use the Nexmo SMS broker:

| Variable        | Explanation                                                     |
| --------------- | --------------------------------------------------------------- |
| NEXMO_KEY       | The API key to the Nexmo API                                    |
| NEXMO_SECRET    | The API secret to the Nexmo API                                 |
| NEXMO_BLACKLIST | A comma-sperated list of country codes you do not want to serve |

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

## Executing the Attestation Service

The following command for running the Attestation Service is using Twilio and uses `--network host` to access a local database (only works on Linux):

```bash
# On the Attestation machine
docker run --name celo-attestation-service -it --restart always --entrypoint /bin/bash --network host -e ATTESTATION_SIGNER_ADDRESS=0x$CELO_ATTESTATION_SIGNER_ADDRESS -e CELO_VALIDATOR_ADDRESS=0x$CELO_VALIDATOR_ADDRESS -e CELO_PROVIDER=$CELO_PROVIDER -e DATABASE_URL=$DATABASE_URL -e SMS_PROVIDERS=twilio -e TWILIO_MESSAGING_SERVICE_SID=$TWILIO_MESSAGING_SERVICE_SID -e TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID -e TWILIO_BLACKLIST=$TWILIO_BLACKLIST -e TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN -e PORT=80 -p 80:80 $CELO_IMAGE_ATTESTATION -c " cd /celo-monorepo/packages/attestation-service && yarn run db:migrate && yarn start "
```

## Registering Metadata

We are using [Metadata](../celo-codebase/protocol/identity/metadata) to allow accounts to make certain claims without having to do so on-chain. For us to complete the process, we have to make two claims:

1.  Under which URL users can request attestations from
2.  Which accounts belong together for the purpose of the leaderboard

Run the following commands on your local machine where `$CELO_VALIDATOR_ADDRESS` is unlocked.

```bash
# On your local machine
celocli account:create-metadata ./metadata.json --from 0x$CELO_VALIDATOR_ADDRESS
```

The `ATTESTATION_SERVICE_URL` variable stores the URL to access the Attestation Service deployed. In the following command we specify the URL where this Attestation Service is:

```bash
# On your local machine
celocli account:claim-attestation-service-url ./metadata.json --url $ATTESTATION_SERVICE_URL --from 0x$CELO_VALIDATOR_ADDRESS
```

Let's claim our group address

```bash
# On your local machine
celocli account:claim-account ./metadata.json --address 0x$CELO_VALIDATOR_GROUP_ADDRESS --from 0x$CELO_VALIDATOR_ADDRESS
```

And then host your metadata somewhere reachable via HTTP. You can use a service like [gist.github.com](https://gist.github.com). Create a gist with the contents of the file and then click on the `Raw` buttton to receive the permalink to the machine-readable file.

```bash
# On your local machine
celocli account:register-metadata --url <METADATA_URL> --from $CELO_VALIDATOR_ADDRESS
```

If everything goes well users should be able to see your claims by running:

```bash
# On your local machine
celocli account:get-metadata $CELO_VALIDATOR_ADDRESS
```

You can run the following command to test if you properly setup your attestation service:

```bash
# On your local machine
celocli identity:test-attestation-service --from $CELO_VALIDATOR_ADDRESS --phoneNumber <YOUR-PHONE-NUMBER-E164-FORMAT> --message <YOUR_MESSAGE>
```

You should see that your claim for `$CELO_VALIDATOR_GROUP_ADDRESS` could not be verified! We need to create the corresponding claim from `$CELO_VALIDATOR_GROUP_ADDRESS` otherwise anyone could claim it!

```bash
# On your local machine
celocli account:create-metadata ./group-metadata.json --from 0x$CELO_VALIDATOR_GROUP_ADDRESS
celocli account:claim-account ./group-metadata.json --address 0x$CELO_VALIDATOR_ADDRESS --from 0x$CELO_VALIDATOR_GROUP_ADDRESS
# Upload group-metadata.json
celocli account:register-metadata --url <GROUP_METADATA_URL> --from $CELO_VALIDATOR_GROUP_ADDRESS
```

Now when you run `celocli account:get-metadata $CELO_VALIDATOR_ADDRESS`, you should see your claim for the group account to be verified. By now, you should have setup your Validator account appropriately. Note that you need to add these claims for any other addresses that are yours to calculate your score for the leaderboard appropriately.

{% hint style="tip" %}
Congratulations on setting up your validator. If you want to win the TGCSO, it may be helpful to get familiar with the inner workings of the Celo network. Dig into the [protocol documentation](../celo-codebase/protocol) for more information.
{% endhint %}

## Deployment Tips

### Running the Docker containers in the background

There are different options for executing Docker containers in the background. The most typical one is to use in your docker run commands the `-d` option. Also for long running processes, especially when you run in a remote computer, you can use a tool like [screen](https://ss64.com/osx/screen.html). It allows to connect and disconnect from running processes providing an easy way to manage long running processes.

It's out of the scope of this documentation to go through the `screen` options, but you can use the following command format with your `docker` commands:

```bash
screen -S <SESSION NAME> -d -m <YOUR COMMAND>
```

For example:

```bash
screen -S celo-validator -d -m docker run --name celo-validator -it --restart always -p 127.0.0.1:8545:8545 .......
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
The data dir of the validator and the proxy are Docker volumes mounted in the containers from the `celo-*-dir` you created at the very beginning. So if you don't remove that folder, you can stop or restart the containers without losing any data.

You can stop the `celo-validator` and `celo-proxy` containers running:

```bash
docker stop celo-validator celo-proxy
```

And you can remove the containers (not the data dir) running:

```bash
docker rm -f celo-validator celo-proxy
```

## Stop Validating

If for some reason you need to stop running your Validator, and it is currently elected, you first need to stop it getting re-elected at the end of the current epoch. After that you can stop the validator, proxy and Attestation Service processes, containers or machines.

{% hint style="danger" %}
**Validated Uptime and Network Stability**: If you stop your validator while it is still elected, you will receive fewer rewards on account of downtime, may be slashed, and also potentially affect the stability and performance of the network.
{% endhint %}

Please remove your validator from its group so that at the end of the current epoch it will not be re-elected:

```bash
celocli validatorgroup:member --from $CELO_VALIDATOR_GROUP_ADDRESS --remove $CELO_VALIDATOR_ADDRESS
```
