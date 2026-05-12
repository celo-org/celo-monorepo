// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.15;

import "forge-std/Script.sol";
import "../contracts-0.8/common/GasSponsoredOFTBridge.sol";

contract DeployGasSponsoredOFTBridge is Script {
  function run() external {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    require(deployerPrivateKey != 0, "PRIVATE_KEY environment variable not set");

    address sortedOraclesAddress = vm.envAddress("SORTED_ORACLES_ADDRESS");
    require(
      sortedOraclesAddress != address(0),
      "SORTED_ORACLES_ADDRESS environment variable not set"
    );

    uint256 maxGas = vm.envUint("MAX_GAS");
    require(maxGas > 0, "MAX_GAS environment variable not set");

    vm.startBroadcast(deployerPrivateKey);

    GasSponsoredOFTBridge bridge = new GasSponsoredOFTBridge(
      ISortedOracles(sortedOraclesAddress),
      maxGas
    );

    console.log("GasSponsoredOFTBridge deployed at:", address(bridge));
    console.log("Register OFTs with: bridge.setOFTConfig(oft, token, rateFeedId)");

    vm.stopBroadcast();
  }
}
