# L1 to L2 Deposits

This directory contains tooling for performing L1 to L2 deposits of CELO to Celo's L2 networks. The workflow follows the Optimism-style deposit process using ERC20 token deposits.

## Supported Networks

The tooling supports four network configurations:

- **Mainnet**: L1 (Ethereum Mainnet) ↔ L2 (Celo Mainnet)
- **Sepolia**: L1 (Ethereum Sepolia) ↔ L2 (Celo Sepolia) - *Testnet*
- **Chaos**: L1 (Ethereum Sepolia) ↔ L2 (Celo Chaos) - *Testnet*
- **Havoc**: L1 (Ethereum Sepolia) ↔ L2 (Celo Havoc) - *Testnet*

Set the `NETWORK` environment variable to specify which network to use (`mainnet`, `sepolia`, `chaos` or `havoc`). This variable is **required**.

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
- `NETWORK`: Network to use (`mainnet`, `sepolia`, `chaos` or `havoc`)

**Optional Environment Variables:**
- `CGT_VERSION`: Custom gas token version, `v1` (default) or `v2`
- `CELO_GAS_BRIDGE`: `CeloGasBridgeL1` address. **Required** when `CGT_VERSION=v2`
- `GAS_LIMIT`: Gas limit for the L2 transaction (default: 100000)
- `IS_CREATION`: Whether this is a contract creation (default: false, `v1` only)
- `DATA`: Additional data to include (default: "0x00")

**Output:** Transaction hashes for approval and deposit transactions

## How It Works

The script performs three steps; which contracts they touch depends on `CGT_VERSION`.

**`v1` (default)** — CELO routes through the Optimism Portal:

1. **Retrieves Gas Paying Token**: `SystemConfig.gasPayingToken()` for the CELO address on L1
2. **Approves Token**: `approve()` on CELO, letting the Optimism Portal spend the amount
3. **Deposits Token**: `OptimismPortal.depositERC20Transaction()`

**`v2`** — CELO routes through `CeloGasBridgeL1`:

1. **Retrieves CELO Token**: `CeloGasBridgeL1.celoTokenL1()`, so the token cannot drift from the bridge
2. **Approves Token**: `approve()` on CELO, letting the bridge spend the amount
3. **Deposits Token**: `CeloGasBridgeL1.deposit()`

The CGT v2 migration removes `depositERC20Transaction()` from the portal and makes
`SystemConfig.gasPayingToken()` revert, so the two paths share no calls and the version must be set
explicitly. `IS_CREATION` has no `v2` equivalent, since the bridge mints on L2 via the messenger.
`CeloGasBridgeL1` is deployed per network by `DeployV2.s.sol`, hence the `CELO_GAS_BRIDGE` env var
rather than a hardcoded address.

## Contract Addresses

### Network-Specific Contract Addresses

**Mainnet (L1: Ethereum Mainnet, L2: Celo Mainnet):**
- **SYSTEM_CONFIG**: `0x89E31965D844a309231B1f17759Ccaf1b7c09861` (Ethereum Mainnet)
- **OPTIMISM_PORTAL**: `0xc5c5D157928BDBD2ACf6d0777626b6C75a9EAEDC` (Ethereum Mainnet)

**Sepolia (L1: Ethereum Sepolia, L2: Celo Sepolia):**
- **SYSTEM_CONFIG**: `0x760a5f022c9940f4a074e0030be682f560d29818` (Ethereum Sepolia)
- **OPTIMISM_PORTAL**: `0x44ae3d41a335a7d05eb533029917aad35662dcc2` (Ethereum Sepolia)

**Chaos (L1: Ethereum Sepolia, L2: Celo Chaos):**
- **SYSTEM_CONFIG**: `0x6baf5959cc06a39793c338e6586f49473c731b4c` (Ethereum Sepolia)
- **OPTIMISM_PORTAL**: `0x101f7d8038BEb55D92919E9F944FEb0fAf211a9b` (Ethereum Sepolia)

**Havoc (L1: Ethereum Sepolia, L2: Celo Havoc):**
- **SYSTEM_CONFIG**: `0xafc6fa968aebf7b4030f4acae02da34c3287bc78` (Ethereum Sepolia)
- **OPTIMISM_PORTAL**: `0x7a79515f9f916f38B1AED2DDc2658139C2ecF709` (Ethereum Sepolia)

**Note:** The [deposit.sh](deposit.sh) script selects these via the `NETWORK` environment variable.

## Example Usage

### Deposit 0.1 CELO to Sepolia (Testnet)

```sh
# Using Sepolia - testnet
NETWORK=sepolia RECIPIENT=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb VALUE=100000000000000000 PK=your_private_key L1_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY ./deposit.sh
```

### Deposit 0.1 CELO to Mainnet

```sh
# Using Mainnet
NETWORK=mainnet RECIPIENT=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb VALUE=100000000000000000 PK=your_private_key L1_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY ./deposit.sh
```

### Deposit 0.1 CELO after the CGT v2 migration

```sh
NETWORK=havoc CGT_VERSION=v2 CELO_GAS_BRIDGE=0x... RECIPIENT=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb VALUE=100000000000000000 PK=your_private_key L1_RPC_URL=https://... ./deposit.sh
```

## Checking Deposit on L2

After initiating a deposit, you can check if it has arrived on L2 by:

1. Monitoring the L2 transaction using a block explorer:
   - Sepolia Testnet: https://sepolia.celoscan.io
   - Celo Mainnet: https://celoscan.io

## Troubleshooting

- **Transaction failed**: Ensure you have enough CELO on L1 to cover the deposit amount plus gas fees
- **RPC errors**: Ensure your L1_RPC_URL is valid and accessible
- **Private key format**: Ensure PK is provided without 0x prefix
- **Value format**: Ensure VALUE is in wei (not ETH/CELO in decimal form)
- **Network errors**: Ensure NETWORK is set to one of: `mainnet`, `sepolia`, `chaos`, `havoc`
- **`gasPayingToken()` reverts**: The network already migrated to CGT v2; set `CGT_VERSION=v2` and `CELO_GAS_BRIDGE`
- **Deposit not appearing on L2**: Wait up to 15 minutes for the deposit to be processed

## Related Documentation

For the reverse operation (withdrawing from L2 to L1), see the [withdrawal README](../withdrawal/README.md).
