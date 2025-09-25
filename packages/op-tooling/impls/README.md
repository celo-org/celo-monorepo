# Optimism Implementation Scripts

This directory contains Foundry scripts for deploying and managing Optimism contract implementations. These scripts interact with the Optimism repository and must be executed from the Optimism contracts-bedrock directory.

## Important Usage Note

**All scripts in this directory must be executed with root pointing to the Optimism repository contracts folder:**
```bash
forge script --root $PATH_TO_OP_REPO/packages/contracts-bedrock
```

## Scripts

### `DeployPortalImpl.s.sol`

Deploys a new OptimismPortal2 implementation contract with configurable proof maturity and dispute game finality delays.

**Features:**
- Deploys OptimismPortal2 implementation using deterministic deployment
- Configurable proof maturity delay and dispute game finality delay
- Uses DeployUtils for consistent deployment patterns
- Outputs deployed implementation address

**Required Environment Variables:**
- `PROOF_MATURITY_DELAY_SECONDS` - Proof maturity delay in seconds
- `DISPUTE_GAME_FINALITY_DELAY_SECONDS` - Dispute game finality delay in seconds

**Example Execution:**
```bash
PROOF_MATURITY_DELAY_SECONDS=604800 DISPUTE_GAME_FINALITY_DELAY_SECONDS=604800 forge script DeployPortalImpl.s.sol --root $PATH_TO_OP_REPO/packages/contracts-bedrock --broadcast --private-key $PK --rpc-url $RPC
```

### `SafeSetPortal.s.sol`

Executes Safe multisig transactions to upgrade the OptimismPortal proxy to a new implementation.

**Features:**
- Builds Safe transactions for proxy upgrades via ProxyAdmin
- Generates Safe transaction hashes for signature collection
- Executes Safe transactions with provided signatures
- Uses delegatecall operations for proper proxy upgrades

**Required Environment Variables:**
- `PORTAL_PROXY` - Address of the OptimismPortal proxy
- `PORTAL_IMPL` - Address of the new OptimismPortal implementation
- `PROXY_ADMIN` - Address of the ProxyAdmin contract
- `SAFE` - Address of the Safe multisig wallet
- `SENDER` - Address of the transaction sender

**Optional Environment Variables:**
- `SIG` - Transaction signatures (required for execution)

**Functions:**
- `getTransactionHash()` - Generates transaction hash for signature collection
- `execTransaction()` - Executes the Safe transaction with signatures

**Example Execution:**
```bash
# Generate transaction hash
PORTAL_PROXY="0x..." PORTAL_IMPL="0x..." PROXY_ADMIN="0x..." SAFE="0x..." SENDER="0x..." forge script SafeSetPortal.s.sol --sig "getTransactionHash()" --root $PATH_TO_OP_REPO/packages/contracts-bedrock --rpc-url $RPC

# Sign transaction hash
cast wallet sign --no-hash --private-key $PK $HASH

# Execute transaction with signature
PORTAL_PROXY="0x..." PORTAL_IMPL="0x..." PROXY_ADMIN="0x..." SAFE="0x..." SENDER="0x..." SIG="0x..." forge script SafeSetPortal.s.sol --sig "execTransaction()" --root $PATH_TO_OP_REPO/packages/contracts-bedrock --broadcast --private-key $PK --rpc-url $RPC
```

### `RedeployGames.s.sol`

Redeploys dispute game implementations with updated configuration parameters, particularly for modifying the maximum clock duration.

**Features:**
- Redeploys both permissioned and permissionless dispute games
- Updates maximum clock duration for dispute games
- Preserves existing game configuration while updating specific parameters
- Supports both Cannon (permissionless) and Permissioned Cannon game types
- Uses deterministic salt-based deployment for consistency

**Required Environment Variables:**
- `OPCM` - Address of existing Optimism Contracts Manager
- `FACTORY` - Address of the DisputeGameFactory
- `SYSTEM_CONFIG` - Address of the SystemConfig proxy
- `MAX_CLOCK_DURATION` - New maximum clock duration in seconds

**Example Execution:**
```bash
OPCM="0x..." FACTORY="0x..." SYSTEM_CONFIG="0x..." MAX_CLOCK_DURATION=604800 forge script RedeployGames.s.sol --root $PATH_TO_OP_REPO/packages/contracts-bedrock --broadcast --private-key $PK --rpc-url $RPC
```

### `SafeSetGames.s.sol`

Executes Safe multisig transactions to update dispute game implementations in the DisputeGameFactory.

**Features:**
- Builds multicall transactions for updating both permissioned and permissionless game implementations
- Generates Safe transaction hashes for signature collection
- Executes Safe transactions with provided signatures
- Uses delegatecall operations for proper proxy upgrades

**Required Environment Variables:**
- `FACTORY` - Address of the DisputeGameFactory
- `PERMISSIONED_GAME` - Address of the new permissioned dispute game implementation
- `PERMISSIONLESS_GAME` - Address of the new permissionless dispute game implementation
- `SAFE` - Address of the Safe multisig wallet
- `SENDER` - Address of the transaction sender

**Optional Environment Variables:**
- `SIG` - Transaction signatures (required for execution)

**Functions:**
- `getTransactionHash()` - Generates transaction hash for signature collection
- `execTransaction()` - Executes the Safe transaction with signatures

**Example Execution:**
```bash
FACTORY="0x..." PERMISSIONED_GAME="0x..." PERMISSIONLESS_GAME="0x..." SAFE="0x..." SENDER="0x..." forge script SafeSetGames.s.sol --sig "getTransactionHash()" --root $PATH_TO_OP_REPO/packages/contracts-bedrock --rpc-url $RPC

# Sign transaction hash
cast wallet sign --no-hash --private-key $PK $HASH

# Execute transaction with signatures
FACTORY="0x..." PERMISSIONED_GAME="0x..." PERMISSIONLESS_GAME="0x..." SAFE="0x..." SENDER="0x..." SIG="0x..." forge script --script SafeSetGames.s.sol --sig "execTransaction()" --root $PATH_TO_OP_REPO/packages/contracts-bedrock --broadcast --private-key $PK --rpc-url $RPC
```

## Notes

- **Critical**: All scripts must be executed from the Optimism contracts-bedrock directory using `--root` flag
- Safe transaction signatures must be ordered by signer address for proper multisig execution
- Implementation addresses are deterministic based on salt and constructor parameters
- The `RedeployGames.s.sol` script preserves existing game configuration while updating specific parameters
- All Safe transactions use combination of delegatecall & multicall for proper proxy upgrades
- Transaction hashes generated by `getTransactionHash()` functions must be signed by Safe owners before execution
