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

To complete a validating node upgrade, pull the latest Docker image, as mentioned above, then execute a Validator signing key rotation, using the latest image as the new Validator signing node. A recommended procedure for key rotation is documented in the [Key Management](key-management/key-rotation.md) guide.

To upgrade a validating node without key rotation when running behind proxies, pull the latest Docker image, as mentioned above. Then start the validator on a second host in replica mode (with `istanbul.replica` flag). The replica needs to be provided with the validator signing key to decrypt enode urls of it's peer validators/proxies prior to starting to participate in consensus. The replica will connect to the proxies and sync. With `geth attach` or via the management RPC API, verify that it is synced and has enode urls for each validator peer, then schedule the primary to stop and the replica to start. To have the replica start on block 1250, run `istanbul.stopAtBlock(1250)` on the primary validator and run `istanbul.startAtBlock(1250)` on the replica. You can verify that these change are registered with `istanbul.replicaState`. `istanbul.stop()` and `istanbul.start()` will immediately take effect if changing the node's state and will clear pending start/stop blocks.
