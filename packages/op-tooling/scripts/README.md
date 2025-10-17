# Optimism Utility Scripts

This directory contains Foundry scripts and shell utilities for managing Optimism dispute games and anchor state. These scripts interact with the Optimism repository and must be executed from the Optimism contracts-bedrock directory.

## Important Usage Note

**All Foundry scripts in this directory must be executed with root pointing to the Optimism repository contracts folder:**
```bash
forge script --root $PATH_TO_OP_REPO/packages/contracts-bedrock
```

## Scripts

### `CloseRecentGame.s.sol`

Closes the most recent eligible fault dispute game, which updates the anchor state in the registry. The script searches through recent games to find one that is resolved, finalized, and ready to be closed.

**Features:**
- Iterates through recent games in reverse chronological order (newest first)
- Validates game status (not in progress, resolved, finalized)
- Checks if game is already closed before attempting to close
- Limits search to MAX_GAMES_TO_CHECK (50) games for efficiency
- Emits events for all execution paths
- Proper use of broadcast for state-changing operations

**Required Environment Variables:**
- `FACTORY` - Address of the DisputeGameFactory
- `REGISTRY` - Address of the AnchorStateRegistry

**Example Execution:**
```bash
FACTORY="0x..." REGISTRY="0x..." forge script CloseRecentGame.s.sol --root $PATH_TO_OP_REPO/packages/contracts-bedrock --broadcast --private-key $PK --rpc-url $RPC
```

**Events Emitted:**
- `AnchorStateUpdated(address game, uint256 index, GameStatus status, Timestamp created)` - Game successfully closed
- `AnchorStateUpToDate()` - Most recent eligible game already closed
- `NoGamesFound()` - Factory has no games
- `NoEligibleGamesFound()` - No games in the checked range are eligible for closing

**Validation Checks:**
1. Game status is not IN_PROGRESS
2. Game has been resolved (resolvedAt != 0)
3. Game has been finalized by the registry
4. Game hasn't already been closed (bondDistributionMode == UNDECIDED)

### `close-recent-game.sh`

Shell wrapper script that simplifies execution of CloseRecentGame.s.sol by handling environment variable validation and forge command construction.

**Features:**
- Validates required environment variables before execution
- Provides clear error messages for missing configuration
- Uses proper error handling with set -euo pipefail
- Executes forge script with broadcast enabled

**Required Environment Variables:**
- `L1_RPC_URL` - RPC URL for L1 network
- `PK` - Private key for transaction signing
- `FACTORY` - Address of the DisputeGameFactory (passed to forge script)
- `REGISTRY` - Address of the AnchorStateRegistry (passed to forge script)

**Example Execution:**
```bash
export L1_RPC_URL="https://..."
export PK="0x..."
export FACTORY="0x..."
export REGISTRY="0x..."
./close-recent-game.sh
```

## Notes

- **Critical**: All Foundry scripts must be executed from the Optimism contracts-bedrock directory using `--root` flag
- Only one game will be closed per script execution (stops after first eligible game)
- Games must pass all validation checks before being closed
