// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { console2 } from "forge-std/console2.sol";

import { GameType, Timestamp } from "src/dispute/lib/Types.sol";
import { IDisputeGame } from "interfaces/dispute/IDisputeGame.sol";
import { IDisputeGameFactory } from "interfaces/dispute/IDisputeGameFactory.sol";
import { IProxyAdmin } from "interfaces/universal/IProxyAdmin.sol";
import { DisputeGameFactoryPrunner } from "./DisputeGameFactoryPrunner.sol";

contract PruneGamesFromStorage is Script {
  // This script requires running with --root and the following env vars:
  // FACTORY (required) - address of the dispute game factory
  // PROXY_ADMIN (required) - address of the proxy admin
  // RETENTION_INDEX (required) - index up to which games are retained

  function run() external {
    IDisputeGameFactory factory_ = IDisputeGameFactory(vm.envAddress("FACTORY"));
    console.log("Factory present at:", address(factory_));

    IProxyAdmin proxyAdmin_ = IProxyAdmin(vm.envAddress("PROXY_ADMIN"));
    console.log("ProxyAdmin present at:", address(proxyAdmin_));

    uint256 retentionIndex_ = vm.envUint("RETENTION_INDEX");
    console.log("Game index to retain:", retentionIndex_);

    // Store factory impl
    address factoryImpl_ = proxyAdmin_.getProxyImplementation(address(factory_));

    // Start broadcast
    vm.startBroadcast();

    // Upgrade factory to DisputeGameFactoryPrunner
    console.log("Upgrading factory to DisputeGameFactoryPrunner...");
    DisputeGameFactoryPrunner prunner_ = new DisputeGameFactoryPrunner();
    proxyAdmin_.upgrade(payable(address(factory_)), address(prunner_));
    console.log("Factory upgraded to DisputeGameFactoryPrunner at:", address(prunner_));

    // Prune games from storage
    console.log("Pruning games from storage...");
    uint256 targetLength_ = retentionIndex_ + 1;
    DisputeGameFactoryPrunner(payable(address(factory_))).pruneGames(targetLength_);
    console.log("Pruning completed.");

    // Restore factory implementation
    console.log("Restoring factory implementation...");
    proxyAdmin_.upgrade(payable(address(factory_)), factoryImpl_);
    console.log("Factory implementation restored to:", factoryImpl_);

    // Stop broadcast
    vm.stopBroadcast();

    // Log final game count
    uint256 gameCount_ = factory_.gameCount();
    console.log("Current game count in factory:", gameCount_);

    // Log retained game at retention index
    (GameType gameType_, Timestamp timestamp_, IDisputeGame proxy_) = factory_.gameAtIndex(
      retentionIndex_
    );
    console.log("Game retained at index:", retentionIndex_);
    console2.log("  Type:", uint32(gameType_.raw()));
    console2.log("  Created:", uint64(timestamp_.raw()));
    console.log("  Proxy:", address(proxy_));
  }
}
