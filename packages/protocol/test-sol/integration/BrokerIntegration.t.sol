// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test } from "celo-foundry/Test.sol";
import { console } from "forge-std/console.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import { McMintIntegration } from "../utils/McMintIntegration.sol";
import { TokenHelpers } from "../utils/TokenHelpers.sol";

import { Broker } from "contracts/stability/Broker.sol";
import { IReserve } from "contracts/stability/interfaces/IReserve.sol";
import { IStableToken } from "contracts/stability/interfaces/IStableToken.sol";

import { FixidityLib } from "contracts/common/FixidityLib.sol";
import { TradingLimits } from "contracts/stability/libraries/TradingLimits.sol";

// forge test --match-contract BrokerIntegration -vvv
contract BrokerIntegrationTest is Test, McMintIntegration, TokenHelpers {
  address trader;

  function setUp() public {
    setUp_mcMint();

    trader = actor("trader");

    mint(cUSDToken, trader, 10**22);
    mint(cEURToken, trader, 10**22);

    deal(address(celoToken), address(reserve), 10**24);
    deal(address(usdcToken), address(reserve), 10**24);
  }

  function test_swap_cEURToUSDCet() public {
    changePrank(trader);
    cEURToken.approve(address(broker), 10**21);
    uint256 amountOut = broker.swapIn(
      address(biPoolManager),
      pair_cEUR_USDCet_ID,
      address(cEURToken),
      address(usdcToken),
      10**21,
      0
    );

    assertEq(cEURToken.balanceOf(trader), 1e22 - 1e21);
    assertEq(usdcToken.balanceOf(trader), amountOut);
  }

  function test_swap_cUSDTocEUR() public {
    TradingLimits.Counts memory limits;
    limits.interval0.enabled = true;
    limits.interval0.limit = 1000;
    limits.interval0.duration = 12000;

    broker.setTradingLimits(address(cEURToken), limits);

    changePrank(trader);
    cUSDToken.approve(address(broker), 10**21);
    uint256 cEURBalanceBefore = cEURToken.balanceOf(trader);

    uint256 amountOut = broker.swapIn(
      address(biPoolManager),
      pair_cUSD_cEUR_ID,
      address(cUSDToken),
      address(cEURToken),
      10**21,
      0
    );

    assertEq(cUSDToken.balanceOf(trader), 1e22 - 1e21);
    assertEq(cEURToken.balanceOf(trader), cEURBalanceBefore + amountOut);

    cUSDToken.approve(address(broker), 10**21);
    cEURBalanceBefore = cEURToken.balanceOf(trader);

    amountOut = broker.swapIn(
      address(biPoolManager),
      pair_cUSD_cEUR_ID,
      address(cUSDToken),
      address(cEURToken),
      10**21,
      0
    );

    assertEq(cEURToken.balanceOf(trader), cEURBalanceBefore + amountOut);
  }
}
