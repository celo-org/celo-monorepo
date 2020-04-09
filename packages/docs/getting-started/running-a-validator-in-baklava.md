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

You can then run the proxy with the following command. Be sure to replace `<YOUR-VALIDATOR-NAME>` with the name you'd like to appear on Celostats.

```bash
# On the proxy machine
docker run --name celo-proxy -it --restart unless-stopped -p 30303:30303 -p 30303:30303/udp -p 30503:30503 -p 30503:30503/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --nousb --syncmode full --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_SIGNER_ADDRESS --proxy.internalendpoint :30503 --etherbase $CELO_VALIDATOR_SIGNER_ADDRESS --bootnodes $BOOTNODE_ENODES --ethstats=<YOUR-VALIDATOR-NAME>-proxy@baklava-celostats.celo-testnet.org
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
docker run --name celo-validator -it --restart unless-stopped -p 30303:30303 -p 30303:30303/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --mine --istanbul.blockperiod=5 --istanbul.requesttimeout=3000 --etherbase $CELO_VALIDATOR_SIGNER_ADDRESS --nodiscover --nousb --proxy.proxied --proxy.proxyenodeurlpair=enode://$PROXY_ENODE@$PROXY_INTERNAL_IP:30503\;enode://$PROXY_ENODE@$PROXY_EXTERNAL_IP:30303  --unlock=$CELO_VALIDATOR_SIGNER_ADDRESS --password /root/.celo/.password --ethstats=<YOUR-VALIDATOR-NAME>@baklava-celostats.celo-testnet.org
```

The `networkid` parameter value of `40120` indicates we are connecting to the new Baklava network.

At this point your proxy should be peering with other nodes as the come online. Your Validator will not automatically peer with the proxy until the mining routine starts after the genesis timestamp on, so it will not have any peers. You should see a `Mining too far in the future` log message from the Validator, which indicates it is waiting for the genesis timestamp to pass. On April 7th at 1600 UTC, the Validator engine will start up, and after a couple of minutes to establish the Validator overlay network, block production will begin.

## After Block Production Begins

Once block production starts, core contracts and  `ReleaseGold` contracts will be deployed, and the community will vote on a series of Governance Proposals in a process which will be a preview of the deployment process for the Celo Mainnet.

As opposed to receiving testnet units of Celo Gold directly, `ReleaseGold` contracts will be used to provide the required balance to register a Validator and vote. `ReleaseGold` is the same mechanism that will be used to distribute Celo Gold to Stake Off participants, so it will be used in Baklava to give you a chance to get familiar with the process. At a high level, `ReleaseGold` holds a balance for scheduled release, while allowing the held balance to be used for certain actions such as validating and voting, depending on the configuration of the contract.

### Core Contract Deployment

Much of functionality of the Celo protocol is implemented in smart contracts, as opposed to entirely within the blockchain client itself. So at the start of block production, core features such as Validator elections, will not be operational. In order to bring the network into its fully operational state, a deployer encoded in genesis block will create the core contracts and finally transfer ownership of the contracts to the Governance contract. In the Baklava network, cLabs will play the role of deployer.

Contract deployment will begin shorter after block production, and may take several hours to complete. On the Baklava network, the deployer address is `0x469be98FE71AFf8F6e7f64F9b732e28A03596B5C` and one way to track progress of the deployment is to watch the transactions submitted by that address on [Blockscout](https://baklava-blockscout.celo-testnet.org/address/0x469be98FE71AFf8F6e7f64F9b732e28A03596B5C/transactions).

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

In this guide, the `ReleaseGold` contract will be the Account owner, so to perform validation, voting, or attestation action, you will need to authorize individual signing keys with those permissions.
Depending configuration of the contract, the Beneficiary of the `ReleaseGold` can authorize these signing keys.

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
| CELO_VALIDATOR_GROUP_SIGNER_ADDRESS        | The address of the Validator Group signer authorized by the Validator Group Account                                                              |
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
| ATTESTATION_SIGNER_ADDRESS           | The address of the attestation signer authorized by the Validator Account                                                            |
| ATTESTATION_SIGNER_SIGNATURE         | The proof-of-possession of the attestation signer key                                                                                |
| ATTESTATION_SERVICE_URL              | The URL to access the deployed Attestation Service                                                                                   |
| METADATA_URL                         | The URL to access the metadata file for your Attestation Service                                                                     |
| DATABASE_URL                         | The URL under which your database is accessible, currently supported are `postgres://`, `mysql://` and `sqlite://`                   |
| APP_SIGNATURE                        | The hash with which clients can auto-read SMS messages on android                                                                    |
| SMS_PROVIDERS                        | A comma-separated list of providers you want to configure, we currently support `nexmo` & `twilio`                                   |

### Create Accounts from the `ReleaseGold` contracts

In order to use the balances from `ReleaseGold` contracts, we need to create associated Accounts. In the Baklava network, you can look up your Beneficiary address in [the published mapping](https://gist.githubusercontent.com/nategraf/a87f9c2e488ab2d38a0a3c09f5d4ca2b/raw) to find your `ReleaseGold` contract addresses. If you are a genesis validator, your two Beneficary addresses will be the provided `CELO_VALIDATOR_ADDRESS` and `CELO_VALIDATOR_GROUP_ADDRESS`.

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

By running the following commands, you can see that the `ReleaseGold` contracts are now associated with a registered Account.

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

In order to perform Validator actions with the Account created with the previous step, you will need to authorize a Validator key on the `ReleaseGold` contract.

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

### Join the Validator to the group

Now that the Validator and group are registered, you can affiliate and accept the affiliation Validator to the group.

```bash
# On the Validator machine
celocli validator:affiliate $CELO_VALIDATOR_GROUP_RG_ADDRESS --from $CELO_VALIDATOR_SIGNER_ADDRESS
```

Accept the affiliation:

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

In order to vote with the balance of the `ReleaseGold` contract, you will authorize a voting key on each.

Create a vote signer keys:

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

You're all set! Elections are finalized at the end of each epoch, roughly once a day in the Baklava testnet. If you get elected, your node will start participating BFT consensus and validating blocks. After the first epoch in which your Validator participates in BFT, you should receive your first set of epoch rewards.

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
