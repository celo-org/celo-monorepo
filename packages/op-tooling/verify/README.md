# Contract Verification Scripts

This directory contains scripts for verifying smart contracts created during deployment of new OpStack & during upgrade of exisitng OpStack to newer version.

## Scripts

### `verify-new-op-chain.sh`

Verifies contracts for new Optimism chain deployments on both L1 and L2 networks.

**Features:**
- Supports L1 (defaults to Sepolia) and L2 (defaults to Celo-Sepolia) networks
- Automatically detects proxy implementations and verifies them
- Verifies complete contract suite including OPCM, bridges, and system contracts
- Supports interop contracts when enabled

**Required Environment Variables:**
- `NETWORK` - Target network (`l1` or `l2`)
- `ALCHEMY_KEY` - Alchemy API key (required for L1 networks)

**Optional Environment Variables:**
- `BLOCKSCOUT_API_KEY` - API key for Blockscout verification
- `ETHERSCAN_API_KEY` - API key for Etherscan verification
- `TENDERLY_URL` - Tenderly verification URL
- `TENDERLY_API_KEY` - Tenderly API key

**Configuration:**
- **Release**: `celo-contracts/v3.0.0`
- **Deployer**: `0x95a40aA01d2d72b4122C19c86160710D01224ada`
- **Interop Support**: Configurable via `USE_INTEROP` flag

**Network Configuration:**

| Network | Chain ID | RPC Endpoint | Block Explorer |
|---------|----------|--------------|----------------|
| L1 (Sepolia) | 11155111 | Alchemy | eth-sepolia.blockscout.com |
| L2 (Celo-Sepolia) | 11142220 | Forno | celo-sepolia.blockscout.com |

**Example Execution:**
```bash
NETWORK="l1" ALCHEMY_KEY="your-key" BLOCKSCOUT_API_KEY="your-key" ./verify-new-op-chain.sh
```

### `verify-upgrade-impls.sh`

Verifies implementation contracts for OPCM upgrades across different versions and networks.

**Features:**
- Supports v2 and v3 upgrade verifications
- Works with Mainnet and Holesky testnet
- Verifies OPCM container and all implementation contracts
- Includes constructor argument encoding for complex deployments

**Required Environment Variables:**
- `NETWORK` - Target network (`mainnet` or `holesky`)
- `VERSION` - Upgrade version (`v2` or `v3`)

**Optional Environment Variables:**
- `BLOCKSCOUT_API_KEY` - API key for Blockscout verification
- `ETHERSCAN_API_KEY` - API key for Etherscan verification
- `TENDERLY_URL` - Tenderly verification URL
- `TENDERLY_API_KEY` - Tenderly API key

**Pre-configured Contract Addresses:**

The script includes hardcoded addresses for various deployments:
- **Baklava**: V2 and V3 configurations
- **Alfajores**: V2 and V3 configurations
- **Mainnet**: V2 and V3 configurations

**Version-Specific Contracts:**

#### V2 Implementation Contracts
- DelayedWETH with 604800 second delay
- OptimismPortal2 with maturity and finality delays
- SystemConfig, L1CrossDomainMessenger, bridges, and factories
- DisputeGameFactory, AnchorStateRegistry
- SuperchainConfig, ProtocolVersions

#### V3 Implementation Contracts
- OPContractsManagerContractsContainer with blueprints and implementations
- OPContractsManagerGameTypeAdder, Deployer, and Upgrader
- Enhanced versions of all V2 contracts
- Additional Celo-specific contracts

**Example Execution:**
```bash
NETWORK="mainnet" VERSION="v3" ETHERSCAN_API_KEY="your-key" ./verify-upgrade-impls.sh
```

### `verify-upgrade-validator.sh`

Verifies validator contracts used in upgrade processes.

**Features:**
- Supports StandardValidator V2.0.0 and V3.0.0
- Configurable chain ID with Holesky as default
- Automatic block explorer URL selection based on chain
- Complex constructor argument encoding

**Required Environment Variables:**
- `VERSION` - Validator version (`v2` or `v3`)
- `VALIDATOR` - Validator contract address

**Optional Environment Variables:**
- `CHAIN_ID` - Target chain ID (defaults to 17000 for Holesky)
- `BLOCKSCOUT_API_KEY` - API key for Blockscout verification
- `ETHERSCAN_API_KEY` - API key for Etherscan verification
- `TENDERLY_URL` - Tenderly verification URL
- `TENDERLY_API_KEY` - Tenderly API key

**Pre-configured Validators:**
- **Baklava V3**: `0x9df52e41189e89485bb7aee1e5cc93874dd89712`
- **Alfajores V3**: `0xc6bacfa8421117677e03c3eb81d44b37a9ceef31`

**Example Execution:**
```bash
VERSION="v3" VALIDATOR="0x..." CHAIN_ID="17000" ETHERSCAN_API_KEY="your-key" ./verify-upgrade-validator.sh
```

## Contract Categories

### L1 Contracts
- **OPCM Suite**: OPContractsManager and related contracts
- **Portal Contracts**: OptimismPortal2, DelayedWETH
- **Messaging**: L1CrossDomainMessenger
- **Bridges**: L1StandardBridge, L1ERC721Bridge
- **Factories**: OptimismMintableERC20Factory, DisputeGameFactory
- **System**: SystemConfig, SuperchainConfig, ProtocolVersions
- **Celo-Specific**: CeloSuperchainConfig, CeloTokenL1

### L2 Contracts
- **Core System**: LegacyMessagePasser, DeployerWhitelist, WETH
- **Messaging**: L2CrossDomainMessenger
- **Bridges**: L2StandardBridge, L2ERC721Bridge
- **Fee Vaults**: SequencerFeeVault, BaseFeeVault, L1FeeVault, OperatorFeeVault
- **Factories**: OptimismMintableERC20Factory, OptimismMintableERC721Factory
- **Attestation**: SchemaRegistry, EAS
- **Governance**: GovernanceToken
- **Interop** (optional): CeloL2Interop, L2ToL2CrossDomainMessenger, SuperchainWETH, ETHLiquidity, SuperchainTokenBridge
