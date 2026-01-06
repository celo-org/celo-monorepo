// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { IMIPS } from "interfaces/cannon/IMIPS.sol";
import { IPreimageOracle } from "interfaces/cannon/IPreimageOracle.sol";
import { DeployUtils } from "scripts/libraries/DeployUtils.sol";

contract DeployMIPS is Script {
  error MissingEnvVars();

  function run() external {
    address oracle_ = vm.envOr("PREIMAGE_ORACLE", address(0));
    uint256 minProposalSize_ = vm.envOr("MIN_PROPOSAL_SIZE", uint256(0));
    uint256 challengePeriod_ = vm.envOr("CHALLENGE_PERIOD", uint256(0));

    if (oracle_ == address(0) && !(minProposalSize_ > 0 && challengePeriod_ > 0)) {
      revert MissingEnvVars();
    }

    if (oracle_ == address(0)) {
      oracle_ = DeployUtils.createDeterministic({
        _name: "PreimageOracle",
        _args: DeployUtils.encodeConstructor(
          abi.encodeCall(IPreimageOracle.__constructor__, (minProposalSize_, challengePeriod_))
        ),
        _salt: DeployUtils.DEFAULT_SALT
      });
      console.log("Using new PreimageOracle:", oracle_);
    } else {
      console.log("Using provided PreimageOracle:", oracle_);
    }

    address mips_ = DeployUtils.createDeterministic({
      _name: "MIPS",
      _args: DeployUtils.encodeConstructor(
        abi.encodeCall(IMIPS.__constructor__, (IPreimageOracle(oracle_)))
      ),
      _salt: DeployUtils.DEFAULT_SALT
    });
    console.log("MIPS deployed at:", mips_);
  }
}
