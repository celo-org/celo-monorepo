# L1 to L2 Deposits

This directory contains tooling for performing L1 to L2 deposits of CELO to Celo's L2 testnets. The workflow follows the Optimism-style deposit process using ERC20 token deposits.

## Important Notes

- **Private Keys**: Always provide private keys without `0x` prefix to all scripts
- **Values**: All VALUE parameters should be specified in wei
- **Approval**: The script automatically handles ERC20 token approval before deposit
- **Timing**: Deposits typically take a ~15 minutes to appear on L2

## Performing a Deposit

Initiates the deposit process from L1 to L2 using the Optimism Portal contract.

```sh
RECIPIENT=0x... VALUE=1000000000000000000 PK=123... L1_RPC_URL=https://... ./deposit.sh
```

**Required Environment Variables:**
- `RECIPIENT`: L2 address that will receive the funds
- `VALUE`: Amount to deposit in wei
- `PK`: Private key (without 0x prefix) of the sender
- `L1_RPC_URL`: L1 RPC URL to use for the deposit

**Optional Environment Variables:**
- `GAS_LIMIT`: Gas limit for the L2 transaction (default: 100000)
- `IS_CREATION`: Whether this is a contract creation (default: false)
- `DATA`: Additional data to include (default: "0x00")

**Output:** Transaction hashes for approval and deposit transactions

## How It Works

The deposit script performs three automated steps:

1. **Retrieves Gas Paying Token**: Queries the System Config contract to get the gas paying token (CELO) address on L1
2. **Approves Token**: Calls `approve()` on the gas paying token contract to allow the Optimism Portal to spend the specified amount
3. **Deposits Token**: Calls `depositERC20Transaction()` on the Optimism Portal to bridge tokens to L2

## Contract Addresses

### Network-Specific Contract Addresses

**Sepolia (L1: Sepolia, L2: Celo Sepolia) - Default:**
- **SYSTEM_CONFIG**: `0x760a5f022c9940f4a074e0030be682f560d29818` (Sepolia)
- **OPTIMISM_PORTAL**: `0x44ae3d41a335a7d05eb533029917aad35662dcc2` (Sepolia)

**Note:** The current [deposit.sh](deposit.sh) script is configured with Sepolia addresses.

## Example Usage

### Deposit 0.1 CELO to Sepolia

```sh
# Using Sepolia RPC
RECIPIENT=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb VALUE=100000000000000000 PK=your_private_key L1_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY ./deposit.sh
```

## Checking Deposit on L2

After initiating a deposit, you can check if it has arrived on L2 by:

1. Monitoring the L2 transaction using a block explorer:
   - Sepolia: https://sepolia.celoscan.io

## Related Documentation

For the reverse operation (withdrawing from L2 to L1), see the [withdrawal README](../withdrawal/README.md).
