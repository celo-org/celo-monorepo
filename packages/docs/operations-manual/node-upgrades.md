# Node Upgrades

When a new version of the Celo node is available, you can follow this guide to upgrade.

## When an upgrade is required

Upgrades to the Celo node software will often be optional improvements, such as improvements to performance, new useful features, and non-critical bug fixes.

Occasionally, they may be required when the upgrade is necessary to continue operating on the network, such as hard forks, or critical bug fixes. Required upgrades are enforced by setting the via a minimum client version number stored on-chain, which may be updated via [Governance](../celo-codebase/protocol/governance.md) after the client is made available.

## Upgrading a non-validating node

### Pull the latest Docker image

```bash
export CELO_IMAGE=us.gcr.io/celo-testnet/celo-node:baklava
docker pull $CELO_IMAGE
```

### Stop and remove the existing node

Stop and remove the existing node. Make sure to stop the node gracefully (i.e. giving it time to shut down and complete any writes to disk) or your chain data may become corrupted.

```bash
docker stop -t 60 celo-fullnode
docker rm celo-fullnode
```

### Start the new node

Start the new node using `docker run` as detailed in the getting started guide.

## Upgrading a Validating Node

Upgrading a validating node is much the same, but requires extra care to be taken to prevent validator downtime.

To complete a validating node upgrade, pull the latest Docker image, as mentioned above, then execute a Validator signing key rotation, using the latest image as the new Validator signing node. A recommended procedure for key rotation is documented in the [Key Management](key-management.md#validator-signer-key-rotation) guide.
