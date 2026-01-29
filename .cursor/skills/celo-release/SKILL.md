---
name: celo-release
description: Deploy Celo core contract releases using Foundry tooling. Use when releasing contracts, testing releases on forks, generating governance proposals, or when user mentions release, deploy, upgrade contracts, CR14, CR15, make-release, or verify-deployed.
---

# Celo Core Contracts Release

Deploy and test Celo core contract releases using Foundry-based tooling.

## Quick Reference

| Step | Command | Output |
|------|---------|--------|
| 1. Generate libraries.json | `verify-deployed:foundry -b <PREVIOUS_TAG>` | `libraries.json` |
| 2. Generate report | `check-versions:foundry -a <PREVIOUS_TAG> -b <NEW_BRANCH>` | `releaseData/versionReports/releaseN-report.json` |
| 3. Deploy & create proposal | `make-release:foundry -b <NEW_BRANCH>` | `proposal.json` + deployed contracts |

## Networks

| Network | Chain ID | RPC URL | Use Case |
|---------|----------|---------|----------|
| Celo Mainnet | 42220 | https://forno.celo.org | Production releases |
| Celo Sepolia | 11142220 | https://forno.celo-sepolia.celo-testnet.org | Testnet releases |
| Local Fork | varies | http://127.0.0.1:8545 | Testing releases |

## Deployer Keys

Deployer keys are stored in encrypted mnemonic files in the repo root:

| Network | Mnemonic File | Encrypted File |
|---------|--------------|----------------|
| Celo Sepolia | `.env.mnemonic.celosepolia` | N/A (manual) |
| Mainnet | `.env.mnemonic.mainnet` | `.env.mnemonic.mainnet.enc` |
| Alfajores | `.env.mnemonic.alfajores` | `.env.mnemonic.alfajores.enc` |
| Baklava | `.env.mnemonic.baklava` | `.env.mnemonic.baklava.enc` |

### Decrypting Keys (cLabs employees)

```bash
# Decrypt all mnemonic files using GCP KMS
yarn keys:decrypt
```

### Using Keys

Each mnemonic file exports `DEPLOYER_PRIVATE_KEY`. Source it before running release commands:

```bash
# For Celo Sepolia
source .env.mnemonic.celosepolia

# For Mainnet
source .env.mnemonic.mainnet
```

Then use `$DEPLOYER_PRIVATE_KEY` in release commands.

## Release Workflow

### Step 1: Generate libraries.json

Verify the **currently deployed** release to get library addresses:

```bash
cd packages/protocol

# For Celo Sepolia
yarn release:verify-deployed:foundry -b core-contracts.v${PREVIOUS} -n celo-sepolia

# For Mainnet
yarn release:verify-deployed:foundry -b core-contracts.v${PREVIOUS} -n celo
```

**Output**: `libraries.json` in `packages/protocol/`

### Step 2: Generate Compatibility Report

Compare previous release to new release branch:

```bash
yarn release:check-versions:foundry \
  -a core-contracts.v${PREVIOUS} \
  -b release/core-contracts/${NEW} \
  -r ./releaseData/versionReports/release${NEW}-report.json
```

**Output**: `releaseData/versionReports/release${NEW}-report.json`

### Step 3: Prepare Initialization Data

Create or verify initialization data exists:

```bash
# Check if file exists
cat ./releaseData/initializationData/release${NEW}.json

# If missing, create empty (valid if no new contracts)
echo "{}" > ./releaseData/initializationData/release${NEW}.json
```

### Step 4: Deploy Release

#### On Local Fork (Testing)

```bash
yarn release:make:foundry \
  -b release/core-contracts/${NEW} \
  -k $DEPLOYER_PRIVATE_KEY \
  -i ./releaseData/initializationData/release${NEW}.json \
  -l ./libraries.json \
  -n celo-sepolia \
  -p ./proposal-fork.json \
  -r ./releaseData/versionReports/release${NEW}-report.json \
  -u http://127.0.0.1:8545
```

#### On Celo Sepolia

```bash
yarn release:make:foundry \
  -b release/core-contracts/${NEW} \
  -k $CELO_SEPOLIA_DEPLOYER_KEY \
  -i ./releaseData/initializationData/release${NEW}.json \
  -l ./libraries.json \
  -n celo-sepolia \
  -p ./proposal-celo-sepolia.json \
  -r ./releaseData/versionReports/release${NEW}-report.json
```

#### On Mainnet

```bash
# First regenerate libraries.json for mainnet!
yarn release:verify-deployed:foundry -b core-contracts.v${PREVIOUS} -n celo

yarn release:make:foundry \
  -b release/core-contracts/${NEW} \
  -k $MAINNET_DEPLOYER_KEY \
  -i ./releaseData/initializationData/release${NEW}.json \
  -l ./libraries.json \
  -n celo \
  -p ./proposal-mainnet.json \
  -r ./releaseData/versionReports/release${NEW}-report.json
```

## Release Artifacts

| Artifact | Location | Purpose |
|----------|----------|---------|
| `libraries.json` | `packages/protocol/` | Library addresses (network-specific!) |
| Version report | `releaseData/versionReports/releaseN-report.json` | Contract changes & version deltas |
| Init data | `releaseData/initializationData/releaseN.json` | Constructor args for new contracts |
| Proposal | `proposal-*.json` | Governance transactions |

**Important**: `libraries.json` is network-specific. Regenerate when switching between Celo Sepolia and Mainnet.

## Determining Release Numbers

```bash
# List existing tags
git tag -l 'core-contracts.*' | sort -V | tail -5

# List release branches
git branch -a | grep 'release/core-contracts'
```

## Starting a Local Fork

Before testing on a local fork, start Anvil with the required parameters:

```bash
# Fork Celo Sepolia
anvil --fork-url https://forno.celo-sepolia.celo-testnet.org \
  --code-size-limit 500000 \
  --gas-limit 100000000

# Fork Mainnet
anvil --fork-url https://forno.celo.org \
  --code-size-limit 500000 \
  --gas-limit 100000000
```

**Important**: The `--code-size-limit` and `--gas-limit` flags are required for Celo contract deployments due to large contract sizes.

## Common Issues

### "libraries.json not found"
Run `verify-deployed:foundry` first with the previous release tag.

### "Version mismatch detected"
Update `getVersionNumber()` in the contract to match expected version from the report.

### "Deployment reverted" or "Out of gas" on Local Fork
Ensure Anvil is started with `--code-size-limit 500000 --gas-limit 100000000`.

### Testing on Local Fork
Use anvil's default test key for local forks:
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Additional Resources

For complete documentation, see [RELEASE_PROCESS_FOUNDRY.md](../../packages/protocol/RELEASE_PROCESS_FOUNDRY.md)
