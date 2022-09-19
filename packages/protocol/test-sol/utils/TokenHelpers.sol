// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "contracts/common/GoldToken.sol";
import "contracts/stability/StableToken.sol";

contract TokenHelpers is Test {
  function mint(GoldToken celoToken, address to, uint256 amount) internal {
    address pranker = currentPrank;
    changePrank(address(0));
    celoToken.mint(to, amount);
    changePrank(pranker);
  }

  function mint(StableToken stableToken, address to, uint256 amount) internal {
    address pranker = currentPrank;
    changePrank(stableToken.registry().getAddressForString("GrandaMento"));
    stableToken.mint(to, amount);
    changePrank(pranker);
  }
}
