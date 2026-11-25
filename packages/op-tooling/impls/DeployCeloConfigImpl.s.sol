// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { ICeloSuperchainConfig } from "interfaces/L1/ICeloSuperchainConfig.sol";
import { DeployUtils } from "scripts/libraries/DeployUtils.sol";

contract DeployCeloConfigImpl is Script {
  // This script requires running with --root
  function run() external {
    address impl_ = DeployUtils.createDeterministic({
      _name: "CeloSuperchainConfig",
      _args: DeployUtils.encodeConstructor(
        abi.encodeCall(ICeloSuperchainConfig.__constructor__, ())
      ),
      _salt: DeployUtils.DEFAULT_SALT
    });
    console.log("CeloSuperchainConfigImpl deployed at:", impl_);
  }
}
