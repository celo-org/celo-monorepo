# Node Upgrades

When a new version of the Celo node is available, you can follow this guide to upgrade.

## Recent Releases

* [Blockchain Client 1.2.0](https://github.com/celo-org/celo-blockchain/releases/tag/v1.2.0) (latest release for testnets)
* [Blockchain Client 1.1.0](https://github.com/celo-org/celo-blockchain/releases/tag/v1.1.0) (Latest production release)

## When an upgrade is required

Upgrades to the Celo node software will often be optional improvements, such as improvements to performance, new useful features, and non-critical bug fixes.

Occasionally, they may be required when the upgrade is necessary to continue operating on the network, such as hard forks, or critical bug fixes. Required upgrades are enforced by setting the via a minimum client version number stored on-chain, which may be updated via [Governance](../celo-codebase/protocol/governance.md) after the client is made available.

## Upgrading a non-validating node

Use these instructions to update non-validating nodes, such as your account node or your attestation node on the Baklava testnet. Also use these instructions to upgrade your proxy node, but remember not to stop the proxy of a running validator.

### Pull the latest Docker image

```bash
export CELO_IMAGE=us.gcr.io/celo-org/geth:baklava
export NETWORK_ID=200110 # Baklava testnet phases 2 and 3
docker pull $CELO_IMAGE
```

### Stop and remove the existing node

Stop and remove the existing node. Make sure to stop the node gracefully (i.e. giving it time to shut down and complete any writes to disk) or your chain data may become corrupted.

```bash
docker stop -t 60 celo-fullnode
docker rm celo-fullnode
```

### Start the new node

Start the new node using `docker run` as detailed in the appropriate section of the getting started guide. Remember to recover any environment variables, if using a new terminal, before running the documented commands.

- [Full node](../getting-started/running-a-full-node-in-mainnet.md#start-the-node)
- [Accounts node](../getting-started/running-a-validator-in-mainnet.md#start-your-accounts-node)
- [Attestion node](../getting-started/running-a-validator-in-mainnet.md#running-the-attestation-service)
- [Proxy node](../getting-started/running-a-validator-in-mainnet.md#deploy-a-proxy)

## Upgrading a Validating Node

Upgrading a validating node is much the same, but requires extra care to be taken to prevent validator downtime.

One option to complete a validating node upgrade is to perform a key rotation onto a new node. Pull the latest Docker image, as mentioned above, then execute a Validator signing key rotation, using the latest image as the new Validator signing node. A recommended procedure for key rotation is documented in the [Key Management](key-management/key-rotation.md) guide.

A second option is to perform a hot-swap to switch over to a new validator node. The new validator node **must** be configured with the same set of proxies as the existing validator node.

### Hotswapping Validator Nodes

{% hint style="info" %} Hotswap is being introduced in version 1.2.0. When upgrading nodes that are not yet on 1.2.0 refer to the guide to perform a key rotation. {% endhint %}

Validators can be configured as primaries or replicas. By default validators start as primaries and will persist all changes around starting or stopping. Through the istanbul management RPC API the validator can be configured to start or stop at a specified block. The validator will participate in consensus for block numbers in the range `[start, stop)`.

#### RPC Methods
* `istanbul.start()` and `istanbul.startAtBlock()` start validating immediately or at a block
* `istanbul.stop()` and `istanbul.stopAtBlock()` stop validating immediately or at a block
* `istanbul.replicaState` will give you the state of the node and the start/stop blocks
* `istanbul.validating` will give you true/false if the node is validating

{% hint style="info" %} `startAtBlock` and `stopAtBlock` must be given a block in the future. {% endhint %}

#### Geth Flags
* `--istanbul.replica` flag which starts a validator in replica mode.

#### Steps to upgrade
1. Pull the latest docker image.
2. Start a new validator node on a second host in replica mode (`--istanbul.replica` flag). It should be otherwise configured exactly the same as the existing validator.
    * It needs to connect to the exisiting proxies and the validator signing key to connect to other validators in listen mode.
3. Once the replica is synced and has validator enode urls for all validators, it is ready to swapped in.
    * Check validator enode urls with `istanbul.valEnodeTableInfo` in the geth console. The field `enode` should be filled in for each validator peer.
4. In the geth console on the primary run `istanbul.stopAtBlock(xxxx)`
    * Make sure to select a block number comfortably in the future.
    * You can check what the stop block is with `istanbul.replicaState` in the geth console.
    * You can run `istanbul.start()` to clear the stop block
5. In the geth console of the replica run `istanbul.startAtBlock(xxxx)`
    * You can check what the start block is with `istanbul.replicaState` in the geth console.
    * You can run `istanbul.stop()` to clear the start block
6. Confirm that the transition occurred with `istanbul.replicaState` 
    * The last block that the old primary will sign is block number `xxxx - 1`
    * The first block that the new primary will sign is block number `xxxx`
7. Tear down the old primary once the transition has occurred.

Example geth console on the old primary.
```bash
> istanbul.replicaState
{
  isPrimary: true,
  startValidatingBlock: null,
  state: "Primary",
  stopValidatingBlock: null
}
> istanbul.stopAtBlock(21000)
null
> istanbul.replicaState  
{
  isPrimary: true,
  startValidatingBlock: null,
  state: "Primary in given range",
  stopValidatingBlock: 21000
}
> istanbul.replicaState
{
  isPrimary: false,
  startValidatingBlock: null,
  state: "Replica",
  stopValidatingBlock: null
}
```

Example geth console on the replica being promoted to primary. Not shown is confirming the node is synced and connected to validator peers.
```bash
> istanbul.replicaState
{
  isPrimary: false,
  startValidatingBlock: null,
  state: "Replica",
  stopValidatingBlock: null
}
> istanbul.startAtBlock(21000)
null
> istanbul.replicaState
{
  isPrimary: false,
  startValidatingBlock: 21000,
  state: "Replica waiting to start",
  stopValidatingBlock: null
}
> istanbul.replicaState
{
  isPrimary: true,
  startValidatingBlock: null,
  state: "Primary",
  stopValidatingBlock: null
}
```

### Upgrading Proxy Nodes

{% hint style="danger" %} Release 1.2.0 is backwards incompatible in the Validator and Proxy connection. Validators and proxies must be upgraded to 1.2.0 at the same time. {% endhint %}

With multi-proxy, you can upgrade proxies one by one or can add newly synced proxies with the latest Docker image and can remove the old proxies. If upgrading the proxies in place, a rolling upgrade is recommended as the validator will re-assign direct connections as proxies are added and removed. These re-assignments will allow the validator to continue to participate in consensus.
