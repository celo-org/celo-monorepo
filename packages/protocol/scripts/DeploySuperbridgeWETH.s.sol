// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.15;

import "forge-std/Script.sol";
import "../contracts-0.8/common/SuperBridgeETHWrapper.sol";

contract DeploySuperBridgeWETH is Script {
  function run() external {
    // Fetch private key from environment variable.
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    require(deployerPrivateKey != 0, "PRIVATE_KEY environment variable not set");

    // Addresses used in the constructor. Ensure these are correctly set via environment variables:

    // WETH address on the local chain (e.g., L1 or mainnet)
    address wethAddressLocal = vm.envAddress("WETH_ADDRESS_LOCAL");
    require(wethAddressLocal != address(0), "WETH_ADDRESS_LOCAL environment variable not set");
    // WETH address on the remote chain (e.g., L2 or another network)
    address wethAddressRemote = vm.envAddress("WETH_ADDRESS_REMOTE");
    require(wethAddressRemote != address(0), "WETH_ADDRESS_REMOTE environment variable not set");
    // L1StandardBridgeProxy address (or equivalent) on the local chain
    address standardBridgeAddress = vm.envAddress("STANDARD_BRIDGE_ADDRESS");
    require(
      standardBridgeAddress != address(0),
      "STANDARD_BRIDGE_ADDRESS environment variable not set"
    );

    // Start broadcasting transactions to the network
    vm.startBroadcast(deployerPrivateKey);

    // Deploy the contract
    SuperBridgeETHWrapper superBridge = new SuperBridgeETHWrapper(
      wethAddressLocal,
      wethAddressRemote,
      standardBridgeAddress
    );

    // Optionally, log the deployed contract's address
    console.log("SuperBridgeETHWrapper deployed at:", address(superBridge));

    vm.stopBroadcast();
  }
}
