# Node Upgrades

When a new version of the Celo node is available, you can follow this guide to upgrade.

## When an upgrade is required

Upgrades to the Celo node software will often be optional improvements, such as improvements to performance, new useful features, and non-critical bug fixes.

Occasionally, they may be required when the upgrade is necessary to continue operating on the network, such as hard forks, or critical bug fixes. Required upgrades are enforced by setting the via a minimum client version number stored on-chain, which may be updated via [Governance](../celo-codebase/protocol/governance.md) after the client is made available.

## Upgrading a non-validating node

Use these instructions to update non-validating nodes, such as your account node or your attestation node on the Baklava testnet. Also use these instructions to upgrade your proxy node, but remember not to stop the proxy of a running validator.

### Pull the latest Docker image

```bash
export CELO_IMAGE=us.gcr.io/celo-org/celo-node:baklava
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

A second option is to swap in a new validator behind the same set of proxies.

### Hotswapping Validator Nodes

The hotswap mechanism provides several RPC methods to running validators.

* `istanbul.start()` and `istanbul.startAtBlock()` start validating immediately or at a block
* `istanbul.stop()` and `istanbul.stopAtBlock()` stop validating immediately or at a block
* The validator will validate when in the range [start, stop)
* `istanbul.replicaState` will give you the state of the node and the start/stop blocks
* `istanbul.validating` will give you true/false if the node is validating
* `istanbul.valEnodeTableInfo`: if there are non-empty entries for encrypted enode urls the validator can connect to the other validators.
* `--replica` flag which starts a validator in replica mode
* `--replicaStateDBPath`. By default validators save if their state and try to return to it (so a node configured as a validator that was then stopped should stay stopped on a restart). An empty string as the path results in an in memory (non-persistant) replica state DB.

To upgrade a validating node without key rotation when running behind proxies, pull the latest Docker image, as mentioned above. 

Then start the validator on a second host in replica mode (with `istanbul.replica` flag). The replica needs to be provided with the validator signing key to decrypt enode urls of it's peer validators/proxies prior to starting to participate in consensus. The replica will connect to the proxies and sync. With `geth attach` or via the management RPC API, verify that it is synced and has enode urls for each validator peer, then schedule the primary to stop and the replica to start. To have the replica start on block 1250, run `istanbul.stopAtBlock(1250)` on the primary validator and run `istanbul.startAtBlock(1250)` on the replica. You can verify that these change are registered with `istanbul.replicaState`. `istanbul.stop()` and `istanbul.start()` will immediately take effect if changing the node's state and will clear pending start/stop blocks.

```bash
TODO: geth console view
```

### Upgrading Proxy Nodes

With multi-proxy, you can upgrade proxies one by one or can add newly synced proxies with the latest Docker image and can remove the old proxies. If upgrading the proxies in place, a rolling upgrade is recommended as the validator will re-assign direct connections as proxies are added and removed. These re-assignments will allow the validator to continue to participate in consensus.  


