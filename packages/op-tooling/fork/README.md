# Network Forking Scripts

This directory contains scripts for forking various blockchain networks for local development and testing purposes.

## Scripts

### `fork_l1.sh`

Forks an L1 network (Ethereum mainnet or Holesky testnet) using Anvil.

**Required Environment Variables:**
- `ALCHEMY_API_KEY` - Your Alchemy API key
- `NETWORK` - Network to fork (`mainnet` or `holesky`)

**Supported Networks:**
- **mainnet**: Chain ID 1, Block 22830470
- **holesky**: Chain ID 17000, Block 4050838

**Example Execution:**
```bash
ALCHEMY_API_KEY="..." NETWORK="mainnet" ./fork_l1.sh
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
- Validates the mocked configuration

**Multisig Structure:**
- **Parent Multisig**: Controls cLabs and Council multisigs
- **cLabs Multisig**: Controlled by Signer #1 and Signer #2
- **Council Multisig**: Controlled by Signer #3 and Signer #4 (or Grand Child + Signer #4)

**Example Execution:**
```bash
# Basic execution (uses default mocked accounts)
./mock-mainnet.sh

# With external account for cLabs team
ACCOUNT="0x..." TEAM="clabs" ./mock-mainnet.sh

# With external account and Grand Child multisig for council team
ACCOUNT="0x..." TEAM="council" GC_MULTISIG="0x..." ./mock-mainnet.sh
```

## Usage Workflow

1. **Start L1 fork:**
   ```bash
   export ALCHEMY_API_KEY="your_key"
   export NETWORK="mainnet"
   ./fork_l1.sh
   ```

2. **Start L2 fork (optional):**
   ```bash
   ./fork_l2.sh
   ```

3. **In another terminal, set up mocked environment:**
   ```bash
   ./mock-mainnet.sh
   ```

## Ports Used

- **8545**: L1 fork (mainnet/holesky)
- **8546**: L2 fork (alfajores)

## Notes

- The mock-mainnet script requires a running Anvil instance on port 8545
- External accounts can be used to replace default mocked signers for testing specific scenarios
- The Grand Child multisig feature is only available for the council team configuration
