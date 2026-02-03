# Release Examples

## Example: Release CR15 to Celo Sepolia

```bash
cd packages/protocol

# 1. Source deployer key
source ../../.env.mnemonic.celosepolia

# 2. Generate libraries.json from v14 (currently deployed)
yarn release:verify-deployed:foundry -b core-contracts.v14 -n celo-sepolia

# 3. Generate compatibility report (v14 → v15)
yarn release:check-versions:foundry \
  -a core-contracts.v14 \
  -b release/core-contracts/15 \
  -r ./releaseData/versionReports/release15-report.json

# 4. Ensure init data exists
cat ./releaseData/initializationData/release15.json || echo "{}" > ./releaseData/initializationData/release15.json

# 5. Deploy to Celo Sepolia (requires Celoscan API key for verification)
# API key can be set via:
#   - .env.json: {"celoScanApiKey": "YOUR_KEY"}
#   - Environment: export CELOSCAN_API_KEY=YOUR_KEY
#   - CLI flag: -a YOUR_KEY
yarn release:make:foundry \
  -b release/core-contracts/15 \
  -k $DEPLOYER_PRIVATE_KEY \
  -i ./releaseData/initializationData/release15.json \
  -l ./libraries.json \
  -n celo-sepolia \
  -p ./proposal-celo-sepolia.json \
  -r ./releaseData/versionReports/release15-report.json
```

## Example: Release CR15 on Local Fork (Testing)

```bash
cd packages/protocol

# 1. Start anvil fork in another terminal
anvil --fork-url https://forno.celo-sepolia.celo-testnet.org \
  --code-size-limit 500000 --gas-limit 100000000

# 2. Generate libraries.json from v14 (currently deployed)
yarn release:verify-deployed:foundry -b core-contracts.v14 -n celo-sepolia

# 3. Generate compatibility report (v14 → v15)
yarn release:check-versions:foundry \
  -a core-contracts.v14 \
  -b release/core-contracts/15 \
  -r ./releaseData/versionReports/release15-report.json

# 4. Deploy to local fork at 127.0.0.1:8545 (use anvil test key, verification auto-skipped for forks)
yarn release:make:foundry \
  -b release/core-contracts/15 \
  -k 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  -i ./releaseData/initializationData/release15.json \
  -l ./libraries.json \
  -n celo-sepolia \
  -p ./proposal-fork.json \
  -r ./releaseData/versionReports/release15-report.json \
  -u http://127.0.0.1:8545

# To skip verification entirely (no API key required), use -s flag:
yarn release:make:foundry \
  -b release/core-contracts/15 \
  -k $DEPLOYER_PRIVATE_KEY \
  -i ./releaseData/initializationData/release15.json \
  -l ./libraries.json \
  -n celo-sepolia \
  -p ./proposal-celo-sepolia.json \
  -r ./releaseData/versionReports/release15-report.json \
  -s
```

## Example: Full Mainnet Release

```bash
cd packages/protocol

# 1. Source deployer key (decrypt first if needed: yarn keys:decrypt)
source ../../.env.mnemonic.mainnet

# 2. Ensure Celoscan API key is configured (required for mainnet)
# Set in .env.json: {"celoScanApiKey": "YOUR_KEY"}
# Or: export CELOSCAN_API_KEY=YOUR_KEY

# 3. Generate libraries.json for mainnet
yarn release:verify-deployed:foundry -b core-contracts.v14 -n celo

# 4. Deploy to mainnet (with automatic verification)
yarn release:make:foundry \
  -b release/core-contracts/15 \
  -k $DEPLOYER_PRIVATE_KEY \
  -i ./releaseData/initializationData/release15.json \
  -l ./libraries.json \
  -n celo \
  -p ./proposal-mainnet.json \
  -r ./releaseData/versionReports/release15-report.json

# 5. Submit governance proposal
celocli governance:propose \
  --jsonTransactions ./proposal-mainnet.json \
  --deposit 10000e18 \
  --from $PROPOSER_ADDRESS \
  --node https://forno.celo.org
```

## Example: Proposal Output

```json
[
  {
    "contract": "EpochManagerProxy",
    "function": "_setImplementation",
    "args": ["0xNEW_IMPLEMENTATION_ADDRESS"],
    "value": "0"
  },
  {
    "contract": "GovernanceProxy",
    "function": "_setImplementation",
    "args": ["0xNEW_IMPLEMENTATION_ADDRESS"],
    "value": "0"
  }
]
```

## Example: Version Report Structure

```json
{
  "report": {
    "contracts": {
      "Governance": {
        "changes": {
          "storage": [],
          "major": [],
          "minor": [{"type": "MethodAdded", "signature": "proposalCount()"}],
          "patch": [{"type": "DeployedBytecode"}]
        },
        "versionDelta": {
          "storage": "=",
          "major": "=",
          "minor": "+1",
          "patch": "0"
        }
      }
    }
  }
}
```

## Example: Verification Output

The script automatically verifies all deployed contracts on both Blockscout and Celoscan:

```
========================================
Contract Verification
========================================
Verifying 4 contract(s) on celo-sepolia...

Verifying EpochManager at 0xecaf98acf55c598ee8f2e5ebbcc9f683b15a11a8...
  Compiler: 0.8.19+commit.7dd6d404, Optimizer: 200 runs, EVM: paris
  Foundry profile: truffle-compat8
  ✓ EpochManager verified on Blockscout
  ✓ EpochManager verified on Celoscan

Verifying Governance at 0x299461b1b6a34ad83dab8451e2cd43c6fca3bf80...
  Compiler: 0.5.14+commit.01f1aaa4, Optimizer: disabled, EVM: istanbul
  Foundry profile: truffle-compat
  Linked libraries: Proposals@0x96d4da..., IntegerSortedLinkedList@0x38ff7d...
  ✓ Governance verified on Blockscout
  ✓ Governance verified on Celoscan

----------------------------------------
Verification Summary:
  Blockscout: 4/4 verified
  Celoscan:   4/4 verified
----------------------------------------
```

Key verification features:
- **Foundry profile**: Automatically detected from source path (`contracts/` → `truffle-compat`, `contracts-0.8/` → `truffle-compat8`)
- **Linked libraries**: Automatically detected and passed to verifier for contracts that use libraries
- **Full compiler version**: Uses version with commit hash for accurate bytecode matching

## Starting a Local Fork

```bash
# Fork Celo Sepolia
anvil --fork-url https://forno.celo-sepolia.celo-testnet.org --port 8545

# Fork Mainnet
anvil --fork-url https://forno.celo.org --port 8545
```
