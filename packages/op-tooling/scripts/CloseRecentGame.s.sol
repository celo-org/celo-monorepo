// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { console2 } from "forge-std/console2.sol";

import { GameType, GameStatus, Timestamp, BondDistributionMode } from "src/dispute/lib/Types.sol";

import { IDisputeGameFactory } from "interfaces/dispute/IDisputeGameFactory.sol";
import { IDisputeGame } from "interfaces/dispute/IDisputeGame.sol";
import { IFaultDisputeGame } from "interfaces/dispute/IFaultDisputeGame.sol";
import { IAnchorStateRegistry } from "interfaces/dispute/IAnchorStateRegistry.sol";

contract CloseRecentGame is Script {
  // This script requires running with --root and the following env vars:
  // FACTORY (required) - address of the dispute game factory
  // REGISTRY (required) - address of the anchor state registry

  event AnchorStateUpdated(
    address indexed game,
    uint256 indexed index,
    GameStatus status,
    Timestamp created
  );
  event AnchorStateUpToDate();
  event NoGamesFound();
  event NoEligibleGamesFound();

  bool private foundEligibleGame;

  function run() external {
    IDisputeGameFactory factory_ = IDisputeGameFactory(vm.envAddress("FACTORY"));
    console.log("Factory present at:", address(factory_));

    IAnchorStateRegistry registry_ = IAnchorStateRegistry(vm.envAddress("REGISTRY"));
    console.log("Registry present at:", address(registry_));

    uint256 MAX_GAMES_TO_CHECK = vm.envOr("MAX", uint256(50));

    uint256 gamesCount_ = factory_.gameCount();
    console2.log("Total games:", gamesCount_);

    if (gamesCount_ == 0) {
      console.log("No games found in factory");
      emit NoGamesFound();
      return;
    }

    for (uint256 i = 0; i < MAX_GAMES_TO_CHECK && i < gamesCount_; i++) {
      uint256 gameIndex_ = gamesCount_ - 1 - i;
      (GameType gameType_, Timestamp created_, IDisputeGame game_) = factory_.gameAtIndex(
        gameIndex_
      );
      console.log("Checking game at:", address(game_));
      console2.log("  Type:", uint32(gameType_.raw()));
      console2.log("  Created:", uint64(created_.raw()));

      // check game status
      GameStatus status_ = game_.status();
      console2.log("  Status:", uint8(status_));
      if (status_ == GameStatus.IN_PROGRESS) {
        console.log("    >>> Game still in progress. Skipping...");
        continue;
      }

      // check if game is resolved
      if (game_.resolvedAt().raw() == 0) {
        console.log("    >>> Game not resolved yet. Skipping...");
        continue;
      }

      // check if game is finalized
      if (!registry_.isGameFinalized(game_)) {
        console.log("    >>> Game not finalized yet. Skipping...");
        continue;
      }

      // check if game already closed
      IFaultDisputeGame fdg_ = IFaultDisputeGame(address(game_));
      if (fdg_.bondDistributionMode() != BondDistributionMode.UNDECIDED) {
        console.log("    >>> Game already closed. Anchor state up to date...");

        foundEligibleGame = true;
        emit AnchorStateUpToDate();
        break;
      }

      // update anchor state by closing the game
      vm.startBroadcast();
      console.log("    >>> Closing game at:", address(game_));
      fdg_.closeGame();
      vm.stopBroadcast();

      foundEligibleGame = true;
      emit AnchorStateUpdated(address(game_), gameIndex_, game_.status(), created_);
      break;
    }

    if (!foundEligibleGame) {
      console.log("No eligible games found to close");
      emit NoEligibleGamesFound();
    }
  }
}
