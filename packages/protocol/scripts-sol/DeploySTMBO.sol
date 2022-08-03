// SPDX-License-Identifier: MIT
pragma solidity ^0.5.13;

import "forge-std/Script.sol";
import "contracts/stability/StableTokenMintableByOwner.sol";

contract DeploySTMBO is Script {
  address constant governance = 0xD533Ca259b330c7A88f74E000a3FaEa2d63B7972;
  address constant USDC = 0x37f750B7cC259A2f741AF45294f6a16572CF5cAd;
  address constant CUSD = 0x765DE816845861e75A25fCA122bb6898B8B1282a;

  function run() external {
    vm.startBroadcast();
    StableTokenMintableByOwner stableToken = new StableTokenMintableByOwner(true);
    vm.stopBroadcast();
  }
}
