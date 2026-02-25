# Transaction Execution Scripts

This directory contains scripts for executing OPCM upgrade transactions through the Celo Safe Multisig.

## Prerequisites

- Valid signatures from desired Multisig signatories for transaction execution

## Scripts

### `exec.sh`

Generalized upgrade script for future migrations. Executes OPCM upgrade transactions through the complete multisig approval chain.

**Features:**
- Executes OPCM upgrade transactions with proper multisig approvals
- Supports custom calldata and signatures
- Handles the complete approval chain: Mento → Council → cLabs → Parent
- Uses delegatecall for OPCM upgrades

**Required Environment Variables:**
- `PK` - Private key for transaction execution
- `OPCM_ADDRESS` - Address of the Optimism Chain Manager contract
- `OPCM_UPGRADE_CALLDATA` - Calldata for the upgrade transaction
- `MENTO_SIG` - Signature from Mento multisig
- `COUNCIL_SIG` - Signature from Council multisig
- `CLABS_SIG` - Signature from cLabs multisig

**Optional Environment Variables:**
- `RPC_URL` - RPC endpoint (defaults to `http://127.0.0.1:8545`)

**Multisig Addresses:**
- **Parent Safe**: `0x4092A77bAF58fef0309452cEaCb09221e556E112`
- **cLabs Safe**: `0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d`
- **Council Safe**: `0xC03172263409584f7860C25B6eB4985f0f6F4636`
- **Mento Safe**: `0xD1C635987B6Aa287361d08C6461491Fa9df087f2`

**Example Execution:**
```bash
PK="0x..." OPCM_ADDRESS="0x..." OPCM_UPGRADE_CALLDATA="0x..." MENTO_SIG="0x..." COUNCIL_SIG="0x..." CLABS_SIG="0x..." ./exec.sh
```

### `exec-v2v3.sh`

Final script used for migration from `1.8.0` to `2.0.0` & from `2.0.0` to `3.0.0`. Contains hardcoded transaction data and signatures for the specific v2 and v3 upgrades.

**Features:**
- Hardcoded transaction data for v2 and v3 upgrades
- Pre-configured signatures from all multisig members
- Executes both v2 and v3 upgrades in sequence
- Uses deterministic nonces and contract addresses

**Required Environment Variables:**
- `PK` - Private key for transaction execution

**Optional Environment Variables:**
- `RPC_URL` - RPC endpoint (defaults to `http://127.0.0.1:8545`)

**Version-Specific Data:**

#### V2.0.0 Configuration
- **OPCM Address**: `0x597f110a3bee7f260b1657ab63c36d86b3740f36`
- **Parent Nonce**: 22
- **cLabs Nonce**: 19
- **Council Nonce**: 21
- **Mento Nonce**: 2
- **Prestate Hash**: `0x03b357b30095022ecbb44ef00d1de19df39cf69ee92a60683a6be2c6f8fe6a3e`

#### V3.0.0 Configuration
- **OPCM Address**: `0x2e8cd74af534f5eeb53f889d92fd4220546a15e7`
- **Parent Nonce**: 23
- **cLabs Nonce**: 20
- **Council Nonce**: 22
- **Mento Nonce**: 3
- **Prestate Hash**: `0x034b32d11f017711ce7122ac71d87b1c6cc73e10a0dbd957d8b27f6360acaf8f`

**Example Execution:**
```bash
PK="0x..." ./exec-v2v3.sh
```

### `exec-succinct.sh`

Script used to execute the OP Succinct upgrade transaction through the nested Safe multisig chain. Contains hardcoded transaction data and signatures loaded from a decoded signers file.

**Features:**
- Loads signer addresses and signatures from `secrets/.env.signers.succinct`
- Hardcoded nonces and calldata for the Succinct upgrade
- Executes the full approval chain: Grand Child → Council → cLabs → Parent
- Uses Multicall3 as the target with delegatecall
- Pre-configured cLabs (6 signers), Council (5 signers), and Grand Child (2 signers)

**Required Environment Variables:**
- `PK` - Private key for transaction execution

**Optional Environment Variables:**
- `RPC_URL` - RPC endpoint (defaults to `http://127.0.0.1:8545`)

**Required Files:**
- `secrets/.env.signers.succinct` - Decoded signers file containing signer addresses and signatures (must be decrypted before running)

**Upgrade Configuration:**
- **Target Address**: `0xcA11bde05977b3631167028862bE2a173976CA11` (Multicall3)
- **Parent Nonce**: 24
- **cLabs Nonce**: 21
- **Council Nonce**: 23
- **Grand Child Nonce**: 5

**Signers:**

| Safe | Count | Address suffixes |
|------|-------|-----------------|
| cLabs | 6 | 09C, 21E, 481, 4D8, 8B4, E00 |
| Council | 5 | 148, 5F7, 6FD, B96, D0C |
| Grand Child | 2 | C96, D80 |

**Example Execution:**
```bash
PK="0x..." ./exec-succinct.sh
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
- `VERSION` - Target version (`v2` or `v3`)
- `PK` - Private key for transaction execution
- `SENDER` - Expected sender address (must match the address derived from `PK`)
- `SIGNER_1_PK` - Private key for first signer (unless external account used)
- `SIGNER_2_PK` - Private key for second signer
- `SIGNER_3_PK` - Private key for third signer (unless external account used)
- `SIGNER_4_PK` - Private key for fourth signer

> **Important**: The signer addresses used in `exec-mocked.sh` must correspond exactly to the mocked signers configured in `mock-mainnet.sh`:
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

**Behavior Modes:**
- **`approve`**: Uses `approveHash` calls for multisig approvals
- **`sign`**: Uses signature-based execution (default)

**Example Executions:**

#### Basic Mocked Execution
```bash
VERSION="v3" PK="0x..." SENDER="0x..." SIGNER_1_PK="0x..." SIGNER_2_PK="0x..." SIGNER_3_PK="0x..." SIGNER_4_PK="0x..." ./exec-mocked.sh
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

### Standard Flow (exec.sh, exec-v2v3.sh)
1. **Mento Approval**: Approve Council transaction
2. **Council Approval**: Approve Parent transaction
3. **cLabs Approval**: Approve Parent transaction
4. **Parent Execution**: Execute OPCM upgrade

### Mocked Flow (exec-mocked.sh)
1. **cLabs Approval**: Approve Parent transaction
2. **Council Approval**: Approve Parent transaction (with optional Grand Child)
3. **Parent Execution**: Execute OPCM upgrade

### Succinct Flow (exec-succinct.sh)
1. **Grand Child Execution**: Execute approval of Council transaction
2. **Council Execution**: Execute approval of Parent transaction
3. **cLabs Execution**: Execute approval of Parent transaction
4. **Parent Execution**: Execute Succinct upgrade via Multicall3

## Transaction Parameters

### Common Parameters
- **Value**: 0 ETH
- **Operation**: 1 (delegatecall) for OPCM upgrades
- **Safe Tx Gas**: 0 (unlimited)
- **Base Gas**: 0
- **Gas Price**: 0
- **Gas Token**: Zero address
- **Refund Receiver**: Zero address

### Calldata Structure
The upgrade calldata follows the format:
```
0xa4589780 + [chain configs array] + [system config proxy] + [proxy admin] + [prestate hash]
```

## Network Support

| Network | Environment | Use Case |
|---------|-------------|----------|
| Local Fork | Development | Testing with mocked environment |
| Testnet | Staging | Pre-production validation |
| Mainnet | Production | Live network upgrades |

## Notes

- Signatures must be ordered by signer address for proper multisig execution
- The `exec-v2v3.sh` script contains production-ready transaction data and signatures
- The `exec-mocked.sh` script is designed for development and testing scenarios
- Gas limits are set to 16,000,000 for OPCM upgrade transactions
- Nonces must be sequential and match the current multisig state
- **Critical**: The signer private keys in `exec-mocked.sh` must correspond to the addresses configured in `mock-mainnet.sh` for proper multisig operation
