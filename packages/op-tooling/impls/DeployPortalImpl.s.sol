// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { IOptimismPortal2 } from "interfaces/L1/IOptimismPortal2.sol";
import { DeployUtils } from "scripts/libraries/DeployUtils.sol";

contract DeployPortalImpl is Script {
  function run() external {
    uint256 proofMaturityDelaySeconds_ = vm.envUint("PROOF_MATURITY_DELAY_SECONDS");
    uint256 disputeGameFinalityDelaySeconds_ = vm.envUint("DISPUTE_GAME_FINALITY_DELAY_SECONDS");

    address impl_ = DeployUtils.createDeterministic({
      _name: "OptimismPortal2",
      _args: DeployUtils.encodeConstructor(
        abi.encodeCall(
          IOptimismPortal2.__constructor__,
          (proofMaturityDelaySeconds_, disputeGameFinalityDelaySeconds_)
        )
      ),
      _salt: DeployUtils.DEFAULT_SALT
    });
    console.log("OptimismPortal2Impl deployed at:", impl_);
  }
}
