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
- Configurable search limit via MAX environment variable
- Emits events for all execution paths
- Proper use of broadcast for state-changing operations

**Required Environment Variables:**
- `FACTORY` - Address of the DisputeGameFactory
- `REGISTRY` - Address of the AnchorStateRegistry

**Optional Environment Variables:**
- `MAX` - Maximum number of recent games to check (default: 50)

**Example Execution:**
```bash
FACTORY="0x..." REGISTRY="0x..." forge script CloseRecentGame.s.sol --root $PATH_TO_OP_REPO/packages/contracts-bedrock --broadcast --private-key $PK --rpc-url $RPC

# With custom max games to check
FACTORY="0x..." REGISTRY="0x..." MAX=100 forge script CloseRecentGame.s.sol --root $PATH_TO_OP_REPO/packages/contracts-bedrock --broadcast --private-key $PK --rpc-url $RPC
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
- Automatically constructs --root path from OP_DIR
- Provides clear error messages for missing configuration
- Uses proper error handling with set -euo pipefail
- Executes forge script with broadcast enabled

**Required Environment Variables:**
- `L1_RPC_URL` - RPC URL for L1 network
- `OP_DIR` - Path to Optimism repository contracts directory
- `PK` - Private key for transaction signing
- `FACTORY` - Address of the DisputeGameFactory (passed to forge script)
- `REGISTRY` - Address of the AnchorStateRegistry (passed to forge script)

**Example Execution:**
```bash
export L1_RPC_URL="https://..."
export OP_DIR="/path/to/optimism"
export PK="0x..."
export FACTORY="0x..."
export REGISTRY="0x..."
./close-recent-game.sh
```

### `PruneGamesFromStorage.s.sol`

Maintenance script that removes games from the DisputeGameFactory storage to reduce storage costs and optimize factory performance. This is a critical operation that temporarily upgrades the factory to a pruning contract, removes games from the end of the array (higher indices), then restores the original implementation.

**Features:**
- Temporarily upgrades DisputeGameFactory to DisputeGameFactoryPrunner
- Prunes games from the end of the storage array (higher indices)
- Automatically restores original factory implementation
- Verifies oldest retained game after pruning
- Emits events for each pruned game via GamePruned event

**Required Environment Variables:**
- `FACTORY` - Address of the DisputeGameFactory proxy
- `PROXY_ADMIN` - Address of the ProxyAdmin contract
- `RETENTION_INDEX` - Index up to which games are retained (all games with index ≤ RETENTION_INDEX are kept, games with higher indices are removed)

**Example Execution:**
```bash
# Keep games 0-100, remove games 101+
FACTORY="0x..." PROXY_ADMIN="0x..." RETENTION_INDEX=100 forge script PruneGamesFromStorage.s.sol --root $PATH_TO_OP_REPO/packages/contracts-bedrock --broadcast --private-key $PK --rpc-url $RPC
```

**Process Flow:**
1. Store original factory implementation address
2. Deploy and upgrade to DisputeGameFactoryPrunner
3. Call pruneGames() to remove games from storage (from end of array)
4. Restore original factory implementation
5. Verify final game count and oldest retained game

**Safety Considerations:**
- This operation modifies critical factory storage - use with caution
- Requires ProxyAdmin privileges to upgrade factory
- Games are permanently removed from factory storage (though on-chain game contracts remain)
- Ensure RETENTION_INDEX is correct before execution
- Consider creating games backup before pruning

### `DisputeGameFactoryPrunner.sol`

Helper contract used by `PruneGamesFromStorage.s.sol` to remove games from DisputeGameFactory storage. This contract replicates the factory's storage layout to safely manipulate the internal game arrays and mappings.

**Features:**
- Matches DisputeGameFactory storage layout exactly (slots 103-104)
- Provides pruneGames() function to remove games from end of array
- Emits GamePruned event for each removed game
- Computes game UUIDs to properly clean up mapping storage

**Storage Layout:**
- `uint256[103] __gap` - Reserved slots 0-102 (matches factory layout)
- `mapping(Hash => GameId) _disputeGames` - Slot 103 (game UUID to ID mapping)
- `GameId[] _disputeGameList` - Slot 104 (array of all game IDs)

**Key Function:**
```solidity
function pruneGames(uint256 _desiredLength) external
```
Removes games from storage until `_disputeGameList.length == _desiredLength`.

**Event:**
```solidity
event GamePruned(
  uint256 indexed index,
  GameId indexed gameId,
  Hash indexed gameUUID,
  GameType gameType,
  address gameProxy
)
```

**Note:** This contract is only temporarily set as the factory implementation during the pruning operation and is immediately replaced with the original implementation afterwards.

## Notes

- **Critical**: All Foundry scripts must be executed from the Optimism contracts-bedrock directory using `--root` flag
- The `CloseRecentGame.s.sol` script stops after finding and closing the first eligible game
- Games must pass all validation checks before being closed
- The `PruneGamesFromStorage.s.sol` script is a destructive operation - games are permanently removed from factory storage
- Pruning games does not affect the deployed game contracts themselves, only the factory's internal tracking
- Always verify the RETENTION_INDEX value before pruning to avoid removing games that should be retained
- Consider the gas cost implications of pruning large numbers of games in a single transaction