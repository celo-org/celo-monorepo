// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "forge-std/Script.sol";
import "mobius/contracts/openzeppelin-contracts@3.4.0/contracts/token/ERC20/IERC20.sol";
import "mobius/contracts/Swap.sol";

contract DeploySwap is Script {
  address constant governance = 0xD533Ca259b330c7A88f74E000a3FaEa2d63B7972;
  address constant USDC = 0x37f750B7cC259A2f741AF45294f6a16572CF5cAd;
  address constant CUSD = 0x765DE816845861e75A25fCA122bb6898B8B1282a;

  function run() external {
    IERC20[] memory pooledTokens = new IERC20[](2);
    pooledTokens[0] = IERC20(CUSD);
    pooledTokens[1] = IERC20(USDC);
    uint8[] memory decimals = new uint8[](2);
    decimals[0] = 18;
    decimals[1] = 6;
    vm.startBroadcast();

    Swap swap = new Swap(
      pooledTokens,
      decimals,
      "TEST-cUSD-USDC",
      "cUSD-USD",
      0,
      0,
      0,
      0,
      0,
      governance
    );

    // swap._transferOwnership(governance);
    vm.stopBroadcast();
  }
}
