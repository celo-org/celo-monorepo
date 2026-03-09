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

### Step 0: Confirm Release Parameters with User

**IMPORTANT**: Before executing any release commands, you MUST:

1. Query available tags and branches:
   ```bash
   git tag -l 'core-contracts.*' | sort -V | tail -15
   git branch -a | grep 'release/core-contracts'
   ```

2. Determine the release source using this priority order:
   
   **Tag priority (check in order, use first match):**
   1. Post-audit tag (if exists): `core-contracts.vN.post-audit` or `core-contracts.vN.post_audit`
   2. Base tag: `core-contracts.vN`
   3. Release branch: `release/core-contracts/N` (only if no tags exist)
   
   **Note**: Not all releases have post-audit tags. If one exists, use it; otherwise use the base tag.
   
   **For the NEW release**: Check for post-audit tag first, then base tag, then branch.
   **For the PREVIOUS release**: Same logic - use post-audit tag if available, otherwise base tag.

3. Present a confirmation to the user with:
   - **Previous release tag** (for libraries.json): e.g., `core-contracts.v14` or `core-contracts.v14.post-audit`
   - **New release source**: Following the priority above
   - **Target network**: e.g., `celo-sepolia` or `celo`

4. Use the AskQuestion tool to get explicit confirmation:
   - Option to confirm the proposed tags/branches
   - Option to specify different tag/branch

5. Only proceed with the release after user confirmation.

Example confirmation prompt (when post-audit tag exists):
```
I plan to release with the following parameters:
- Previous release tag: core-contracts.v14.post-audit
- New release tag: core-contracts.v15.post-audit
- Target network: celo-sepolia

Please confirm or specify different values.
```

Example confirmation prompt (when only base tag exists):
```
I plan to release with the following parameters:
- Previous release tag: core-contracts.v14
- New release tag: core-contracts.v15
- Target network: celo-sepolia

Please confirm or specify different values.
```

Example confirmation prompt (when only branch exists):
```
I plan to release with the following parameters:
- Previous release tag: core-contracts.v14
- New release branch: release/core-contracts/15 (no tag found)
- Target network: celo-sepolia

Please confirm or specify different values.
```

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

**Priority**: Always prefer git tags over branches. Post-audit tags are preferred over base tags.

```bash
# List existing tags (check these FIRST)
git tag -l 'core-contracts.*' | sort -V | tail -15

# List release branches (fallback if no tag exists)
git branch -a | grep 'release/core-contracts'
```

**Tag priority (check in order, use first match):**
1. `core-contracts.vN.post-audit` or `core-contracts.vN.post_audit` - Post-audit (if exists)
2. `core-contracts.vN` - Base tag
3. `release/core-contracts/N` - Branch (fallback only)

**Note**: Not all releases have post-audit tags. Use it if available, otherwise use the base tag.

**Selection logic:**
1. For NEW release: Check for post-audit tag first, then base tag, then branch
2. For PREVIOUS release: Same logic - use post-audit tag if available, otherwise base tag

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

## Contract Verification

The release script automatically verifies deployed contracts on:
- **Blockscout** (https://celo-sepolia.blockscout.com or https://celo.blockscout.com) - No API key required
- **Celoscan** via Etherscan V2 API (https://celoscan.io) - **API key required** for production networks

### Verification Features

The script handles verification automatically with:
- **Linked libraries**: Contracts using libraries (e.g., Governance with Proposals library) are verified with the `--libraries` flag
- **Foundry profiles**: Sets `FOUNDRY_PROFILE` environment variable (`truffle-compat` for 0.5.x, `truffle-compat8` for 0.8.x) to ensure bytecode matches
- **Full compiler version**: Uses full version with commit hash (e.g., `0.5.14+commit.01f1aaa4`)

### Celoscan API Key (Required for celo-sepolia and mainnet)

The API key is **required by default** for production networks. Get your key from https://etherscan.io/myapikey

**Setup options (in order of precedence):**

1. **CLI flag**: `-a YOUR_API_KEY`
2. **Environment variable**: `export CELOSCAN_API_KEY=YOUR_API_KEY`
3. **Config file**: `packages/protocol/.env.json`
   ```json
   {
     "celoScanApiKey": "YOUR_API_KEY"
   }
   ```

**Note**: The Etherscan V2 API uses a unified endpoint (`api.etherscan.io`) that works with a single API key for all supported chains including Celo.

### Skip Verification

To skip verification (e.g., for testing or if you don't have an API key):
```bash
yarn release:make:foundry ... -s
```

Verification is automatically skipped when using a custom RPC URL (local forks).

### Verification Troubleshooting

- **"Address is not a smart-contract"**: Block explorer hasn't indexed the contract yet. The script waits 30s initially, then automatically retries up to 6 times with logarithmic delays (5s, 10s, 20s, 40s, 60s max).
- **"Bytecode mismatch"**: Usually caused by wrong foundry profile. The script now automatically sets `FOUNDRY_PROFILE` based on contract source path.
- **Linked library errors**: The script automatically detects and passes library addresses via `--libraries` flag for contracts that use linked libraries.

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
