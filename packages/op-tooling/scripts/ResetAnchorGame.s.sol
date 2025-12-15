// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { IAnchorStateRegistry } from "interfaces/dispute/IAnchorStateRegistry.sol";
import { IProxyAdmin } from "interfaces/universal/IProxyAdmin.sol";
import { StorageSetter } from "src/universal/StorageSetter.sol";

contract ResetAnchorGame is Script {
  // This script requires running with --root and the following env vars:
  // REGISTRY (required) - address of the anchor state registry
  // PROXY_ADMIN (required) - address of the proxy admin
  // ANCHOR_GAME (required) - address of the new anchor game

  event AnchorGameReset(address indexed previousGame, address indexed newGame);

  function run() external {
    IAnchorStateRegistry registry_ = IAnchorStateRegistry(vm.envAddress("REGISTRY"));
    console.log("Registry present at:", address(registry_));

    IProxyAdmin proxyAdmin_ = IProxyAdmin(vm.envAddress("PROXY_ADMIN"));
    console.log("ProxyAdmin present at:", address(proxyAdmin_));

    address newAnchorGame_ = vm.envAddress("ANCHOR_GAME");
    console.log("New anchor game:", newAnchorGame_);

    // Store registry impl
    address registryImpl_ = proxyAdmin_.getProxyImplementation(address(registry_));

    // Get current anchor game before upgrade (from slot 3)
    bytes32 slot3Value_ = vm.load(address(registry_), bytes32(uint256(3)));
    address currentAnchorGame_ = address(uint160(uint256(slot3Value_)));
    console.log("Current anchor game:", currentAnchorGame_);

    // Start broadcast
    vm.startBroadcast();

    // Upgrade registry to StorageSetter
    console.log("Upgrading registry to StorageSetter...");
    StorageSetter setter_ = new StorageSetter();
    proxyAdmin_.upgrade(payable(address(registry_)), address(setter_));
    console.log("Registry upgraded to StorageSetter at:", address(setter_));

    // Set anchor game in slot 3
    console.log("Setting anchor game in slot 3...");
    StorageSetter(payable(address(registry_))).setAddress(bytes32(uint256(3)), newAnchorGame_);
    console.log("Anchor game set: ", newAnchorGame_);

    // Restore registry implementation
    console.log("Restoring registry implementation...");
    proxyAdmin_.upgrade(payable(address(registry_)), registryImpl_);
    console.log("Registry implementation restored to:", registryImpl_);

    // Verify anchor game was set
    address anchorGame_ = address(registry_.anchorGame());
    console.log("Verified anchor game:", anchorGame_);
    require(anchorGame_ == newAnchorGame_, "Anchor game verification failed");
    console.log("Anchor game successfully reset!");

    // Emit event
    emit AnchorGameReset(currentAnchorGame_, newAnchorGame_);

    // Stop broadcast
    vm.stopBroadcast();
  }
}
