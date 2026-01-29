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

# 5. Deploy to Celo Sepolia
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

# 4. Deploy to local fork at 127.0.0.1:8545 (use anvil test key)
yarn release:make:foundry \
  -b release/core-contracts/15 \
  -k 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  -i ./releaseData/initializationData/release15.json \
  -l ./libraries.json \
  -n celo-sepolia \
  -p ./proposal-fork.json \
  -r ./releaseData/versionReports/release15-report.json \
  -u http://127.0.0.1:8545
```

## Example: Full Mainnet Release

```bash
cd packages/protocol

# 1. Source deployer key (decrypt first if needed: yarn keys:decrypt)
source ../../.env.mnemonic.mainnet

# 2. Generate libraries.json for mainnet
yarn release:verify-deployed:foundry -b core-contracts.v14 -n celo

# 3. Deploy to mainnet
yarn release:make:foundry \
  -b release/core-contracts/15 \
  -k $DEPLOYER_PRIVATE_KEY \
  -i ./releaseData/initializationData/release15.json \
  -l ./libraries.json \
  -n celo \
  -p ./proposal-mainnet.json \
  -r ./releaseData/versionReports/release15-report.json

# 4. Submit governance proposal
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

## Starting a Local Fork

```bash
# Fork Celo Sepolia
anvil --fork-url https://forno.celo-sepolia.celo-testnet.org --port 8545

# Fork Mainnet
anvil --fork-url https://forno.celo.org --port 8545
```
