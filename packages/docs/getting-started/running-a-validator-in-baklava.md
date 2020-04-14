# Running a Validator in Baklava

The Baklava Testnet is a non-production Testnet for the Validator community. It serves several purposes:

- **Operational excellence**: It helps you get familiarized with the processes that will be used to create RC1, and verify the security and stability of your infrastructure with the new software.
- **Detecting vulnerabilities**: It helps the Celo community discover any remaining bugs before RC1.
- **Future testnet**: If all goes well, it will continue to function as a testnet, serving as a testing ground for changes after mainnet is launched.

While the Baklava Testnet was previously used for The Great Celo Stake Off, the Testnet is now available for any potential Validators to experiment with.

## Network Deployment

The setup of the Baklava network will differ from previous Stake Off deployments in two main ways:

- **No cLabs Validators at genesis.** The new Baklava Testnet will be stood up entirely by community Validators.
- **Block production will not start right away.** Validators are encouraged to get set up and configure monitoring and other tooling straight away. Block production will start automatically at a time encoded in the genesis block.

The deployment timeline is as follows (all dates are subject to change):

* 3/31: Docker image with genesis block distributed
* 3/31 - 4/7: Infrastructure setup
* 4/7 16:00 UTC: Block production begins
* 4/7: Celo Core Contracts and `ReleaseGold` contracts are deployed
* 4/8: Governance proposal to start Validator rewards and voter rewards
* 4/9: Mock Oracles deployed and governance proposal to unfreeze Celo Dollar exchange
* 4/10: Faucet requests for non-genesis Validators accepted

{% hint style="info" %}
A [timeline](https://celo.org/#timeline) of the Celo project is available to provide further context.
{% endhint %}

## Setup for Genesis Validators (Before 4/7)

**If you provided your Validator signer address and BLS public key for genesis, the community is relying on your Validator to get the network started!**

This section outlines the steps needed to configure your proxy and Validator nodes before block production begins.

Please follow these steps if you ranked on The Great Celo Stake Off leaderboard and have provided details of your Validator signer and BLS addresses as explained in this [FAQ](https://forum.celo.org/t/faq-for-stake-off-Validators-on-release-candidate-and-new-baklava-networks/372/2).

If this doesn't apply to you, but you are interested in trying out the Baklava testnet, please check back later for additional instructions on how to get testnet units of Celo Gold set up your Validator.

### Environment Variables

First we are going to setup the main environment variables related with the new Baklava network. Run these on both your **Validator** and **proxy** machines:

```bash
export CELO_IMAGE=us.gcr.io/celo-testnet/celo-node:baklava
export NETWORK_ID=40120
export CELO_VALIDATOR_SIGNER_ADDRESS=<YOUR-VALIDATOR-SIGNER-ADDRESS>
```

Please use the Validator signer address that you submitted through your Gist file. It is included in the genesis Validator set.

### Pull the Celo Docker image

In all the commands we are going to see the `CELO_IMAGE` variable to refer to the Docker image to use. Now we can get the Docker image on your Validator and proxy machines:

```bash
docker pull $CELO_IMAGE
```

The `us.gcr.io/celo-testnet/celo-node:baklava` image is built from commit [`c38f2fd30d2d7c4716a5181c9645121709b9004e`](https://github.com/celo-org/celo-blockchain/commit/c38f2fd30d2d7c4716a5181c9645121709b9004e) and contains the [genesis block](https://storage.cloud.google.com/genesis_blocks/baklava) and [bootnode information](https://storage.cloud.google.com/env_bootnodes/baklava) in addition to the Celo Geth binary.

{% hint style="warning" %}
Upgrading a node with version prior to `0.10.0`, released on April 4th, requires reset of the chain data. One way to accomplish this is by removing the `celo` directory within the data directory. **Make sure not to remove your keystore**
{% endhint %}

### Networking requirements

To avoid exposing the Validator to the public internet, we first deploy a proxy node which is responsible for communicating with the network. On our proxy machine, we'll set up the node and get the bootnode enode URLs to use for discovering other nodes.

In order for your Validator to participate in consensus and complete attestations, it is critically important to configure your network correctly. Your proxy nodes must have static, external IP addresses, and your Validator node must be able to communicate with your proxy, preferably via an internal network, or otherwise via the proxy's external IP address.

On the proxy machine, port 30303 should accept TCP and UDP connections from all IP addresses. This port is used to communicate with other nodes in the network.

On the proxy machine, port 30503 should accept TCP connections from the IP address of your Validator machine. This port is used by the proxy to communicate with the Validator.

### Deploy a proxy

```bash
# On the proxy machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE init /celo/genesis.json
export BOOTNODE_ENODES="$(docker run --rm --entrypoint cat $CELO_IMAGE /celo/bootnodes)"
```

You can then run the proxy with the following command. Be sure to replace `<YOUR-VALIDATOR-NAME>` with the name you'd like to appear on Celostats. The validator name shown in [Celostats](https://baklava-celostats.celo-testnet.org/) will be the the name configured in the proxy.

Additionally, you need to unlock the account configured in `etherbase` option. It is recommended to create a new account and independent account only for this purpose. Be sure to write a new password to `./.password` for this account (different to the Validator Signer password)

```bash
# On the proxy machine
# Firts, we create a new account for the proxy
docker run --name celo-proxy-password -it --rm  -v $PWD:/root/.celo $CELO_IMAGE account new --password /root/.celo/.password
```

Notice the public address returned by this command, that can be exported and used for running the proxy node:

```bash
# On the proxy machine
export PROXY_ADDRESS=<PROXY-PUBLIC-ADDRESS>

docker run --name celo-proxy -it --restart unless-stopped -p 30303:30303 -p 30303:30303/udp -p 30503:30503 -p 30503:30503/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --nousb --syncmode full --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_SIGNER_ADDRESS --proxy.internalendpoint :30503 --etherbase $PROXY_ADDRESS --unlock $PROXY_ADDRESS --password /root/.celo/.password --allow-insecure-unlock --bootnodes $BOOTNODE_ENODES --ethstats=<YOUR-VALIDATOR-NAME>-proxy@baklava-celostats-server.celo-testnet.org
```

{% hint style="info" %}
You can detach from the running container by pressing `ctrl+p ctrl+q`, or start it with `-d` instead of `-it` to start detached. Access the logs for a container in the background with the `docker logs` command.
{% endhint %}

### Get your proxy's connection info

Once the proxy is running, we will need to retrieve its enode and IP address so that the Validator will be able to connect to it.

```bash
# On the proxy machine, retrieve the proxy enode
docker exec celo-proxy geth --exec "admin.nodeInfo['enode'].split('//')[1].split('@')[0]" attach | tr -d '"'
```

Now we need to set the proxy enode and proxy IP address in environment variables on the Validator machine.

If you don't have an internal IP address over which the Validator and proxy can communicate, feel free to set the internal IP address to the external IP address.

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

### Connect the Validator to the proxy

When starting up your Validator, it will attempt to create a network connection between the Validator machine and the proxy machine. You will need make sure that your proxy machine has the appropriate firewall settings to allow the Validator to connect to it.

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

Once that is completed, go ahead and run the Validator. Be sure write your Validator signer password to `./.password` for the following command to work, or provide your password another way.

```bash
# On the Validator machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE init /celo/genesis.json
docker run --name celo-validator -it --restart unless-stopped -p 30303:30303 -p 30303:30303/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --mine --istanbul.blockperiod=5 --istanbul.requesttimeout=3000 --etherbase $CELO_VALIDATOR_SIGNER_ADDRESS --nodiscover --nousb --proxy.proxied --proxy.proxyenodeurlpair=enode://$PROXY_ENODE@$PROXY_INTERNAL_IP:30503\;enode://$PROXY_ENODE@$PROXY_EXTERNAL_IP:30303 --unlock=$CELO_VALIDATOR_SIGNER_ADDRESS --password /root/.celo/.password --ethstats=<YOUR-VALIDATOR-NAME>@baklava-celostats-server.celo-testnet.org
```

The `networkid` parameter value of `40120` indicates we are connecting to the new Baklava network.

At this point your proxy should be peering with other nodes as the come online. Your Validator will not automatically peer with the proxy until the mining routine starts after the genesis timestamp on, so it will not have any peers. You should see a `Mining too far in the future` log message from the Validator, which indicates it is waiting for the genesis timestamp to pass. On April 7th at 1600 UTC, the Validator engine will start up, and after a couple of minutes to establish the Validator overlay network, block production will begin.

## After Block Production Begins

Once block production starts, core contracts and  `ReleaseGold` contracts will be deployed, and the community will vote on a series of Governance Proposals in a process which will be a preview of the deployment process for the Celo Mainnet.

As opposed to receiving testnet units of Celo Gold directly, `ReleaseGold` contracts will be used to provide the required balance to register a Validator and vote. `ReleaseGold` is the same mechanism that will be used to distribute Celo Gold to Stake Off participants, so it will be used in Baklava to give you a chance to get familiar with the process. At a high level, `ReleaseGold` holds a balance for scheduled release, while allowing the held balance to be used for certain actions such as validating and voting, depending on the configuration of the contract.

### Core Contract Deployment

Much of functionality of the Celo protocol is implemented in smart contracts, as opposed to entirely within the blockchain client itself. So at the start of block production, core features such as Validator elections, will not be operational. In order to bring the network into its fully operational state, a deployer encoded in genesis block will create the core contracts and finally transfer ownership of the contracts to the Governance contract. In the Baklava network, cLabs will play the role of deployer.

Contract deployment will begin shortly after block production, and may take several hours to complete. On the Baklava network, the deployer address is `0x469be98FE71AFf8F6e7f64F9b732e28A03596B5C` and one way to track progress of the deployment is to watch the transactions submitted by that address on [Blockscout](https://baklava-blockscout.celo-testnet.org/address/0x469be98FE71AFf8F6e7f64F9b732e28A03596B5C/transactions).

### Actions Required After Core Contract Deployment

Once core contracts have been deployed, you will be able to register your Validator and stand for election.
Election will run on each epoch boundary after a minimum number of validators are registered and have votes.
Once elections are running, the genesis validators will be replaced by the elected validators, so it is important to register and vote even if you are in the genesis set.

The following sections outline the actions you will need to take. On a high level, we will:

- Create Accounts and lock up the balance of each `ReleaseGold` contract
- Register a Validator
- Register a Validator Group
- Add the registered Validator to the Validator Group
- Vote for the group with funds from each `ReleaseGold` contract

We will need to use 7 keys, so let's have a refresher on key management.

### Key Management

Private keys are the central primitive of any cryptographic system and need to be handled with extreme care. Loss of your private key can lead to irreversible loss of value.

#### Unlocking

Celo nodes store private keys encrypted on disk with a password, and need to be "unlocked" before use. Private keys can be unlocked in two ways:

1.  By running the `celocli account:unlock` command. Note that the node must have the "personal" RPC API enabled in order for this command to work.
2.  By setting the `--unlock` flag when starting the node.

It is important to note that when a key is unlocked you need to be particularly careful about enabling access to the node's RPC APIs.

#### Account and Signer keys

In the Celo protocol, registered Accounts can take a number of actions (e.g. validating, signing attestations, and voting) and the ability to perform each of these actions can be delegated to a unique signing key. Keys that need to be accessed frequently (e.g. for signing blocks) are at greater risk of being compromised, and thus have more limited permissions, while keys that need to be accessed infrequently (e.g. for locking Celo Gold) are less onerous to store securely, and thus have more expansive permissions. Below is a summary of the various keys that are used in the Celo network, and a description of their permissions.

| Name of the key        | Purpose                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Validator signer key   | This is the key that has permission to register and manage a Validator or Validator Group, and participate in BFT consensus. |
| Vote signer key        | This key can be used to vote in Validator elections and on-chain governance.                                                 |
| Attestation signer key | This key is used to sign attestations in Celo's lightweight identity protocol.                                               |

{% hint style="warning" %}
Account and signer keys must be unique and may not be reused.
{% endhint %}

#### Keys Required

In this guide, the `ReleaseGold` contract will be the Account, so to perform validation, voting, or attestation action, you will need to authorize individual signing keys with those permissions via the `ReleaseGold` contract.
The `beneficiary` address of the `ReleaseGold` is the address that can actually call these functions on the `ReleaseGold` contract to authorize these signing keys.

We will use 7 keys in the following setup, namely:

- Validator
  - Beneficiary key (submitted through gist)
  - Validator signer key (submitted through gist)
  - Attestation key (new)
  - Voter key (new)
- Validator group
  - Beneficiary key (submitted through gist)
  - Validator signer key (new)
  - Voter key (new)

In this guide, it is assumed that the Validator signer key is stored on the Validator node, and the attestation key on the attestation node, but all other the other keys are accessible on your local machine.

### Environment variables

There are number of new environment variables, and you may use this table as a reference.

| Variable                             | Explanation                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| CELO_IMAGE                           | The Docker image used for the Validator and proxy containers                                                                         |
| NETWORK_ID                           | The Celo Baklava network chain ID                                                                                                    |
| CELO_VALIDATOR_GROUP_RG_ADDRESS         | The `ReleaseGold` contract address for the Validator Group                                                                                          |
| CELO_VALIDATOR_RG_ADDRESS         | The `ReleaseGold` contract address for the Validator                                                                                          |
| CELO_VALIDATOR_GROUP_SIGNER_ADDRESS        | The address of the Validator signer authorized by the Validator Group Account                                                              |
| CELO_VALIDATOR_GROUP_SIGNER_SIGNATURE      | The proof-of-possession of the Validator Group signer key                                                                                  |
| CELO_VALIDATOR_SIGNER_ADDRESS        | The address of the Validator signer authorized by the Validator Account                                                              |
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
| SMS_PROVIDERS                        | A comma-separated list of providers you want to configure, we currently support `nexmo` & `twilio`                                   |

### Create Accounts from the `ReleaseGold` contracts

In order to participate on the network (lock gold, vote, validate) from a `ReleaseGold` contract, we need to create an Account at the address of the `ReleaseGold` contract. In the Baklava network, you can look up your Beneficiary address in [the published mapping](https://gist.githubusercontent.com/nategraf/a87f9c2e488ab2d38a0a3c09f5d4ca2b/raw) to find your `ReleaseGold` contract addresses. If you are a genesis validator, your two Beneficary addresses will be the provided `CELO_VALIDATOR_ADDRESS` and `CELO_VALIDATOR_GROUP_ADDRESS`.

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

Create an Account for each of the Validator and Validator Group's `ReleaseGold` contracts:

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

Lock up Celo Gold balance from your `ReleaseGold` contracts to fulfill the staking requirements to register a Validator and Validator Group. The current requirement is 10,000 Celo Gold to register a Validator, and 10,000 Celo Gold _per member validator_ to register a Validator Group.

```bash
celocli releasegold:locked-gold --contract $CELO_VALIDATOR_GROUP_RG_ADDRESS --action lock --value 10000000000000000000000
celocli releasegold:locked-gold --contract $CELO_VALIDATOR_RG_ADDRESS --action lock --value 10000000000000000000000
```

Check that your Celo Gold was successfully locked with the following commands:

```bash
# On your local machine
celocli lockedgold:show $CELO_VALIDATOR_GROUP_RG_ADDRESS
celocli lockedgold:show $CELO_VALIDATOR_RG_ADDRESS
```

### Register as a Validator

In order to perform Validator actions with the Account created in the previous step, you will need to authorize a Validator signer key for the `ReleaseGold` contract account. You should have already generated this key and submitted it via gist.
To authorize this key, we will first need to first generate a proof that the `ReleaseGold` contract account possesses the keys for this new signer:

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

Validators on the Celo network use BLS aggregated signatures to create blocks in addition to the Validator signer (ECDSA) key. While an independent BLS key can be specified, the simplest thing to do is to derive the BLS key from the Validator signer key. When we register our Validator, we'll need to prove possession of the BLS key as well, which can be done by running the following command:

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

In order to validate we need to authorize the Validator signing key:

```bash
# On your local machine
celocli releasegold:authorize --contract $CELO_VALIDATOR_RG_ADDRESS --role validator --signature 0x$CELO_VALIDATOR_SIGNER_SIGNATURE --signer $CELO_VALIDATOR_SIGNER_ADDRESS
```

Using the newly authorized Validator key, register the Account as a Validator:

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

In order to register a Validator Group, you will need to authorize a signer key for Validator actions on the group `ReleaseGold` contract.
In these steps you will create a new key on your local machine for this purpose.

```bash
# On your local machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account new
```

And save this new address:

```bash
export CELO_VALIDATOR_GROUP_SIGNER_ADDRESS=<YOUR-VALIDATOR-GROUP-SIGNER-ADDRESS>
```

In order to authorize our Validator Group signer, we need to create a proof that we have possession of the Validator Group signer private key.
We do so by signing a message that consists of the Validator Group Account address, in this case, the `ReleaseGold` contract address.

To generate the proof-of-possession, run the following command:

```bash
# On your local machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE --nousb account proof-of-possession $CELO_VALIDATOR_GROUP_SIGNER_ADDRESS $CELO_VALIDATOR_GROUP_RG_ADDRESS
```

Save the signer address, public key, and proof-of-possession signature to your local machine:

```bash
export CELO_VALIDATOR_GROUP_SIGNER_SIGNATURE=<YOUR-VALIDATOR-GROUP-SIGNER-SIGNATURE>
```

Authorize your Validator Group signing key:

```bash
# On your local machine
celocli releasegold:authorize --contract $CELO_VALIDATOR_GROUP_RG_ADDRESS --role validator --signature 0x$CELO_VALIDATOR_GROUP_SIGNER_SIGNATURE --signer $CELO_VALIDATOR_GROUP_SIGNER_ADDRESS
```

With this newly authorized key, you can register the Account as a Validator Group:

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

Now that the Validator and the group are registered, you can affiliate the Validator with the group.

```bash
# On the Validator machine
celocli validator:affiliate $CELO_VALIDATOR_GROUP_RG_ADDRESS --from $CELO_VALIDATOR_SIGNER_ADDRESS
```

You can then accept this from the group to complete the affiliation:

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

#### Authorize voter signing keys

In order to vote with the balance of a `ReleaseGold` contract you will to authorize a voting key.

Create the vote signer keys:

```bash
# On your local machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account new
export CELO_VALIDATOR_VOTE_SIGNER_ADDRESS=<YOUR-VALIDATOR-VOTE-SIGNER-ADDRESS>

docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account new
export CELO_VALIDATOR_GROUP_VOTE_SIGNER_ADDRESS=<YOUR-VALIDATOR-GROUP-VOTE-SIGNER-ADDRESS>
```

Produce the proof-of-possession needed to authorize the keys:

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

Now the newly authorized voter signing keys can be used to submit votes in the election:

```bash
# On your local machine
celocli election:vote --from $CELO_VALIDATOR_VOTE_SIGNER_ADDRESS --for $CELO_VALIDATOR_GROUP_RG_ADDRESS --value 10000000000000000000000
celocli election:vote --from $CELO_VALIDATOR_GROUP_VOTE_SIGNER_ADDRESS --for $CELO_VALIDATOR_GROUP_RG_ADDRESS --value 10000000000000000000000
```

Verify that your votes were cast successfully:

```bash
# On your local machine
celocli election:show $CELO_VALIDATOR_GROUP_RG_ADDRESS --group
celocli election:show $CELO_VALIDATOR_GROUP_RG_ADDRESS --voter
celocli election:show $CELO_VALIDATOR_RG_ADDRESS --voter
```

Users in the Celo protocol receive epoch rewards for voting in Validator Elections only after submitting a special transaction to enable them. This must be done every time new votes are cast, and can only be made after the most recent epoch has ended. For convenience, we can use the following command, which will wait until the epoch has ended before sending a transaction:

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

If your Validator Group elects validators, you will receive epoch rewards in the form of additional Locked Gold voting for your Validator Group from your Account addresses. You can see these rewards accumulate with the commands in the previous set, as well as:

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

### Running the Attestation Service

As part of the [lightweight identity protocol](/celo-codebase/protocol/identity), Validators are expected to run an [Attestation Service](https://github.com/celo-org/celo-monorepo/tree/master/packages/attestation-service) to provide attestations that allow users to map their phone number to an account on Celo. Be sure to allow TCP connections to your Attestations machine on port 80 for all IP addresses.

Just like with the Validator and Vote signer, we'll want to authorize a separate Attestation signer. For that let's start our node on the Attestations machine (keep track of the password you use for this account):

```bash
# On the Attestation machine
# Note that you have to export CELO_IMAGE, NETWORK_ID and CELO_VALIDATOR_ADDRESS on this machine
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
celocli releasegold:authorize --contract $CELO_VALIDATOR_RG_ADDRESS --role attestation --signature $CELO_ATTESTATION_SIGNER_SIGNATURE --signer $CELO_ATTESTATION_SIGNER_ADDRESS
```

You can now run the node for the attestation service in the background. In the below command remember to specify the password you used during the creation of the `CELO_ATTESTATION_SIGNER_ADDRESS` account:

```bash
# On the Attestation machine
echo <ATTESTATION-SIGNER-PASSWORD> > .password
docker run --name celo-attestations -it --restart always -p 127.0.0.1:8545:8545 -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin --unlock $CELO_ATTESTATION_SIGNER_ADDRESS --password /root/.celo/.password --bootnodes $BOOTNODE_ENODES
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

{% hint style="info" %}
Make sure you can serve requests for numbers in US, Europe, Australia, Mexico, Argentina, the Philippines, and Kenya.
{% endhint %}

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
docker run --name celo-attestation-service -it --restart always --entrypoint /bin/bash --network host -e ATTESTATION_SIGNER_ADDRESS=$CELO_ATTESTATION_SIGNER_ADDRESS -e CELO_VALIDATOR_ADDRESS=$CELO_VALIDATOR_RG_ADDRESS -e CELO_PROVIDER=$CELO_PROVIDER -e DATABASE_URL=$DATABASE_URL -e SMS_PROVIDERS=twilio -e TWILIO_MESSAGING_SERVICE_SID=$TWILIO_MESSAGING_SERVICE_SID -e TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID -e TWILIO_BLACKLIST=$TWILIO_BLACKLIST -e TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN -e PORT=80 -p 80:80 $CELO_IMAGE_ATTESTATION -c " cd /celo-monorepo/packages/attestation-service && yarn run db:migrate && yarn start "
```

## Registering Metadata

We are using [Metadata](../celo-codebase/protocol/identity/metadata) to allow accounts to make certain claims without having to do so on-chain. Since the validator in question here is run under a `ReleaseGold` contract, users can use any `signer` address to make claims on behalf of the `ReleaseGold` contract. This guide will use the `CELO_ATTESTATION_SIGNER_ADDRESS` since it is likely the most recently used, but any can be used.
For us to complete the metadata process, we have to make two claims:

1.  Under which URL users can request attestations from
2.  Which accounts belong together for the purpose of the leaderboard

Run the following commands on your local machine:

```bash
# On your local machine
celocli account:create-metadata ./metadata.json --from $CELO_VALIDATOR_RG_ADDRESS
```

The `CELO_ATTESTATION_SERVICE_URL` variable stores the URL to access the Attestation Service deployed. In the following command we specify the URL where this Attestation Service is:

```bash
# On your local machine
celocli account:claim-attestation-service-url ./metadata.json --url $CELO_ATTESTATION_SERVICE_URL --from $CELO_ATTESTATION_SIGNER_ADDRESS
```

Let's claim our group address:

```bash
# On your local machine
celocli account:claim-account ./metadata.json --address $CELO_VALIDATOR_GROUP_RG_ADDRESS --from $CELO_ATTESTATION_SIGNER_ADDRESS
```

And then host your metadata somewhere reachable via HTTP. You can use a service like [gist.github.com](https://gist.github.com). Create a gist with the contents of the file and then click on the `Raw` buttton to receive the permalink to the machine-readable file.

Now we can register this url under the `ReleaseGold` validator account for others to see. To do this, we must have the `beneficiary` address of the `ReleaseGold` contract unlocked:

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
celocli identity:test-attestation-service --from $CELO_VALIDATOR_RG_ADDRESS --phoneNumber <YOUR-PHONE-NUMBER-E164-FORMAT> --message <YOUR_MESSAGE>
```

You should see that your claim for `$CELO_VALIDATOR_GROUP_RG_ADDRESS` could not be verified! We need to create the corresponding claim from `$CELO_VALIDATOR_GROUP_RG_ADDRESS` otherwise anyone could claim it!

In order to do this, you can again use any of the Group's authorized signers. Here we choose to use the group's vote signer since it is likely to be most recently used on your local machine. You could also generate and authorize another signer key here, but it is technically unnecessary. Additionally, in order to `set-account` here, the beneficiary for `$CELO_VALIDATOR_GROUP_RG_ADDRESS` will need to be unlocked:

```bash
# On your local machine
celocli account:create-metadata ./group-metadata.json --from $CELO_VALIDATOR_GROUP_RG_ADDRESS
celocli account:claim-account ./group-metadata.json --address $CELO_VALIDATOR_RG_ADDRESS --from $CELO_VALIDATOR_GROUP_VOTE_SIGNER_ADDRESS
# Upload group-metadata.json to something like gist
# The group's `beneficiary` key will need to be unlocked locally for this tx to complete.
celocli releasegold:set-account --contract $CELO_VALIDATOR_GROUP_RG_ADDRESS --url <GROUP_METADATA_URL> --from $CELO_VALIDATOR_GROUP_VOTE_SIGNER_ADDRESS
```

Now when you run `celocli account:get-metadata $CELO_VALIDATOR_RG_ADDRESS`, you should see your claim for the group account to be verified. By now, you should have setup your Validator account appropriately. Note that you need to add these claims for any other addresses that are yours to calculate your score for the leaderboard appropriately.

{% hint style="warning" %}
**Under construction** We are currently working on updating the attestation service guide to reflect changes in workflow for `ReleaseGold`.
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
