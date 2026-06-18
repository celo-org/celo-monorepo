# Transaction Execution Scripts

This directory contains scripts for executing OPCM upgrade transactions through the Celo Safe Multisig.

## Prerequisites

- Valid signatures from desired Multisig signatories for transaction execution
- For scripts that load signatures from file (`exec-upgrade.sh`, `exec-basefee.sh`): Decrypted signer files are required. Run from repo root:
  ```bash
  ./scripts/key_placer.sh decrypt
  ```
  This decrypts the following files using GCP KMS (requires `celo-testnet-production` access):
  - `secrets/.env.signers.v2`
  - `secrets/.env.signers.v3`
  - `secrets/.env.signers.v4`
  - `secrets/.env.signers.v5`
  - `secrets/.env.signers.succinct`
  - `secrets/.env.signers.succinct102`
  - `secrets/.env.signers.succinct200`
  - `secrets/.env.signers.succinct201`
  - `secrets/.env.signers.succinct210`
  - `secrets/.env.signers.basefee`

## Scripts

### `exec-upgrade.sh`

Unified runner for executing OPCM upgrade transactions through the complete multisig approval chain. Replaces previous per-upgrade scripts.

**Features:**

- Unified runner for all historical and current upgrades
- Supports positional arguments for network and version selection
- Extensive support for Mainnet (8 versions) and Sepolia (4 versions)
- Handles both 2-tier and 3-tier nested Safe approval flows
- Dynamic parent signature ordering based on network-specific Safe addresses
- Per-version `REFUND_RECEIVER` configuration to maintain signature validity

**Usage:**

```bash
PK=0x... RPC_URL=... ./exec-upgrade.sh <network> <version>
```

**Required Environment Variables:**

- `PK` - Private key for transaction execution

**Optional Environment Variables:**

- `RPC_URL` - RPC endpoint (defaults to `http://127.0.0.1:8545`)

**Version Matrix:**

| Network | Version | Flow | Refund receiver | Signer source |
|---------|---------|------|-----------------|---------------|
| mainnet | v2 | 3-tier (GC) | `0x000…000` | `secrets/.env.signers.v2` (suffix `_V2`) |
| mainnet | v3 | 3-tier (GC) | `0x000…000` | `secrets/.env.signers.v3` (suffix `_V3`) |
| mainnet | v4 | 2-tier | `0x95ffac…` | `secrets/.env.signers.v4` |
| mainnet | v5 | 2-tier | `0x95ffac…` | `secrets/.env.signers.v5` |
| mainnet | succ-v1 | 3-tier (GC) | `0x95ffac…` | `secrets/.env.signers.succinct` |
| mainnet | succ-v102 | 3-tier (GC) | `0x95ffac…` | `secrets/.env.signers.succinct102` |
| mainnet | succ-v2 | 2-tier | `0x95ffac…` | `secrets/.env.signers.succinct200` |
| mainnet | succ-v201 | 2-tier | `0x95ffac…` | `secrets/.env.signers.succinct201` |
| mainnet | succ-v210 | 2-tier | `0x95ffac…` | `secrets/.env.signers.succinct210` |
| sepolia | v4 | 2-tier (1-of-2 children) | `0x5e60d…` | inline |
| sepolia | v5 | 2-tier (1-of-2 children) | `0x5e60d…` | inline |
| sepolia | succ-v2 | 2-tier (1-of-2 children) | `0x5e60d…` | inline |
| sepolia | succ-v210 | 2-tier (1-of-2 children) | `0x5e60d…` | inline |

**Adding a New Upgrade:**

To add a new upgrade, paste a new `"network-version")` case block in `exec-upgrade.sh`. Fill in the required fields: `USE_GC`, `REFUND_RECEIVER`, signer source, nonces, target address, and calldata. This provides a single place to edit for new releases.

**Multisig Addresses:**

#### Mainnet

- **Parent Safe**: `0x4092A77bAF58fef0309452cEaCb09221e556E112`
- **cLabs Safe**: `0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d`
- **Council Safe**: `0xC03172263409584f7860C25B6eB4985f0f6F4636`
- **Grand Child Safe**: `0xD1C635987B6Aa287361d08C6461491Fa9df087f2`

#### Sepolia

- **Parent Safe**: `0x009A6Ac23EeBe98488ED28A52af69Bf46F1C18cb`
- **cLabs Safe**: `0x769b480A8036873a2a5EB01FE39278e5Ab78Bb27`
- **Council Safe**: `0x3b00043E8C82006fbE5f56b47F9889a04c20c5d6`

**Examples:**

```bash
# Mainnet 3-tier (historical, executed)
PK="0x..." ./exec-upgrade.sh mainnet v2
PK="0x..." ./exec-upgrade.sh mainnet succ-v1

# Mainnet 2-tier
PK="0x..." ./exec-upgrade.sh mainnet succ-v201

# Sepolia
PK="0x..." ./exec-upgrade.sh sepolia succ-v210
```

### `exec-basefee.sh`

Executes the base fee update proposal directly through the cLabs Safe (no Parent/Council chain). Sets minimum base fee and DA footprint gas scalar on SystemConfig via MultiSend delegatecall. Must run after Jovian upgrade (v4 + v5 + succ-v2) completes, which transfers SystemConfig ownership to cLabs.

**Features:**

- Direct cLabs Safe execution (6-of-8 ECDSA signatures)
- Loads signatures from `secrets/.env.signers.basefee`
- Builds MultiSend calldata dynamically (same as CeloSuperchainOps sign-basefee.sh)
- Delegatecalls MultiSend to batch `setMinBaseFee` + `setDAFootprintGasScalar`

**Required Environment Variables:**

- `PK` - Private key for transaction execution

**Optional Environment Variables:**

- `RPC_URL` - RPC endpoint (defaults to `http://127.0.0.1:8545`)

**Required Files:**

- `secrets/.env.signers.basefee` - Decoded signers file (must be decrypted before running)

**Configuration:**

| Parameter    | Value                                                    |
| ------------ | -------------------------------------------------------- |
| Safe         | `0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d` (cLabs)     |
| Target       | `0x9641d764fc13c8B624c04430C7356C1C7C8102e2` (MultiSend) |
| SystemConfig | `0x89E31965D844a309231B1f17759Ccaf1b7c09861`             |
| cLabs Nonce  | 27 (after v4=24, v5=25, succ-v2=26)                      |
| Min Base Fee | 25000000000 wei (25 gwei)                                |
| DA Scalar    | 1                                                        |

**Signers:**

| Safe  | Count | Threshold | Address suffixes             |
| ----- | ----- | --------- | ---------------------------- |
| cLabs | 6     | 6-of-8    | 21e, 4D8, 74b, 812, 8b4, E00 |

**Example Execution:**

```bash
# After Jovian completes (v4 → v5 → succ-v2):
PK="0x..." ./exec-basefee.sh
```

### `exec-mocked.sh`

Simplified and mocked simulation of network upgrade with support for providing an arbitrary account with signature. Designed for testing and development.

**Features:**

- Mocked multisig environment for testing
- Support for external account signatures with enhanced validation
- Configurable approval or signing behavior
- Grand Child multisig support for Council team
- Simplified execution flow for development
- Sender address validation for security

**Required Environment Variables:**

- `VERSION` - Target version (`v2`, `v3`, `v4`, `v5`, `succ`, `succ-v102`, or `succ-v2`)
- `PK` - Private key for transaction execution
- `SENDER` - Expected sender address (must match the address derived from `PK`)
- `SIGNER_1_PK` - Private key for first signer (unless external account used)
- `SIGNER_2_PK` - Private key for second signer
- `SIGNER_3_PK` - Private key for third signer (unless external account used)
- `SIGNER_4_PK` - Private key for fourth signer

> **Important**: The signer addresses used in `exec-mocked.sh` must correspond exactly to the mocked signers configured in `mock-mainnet.sh`:
>
> - `SIGNER_1_PK` → `MOCKED_SIGNER_1` (cLabs team signer)
> - `SIGNER_2_PK` → `MOCKED_SIGNER_2` (cLabs team signer)
> - `SIGNER_3_PK` → `MOCKED_SIGNER_3` (Council team signer)
> - `SIGNER_4_PK` → `MOCKED_SIGNER_4` (Council team signer)
>
> The `SENDER` address is validated against the `PK` to ensure proper account control.

**Optional Environment Variables:**

- `SIG` - External signature (used with `ACCOUNT` and `TEAM`)
- `ACCOUNT` - External account address
- `TEAM` - Team identifier (`clabs` or `council`)
- `GC_MULTISIG` - Grand Child multisig address (`council` team only)

**Example Executions:**

#### Basic Mocked Execution (v3)

```bash
VERSION="v3" PK="0x..." SENDER="0x..." SIGNER_1_PK="0x..." SIGNER_2_PK="0x..." SIGNER_3_PK="0x..." SIGNER_4_PK="0x..." ./exec-mocked.sh
```

#### Basic Mocked Execution (Succinct v1.0.2)

```bash
VERSION="succ-v102" PK="0x..." SENDER="0x..." SIGNER_1_PK="0x..." SIGNER_2_PK="0x..." SIGNER_3_PK="0x..." SIGNER_4_PK="0x..." ./exec-mocked.sh
```

#### With External cLabs Account

```bash
VERSION="v3" PK="0x..." SENDER="0x..." SIG="0x..." ACCOUNT="0x..." TEAM="clabs" SIGNER_2_PK="0x..." SIGNER_3_PK="0x..." SIGNER_4_PK="0x..." ./exec-mocked.sh
```

#### With External Council Account

```bash
VERSION="v3" PK="0x..." SENDER="0x..." SIG="0x..." ACCOUNT="0x..." TEAM="council" SIGNER_1_PK="0x..." SIGNER_2_PK="0x..." SIGNER_4_PK="0x..." ./exec-mocked.sh
```

#### With Mento Member from External Council Account and Grand Child Multisig

```bash
VERSION="v3" PK="0x..." SENDER="0x..." SIG="0x..." ACCOUNT="0x..." TEAM="council" GC_MULTISIG="0x..." SIGNER_1_PK="0x..." SIGNER_2_PK="0x..." SIGNER_4_PK="0x..." ./exec-mocked.sh
```

## Execution Flow

The `exec-upgrade.sh` script handles the following flows based on version configuration:

### Full Nested Flow (3-tier)

Used by historical upgrades (mainnet `v2`, `v3`, `succ-v1`, `succ-v102`).

1. **Grand Child Approval**: Approve Council transaction
2. **Council Approval**: Approve Parent transaction
3. **cLabs Approval**: Approve Parent transaction
4. **Parent Execution**: Execute upgrade via delegatecall

### Jovian Flow (2-tier)

Used by current upgrades (mainnet `v4`, `v5`, `succ-v2`, `succ-v201`, and all Sepolia versions).

1. **Council Approval**: Approve Parent transaction
2. **cLabs Approval**: Approve Parent transaction
3. **Parent Execution**: Execute upgrade via delegatecall

### Direct cLabs Flow

Used by `exec-basefee.sh` only.

1. **cLabs Execution**: Execute transaction directly (6-of-8 ECDSA signatures, no Parent/Council chain)

### Mocked Flow

Used by `exec-mocked.sh`.

1. **cLabs Approval**: Approve Parent transaction
2. **Council Approval**: Approve Parent transaction (with optional Grand Child)
3. **Parent Execution**: Execute OPCM upgrade

## Transaction Parameters

### Common Parameters

- **Value**: 0 ETH
- **Operation**: 1 (delegatecall) for OPCM/Multicall3 calls; 0 (call) for nested-Safe `approveHash` calls
- **Safe Tx Gas**: 0 (unlimited)
- **Base Gas**: 0
- **Gas Price**: 0
- **Gas Token**: Zero address
- **Refund Receiver**: Per-version (see Version Matrix). Mainnet v2/v3 use zero address; mainnet v4+ use `0x95ffac...`; Sepolia uses `0x5e60d...`

### Calldata Structure

Two formats are used depending on the upgrade:

- **OPCM upgrade** (selector `0xa4589780`, used by v2/v3/v4/v5): `[chain configs array] + [system config proxy] + [proxy admin] + [prestate hash]`
- **Multicall3 `aggregate3`** (selector `0x82ad56cb`, used by all succ-* and basefee): batched calls (e.g., `DGF.setImplementation`, `SystemConfig.transferOwnership`)

## Network Support

| Network    | Environment | Use Case                        |
| ---------- | ----------- | ------------------------------- |
| Local Fork | Development | Testing with mocked environment |
| Mainnet    | Production  | Live network upgrades           |
| Sepolia    | Staging     | Pre-production validation       |

## Notes

- Signatures must be ordered by signer address for proper multisig execution
- The `exec-upgrade.sh` script centralizes production-ready transaction data and signatures
- The `exec-mocked.sh` script is designed for development and testing scenarios
- Gas limits are set to 16,000,000 for OPCM upgrade transactions
- Nonces must be sequential and match the current multisig state
- **Critical**: The signer private keys in `exec-mocked.sh` must correspond to the addresses configured in `mock-mainnet.sh` for proper multisig operation
