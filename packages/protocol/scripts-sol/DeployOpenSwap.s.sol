// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import { OpenSumSwap } from "../lib/OpenSum/contracts/OpenSumSwap.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeployOpenSwap is Script {
  address constant governance = 0xD533Ca259b330c7A88f74E000a3FaEa2d63B7972;
  address constant USDC = 0x37f750B7cC259A2f741AF45294f6a16572CF5cAd;
  address constant CUSD = 0x765DE816845861e75A25fCA122bb6898B8B1282a;

  function run() external {
    IERC20[] memory pooledTokens = new IERC20[](2);
    pooledTokens[0] = IERC20(CUSD);
    pooledTokens[1] = IERC20(USDC);
    uint256[] memory decimals = new uint256[](2);
    decimals[0] = 18;
    decimals[1] = 6;
    vm.startBroadcast();

    OpenSumSwap swap = new OpenSumSwap(pooledTokens, decimals, "TEST-cUSD-USDC", "cUSD-USD");
    swap._transferOwnership(governance);

    vm.stopBroadcast();
  }
}
