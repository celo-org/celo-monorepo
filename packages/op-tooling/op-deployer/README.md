# Optimism Deployer Scripts

This directory contains scripts for deploying and upgrading Optimism contracts on Celo networks using the `op-deployer` tool. Scripts are organized by target contract version.

## Prerequisites

- [op-deployer](https://github.com/celo-org/optimism) — Optimism deployment tool (version must match the target upgrade)

## Versions

| Version     | Target Upgrade     | Networks             | Scripts                                                                  |
| ----------- | ------------------ | -------------------- | ------------------------------------------------------------------------ |
| [v3](./v3/) | `v2.0.0`, `v3.0.0` | `sepolia`, `mainnet` | `bootstrap.sh`, `bootstrap-validator.sh`, `upgrade.sh`, `run_upgrade.sh` |
| [v4](./v4/) | `v4.1.0`           | `chaos`, `sepolia`, `mainnet` | `bootstrap.sh`, `upgrade.sh`, `run_upgrade.sh`                           |
| [v5](./v5/) | `v5.0.0`           | `chaos`, `sepolia`, `mainnet` | `bootstrap.sh`, `upgrade.sh`, `run_upgrade.sh`                           |

## Quick Start

Each version directory contains a `run_upgrade.sh` orchestrator that runs all steps in sequence:

```bash
# v3 example
cd v3
VERSION="v3.0.0" NETWORK="mainnet" OP_ROOT="/path/to/optimism" ./run_upgrade.sh

# v4 example
cd v4
NETWORK="mainnet" OP_ROOT="/path/to/optimism" ./run_upgrade.sh

# v5 example
cd v5
NETWORK="mainnet" OP_ROOT="/path/to/optimism" ./run_upgrade.sh
```

See the version-specific READMEs for detailed documentation:

- **[v3/README.md](./v3/README.md)** — Upgrades to v2.0.0 and v3.0.0 (sepolia, mainnet)
- **[v4/README.md](./v4/README.md)** — Upgrade to v4.1.0 (chaos, sepolia, mainnet)
- **[v5/README.md](./v5/README.md)** — Upgrade to v5.0.0 (chaos, sepolia, mainnet)
