# Network Forking Scripts

This directory contains scripts for forking various blockchain networks for local development and testing purposes.

## Scripts

### `fork_l1.sh`

Forks an L1 network (Ethereum mainnet or Sepolia testnet) using Anvil.

**Required Environment Variables:**

- `NETWORK` - Network to fork (`mainnet` or `sepolia`)
- `BLOCK_NUMBER` - Block number to fork from
- `RPC_URL` - RPC endpoint to fork from. If not set, falls back to Alchemy (`ALCHEMY_API_KEY` required)

**Optional Environment Variables:**

- `ALCHEMY_API_KEY` - Your Alchemy API key (only required when `RPC_URL` is not set)

**Supported Networks:**

- **mainnet**: Chain ID 1
- **sepolia**: Chain ID 11155111

**Example Execution:**

```bash
# Using a custom RPC URL
RPC_URL="https://..." NETWORK="mainnet" BLOCK_NUMBER="..." ./fork_l1.sh

# Using Alchemy (RPC_URL built automatically)
ALCHEMY_API_KEY="..." NETWORK="mainnet" BLOCK_NUMBER="..." ./fork_l1.sh
```

The script will start an Anvil instance on port 8545 with the specified network forked.

### `fork_l2.sh`

Forks the Celo Sepolia testnet (L2) using Anvil.

**No environment variables required.**

**Network Details:**

- **Network**: Celo Sepolia testnet
- **Chain ID**: 11142220
- **RPC URL**: https://forno.celo-sepolia.celo-testnet.org

**Example Execution:**

```bash
./fork_l2.sh
```

The script will start an Anvil instance on port 8546 with the Celo Sepolia testnet forked.

### `mock-mainnet.sh`

Sets up a mocked mainnet environment with predefined multisig configurations and account balances. This script is designed to work with a running Anvil instance (typically started by `fork_l1.sh`).

**Optional Environment Variables:**

- `ACCOUNT` - External account address to use as a signer
- `TEAM` - Team identifier (`clabs` or `council`)
- `GC_MULTISIG` - Grand Child multisig address (only supported for council team)

**Features:**

- Sets 10,000 ETH balance for all mocked accounts
- Configures multisig thresholds and owner counts
- Sets up ownership circular linked lists for multisigs
- Enhanced external account integration with dynamic signer replacement
- Comprehensive Grand Child multisig support for Council team
- Detailed validation reporting for all multisig configurations

**Multisig Structure:**

- **Parent Multisig**: Controls cLabs and Council multisigs (threshold: 2)
- **cLabs Multisig**: Controlled by Signer #1 and Signer #2 (threshold: 2)
- **Council Multisig**: Controlled by Signer #3 and Signer #4 (threshold: 2) or Grand Child + Signer #4
- **Grand Child Multisig**: Controlled by Signer #3 (threshold: 1, only for Council team)

**Required Environment Variables:**

- `MOCKED_SIGNER_1` - Address for first signer (unless external account used for cLabs)
- `MOCKED_SIGNER_2` - Address for second signer
- `MOCKED_SIGNER_3` - Address for third signer (unless external account used for council)
- `MOCKED_SIGNER_4` - Address for fourth signer

> **Important**: These signer addresses must correspond exactly to the private keys used in `exec-mocked.sh`:
>
> - `MOCKED_SIGNER_1` → `SIGNER_1_PK` (cLabs team signer)
> - `MOCKED_SIGNER_2` → `SIGNER_2_PK` (cLabs team signer)
> - `MOCKED_SIGNER_3` → `SIGNER_3_PK` (Council team signer)
> - `MOCKED_SIGNER_4` → `SIGNER_4_PK` (Council team signer)

**Example Execution:**

```bash
# Basic execution (uses default mocked accounts)
MOCKED_SIGNER_1="0x..." MOCKED_SIGNER_2="0x..." MOCKED_SIGNER_3="0x..." MOCKED_SIGNER_4="0x..." ./mock-mainnet.sh

# With external account for cLabs team (replaces MOCKED_SIGNER_1)
ACCOUNT="0x..." TEAM="clabs" MOCKED_SIGNER_2="0x..." MOCKED_SIGNER_3="0x..." MOCKED_SIGNER_4="0x..." ./mock-mainnet.sh

# With external account and Grand Child multisig for council team (replaces MOCKED_SIGNER_3)
ACCOUNT="0x..." TEAM="council" GC_MULTISIG="0x..." MOCKED_SIGNER_1="0x..." MOCKED_SIGNER_2="0x..." MOCKED_SIGNER_4="0x..." ./mock-mainnet.sh
```

### `mock-sepolia.sh`

Prepares a forked testnet environment for Sepolia or Chaos networks. Fixes the SuperchainConfig proxy admin and transfers ownership of key OP Stack contracts to the deployed Gnosis Safe. Requires a running Anvil instance (typically started by `fork_l1.sh`).

**Required Environment Variables:**

- `NETWORK` - Network to mock (`sepolia` or `chaos`)

**Features:**

- Fixes SuperchainConfig proxy admin by writing the ProxyAdmin address into the EIP-1967 admin slot
- Transfers ownership of ProxyAdmin, SystemConfig, DisputeGameFactory, DelayedWETH, and ProtocolVersions to the network's deployed Safe (via impersonation + `transferOwnership()`)
- Skips contracts already owned by the target Safe
- Validation output: prints SuperchainConfig admin and ownership of all transferred contracts

**Network-Specific Addresses:**

|                            | sepolia                                      | chaos                                        |
| -------------------------- | -------------------------------------------- | -------------------------------------------- |
| **Safe**                   | `0x009A6Ac23EeBe98488ED28A52af69Bf46F1C18cb` | `0x6F8DB5374003c9ffa7084d8b65c57655963766a9` |
| **SuperchainConfig Proxy** | `0x31bEef32135c90AE8E56Fb071B3587de289Aaf77` | `0x7801D0a005d13CB66f8113BC28cb2640D8f44A6F` |
| **ProxyAdmin**             | `0xF7d7A3d3bb8aBb6829249B3D3aD3d525D052027e` | `0xb2a0c2b49cdc2d3f0a0a291be0a6c20559ec053e` |
| **SystemConfig**           | `0x760a5F022C9940f4A074e0030be682F560d29818` | `0x6baf5959cc06a39793c338e6586f49473c731b4c` |
| **DisputeGameFactory**     | `0x57C45d82D1a995F1e135B8D7EDc0a6BB5211cfAA` | `0x338ac809e6a045cfc8aeb16ff8a4329147b61afb` |
| **DelayedWETH**            | `0x082F5f58B664CD1d51F9845fEE322aBA2cED9CbA` | `0x9a95f7f7cdbb5195674a32d1579504e8fd302cc9` |
| **ProtocolVersions**       | `0x0e2d45F3393C3A02ebf285F998c5bF990A1541cd` | `0x433a83893DDA68B941D4aefA908DED9c599522ad` |

**Example Execution:**

```bash
NETWORK="sepolia" ./mock-sepolia.sh
NETWORK="chaos" ./mock-sepolia.sh
```

## Usage Workflow

1. **Start L1 fork:**

   ```bash
   # Option A: custom RPC
   export RPC_URL="https://your-rpc-endpoint"
   export NETWORK="mainnet"
   export BLOCK_NUMBER="desired_block"
   ./fork_l1.sh

   # Option B: Alchemy (auto-builds RPC URL)
   export ALCHEMY_API_KEY="your_key"
   export NETWORK="mainnet"
   export BLOCK_NUMBER="desired_block"
   ./fork_l1.sh
   ```

2. **Start L2 fork (optional):**

   ```bash
   ./fork_l2.sh
   ```

3. **In another terminal, set up mocked environment:**

   ```bash
   # For mainnet fork: use the same addresses that correspond to your private keys in exec-mocked.sh
   MOCKED_SIGNER_1="0x..." MOCKED_SIGNER_2="0x..." MOCKED_SIGNER_3="0x..." MOCKED_SIGNER_4="0x..." ./mock-mainnet.sh

   # For Sepolia/Chaos fork: set NETWORK to sepolia or chaos
   NETWORK="sepolia" ./mock-sepolia.sh
   ```

## Ports Used

- **8545**: L1 fork (mainnet/sepolia)
- **8546**: L2 fork (celo-sepolia)

## Notes

- The mock-mainnet script requires a running Anvil instance on port 8545
- External accounts can be used to replace default mocked signers for testing specific scenarios
- The Grand Child multisig feature is only available for the council team configuration
- All signer addresses must be provided via environment variables for proper multisig setup
- The script performs comprehensive validation of all multisig configurations after setup
- External account integration dynamically replaces the appropriate signer based on team selection
- **Critical**: The signer addresses configured here must match the private keys used in `exec-mocked.sh` for proper multisig operation
