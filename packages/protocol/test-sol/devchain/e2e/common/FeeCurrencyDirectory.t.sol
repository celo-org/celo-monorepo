// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import { Devchain } from "@test-sol/devchain/e2e/utils.sol";

import "@celo-contracts-8/common/FeeCurrencyDirectory.sol";

contract E2EDemo is Devchain {
  function test_ShouldAllowOwnerSetCurrencyConfig() public {
    address token = address(1);
    uint256 intrinsicGas = 21000;

    vm.prank(feeCurrencyDirectory.owner());
    feeCurrencyDirectory.setCurrencyConfig(token, address(sortedOracles), intrinsicGas);
    FeeCurrencyDirectory.CurrencyConfig memory config = feeCurrencyDirectory.getCurrencyConfig(
      token
    );

    assertEq(config.oracle, address(sortedOracles));
    assertEq(config.intrinsicGas, intrinsicGas);
  }
}
