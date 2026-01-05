# Network Forking Scripts

This directory contains scripts for forking various blockchain networks for local development and testing purposes.

## Scripts

### `fork_l1.sh`

Forks an L1 network (Ethereum mainnet, Sepolia testnet, or Holesky testnet) using Anvil.

**Required Environment Variables:**
- `ALCHEMY_API_KEY` - Your Alchemy API key
- `NETWORK` - Network to fork (`mainnet`, `sepolia`, or `holesky`)
- `BLOCK_NUMBER` - Block number to fork from

**Supported Networks:**
- **mainnet**: Chain ID 1
- **sepolia**: Chain ID 11155111
- **holesky**: Chain ID 17000

**Example Execution:**
```bash
ALCHEMY_API_KEY="..." NETWORK="mainnet" BLOCK_NUMBER="..." ./fork_l1.sh
```

The script will start an Anvil instance on port 8545 with the specified network forked.

### `fork_l2.sh`

Forks the Celo Alfajores testnet (L2) using Anvil.

**No environment variables required.**

**Network Details:**
- **Network**: Celo Alfajores testnet
- **Chain ID**: 44787
- **Block Number**: 47029145
- **RPC URL**: https://alfajores-forno.celo-testnet.org

**Example Execution:**
```bash
./fork_l2.sh
```

The script will start an Anvil instance on port 8546 with the Celo Alfajores testnet forked.

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

## Usage Workflow

1. **Start L1 fork:**
   ```bash
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
   # Use the same addresses that correspond to your private keys in exec-mocked.sh
   MOCKED_SIGNER_1="0x..." MOCKED_SIGNER_2="0x..." MOCKED_SIGNER_3="0x..." MOCKED_SIGNER_4="0x..." ./mock-mainnet.sh
   ```

## Ports Used

- **8545**: L1 fork (mainnet/holesky)
- **8546**: L2 fork (alfajores)

## Notes

- The mock-mainnet script requires a running Anvil instance on port 8545
- External accounts can be used to replace default mocked signers for testing specific scenarios
- The Grand Child multisig feature is only available for the council team configuration
- All signer addresses must be provided via environment variables for proper multisig setup
- The script performs comprehensive validation of all multisig configurations after setup
- External account integration dynamically replaces the appropriate signer based on team selection
- **Critical**: The signer addresses configured here must match the private keys used in `exec-mocked.sh` for proper multisig operation
