// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { IAnchorStateRegistry } from "interfaces/dispute/IAnchorStateRegistry.sol";
import { DeployUtils } from "scripts/libraries/DeployUtils.sol";

contract DeployRegistryImpl is Script {
  // This script requires running with --root and the following env vars:
  // DISPUTE_GAME_FINALITY_DELAY_SECONDS (required) - dispute game finality delay for the AnchorStateRegistry

  function run() external {
    uint256 disputeGameFinalityDelaySeconds_ = vm.envUint("DISPUTE_GAME_FINALITY_DELAY_SECONDS");

    address impl_ = DeployUtils.createDeterministic({
      _name: "AnchorStateRegistry",
      _args: DeployUtils.encodeConstructor(
        abi.encodeCall(IAnchorStateRegistry.__constructor__, (disputeGameFinalityDelaySeconds_))
      ),
      _salt: DeployUtils.DEFAULT_SALT
    });
    console.log("AnchorStateRegistryImpl deployed at:", impl_);
  }
}
