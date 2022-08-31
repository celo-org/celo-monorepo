// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test } from "celo-foundry/Test.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import { McMintIntegration } from "../utils/McMintIntegration.sol";
import { TokenHelpers } from "../utils/TokenHelpers.sol";

import { Broker } from "contracts/stability/Broker.sol";
import { IMentoExchange } from "contracts/stability/interfaces/IMentoExchange.sol";
import { IPairManager } from "contracts/stability/interfaces/IPairManager.sol";
import { IReserve } from "contracts/stability/interfaces/IReserve.sol";
import { IStableToken } from "contracts/stability/interfaces/IStableToken.sol";

import { FixidityLib } from "contracts/common/FixidityLib.sol";

// forge test --match-contract BrokerIntegration -vvv
contract BrokerIntegrationTest is McMintIntegration, TokenHelpers {
  address trader;

  function setUp() public {
    trader = actor("trader");

    mint(cUSDToken, trader, 10**22);
    mint(cEURToken, trader, 10**22);

    deal(address(celoToken), address(reserve), 10**24);
    deal(address(usdcToken), address(reserve), 10**24);
    deal(address(celoToken), address(reserve), 10**22);
    deal(address(usdcToken), address(reserve), 10**22);
  }

  function test_swap_cEURToUSDCet() public {
    changePrank(trader);
    (address tokenOut, uint256 amountOut) = broker.swap(0x0, address(cEURToken), 10**21, 0);

    assertEq(tokenOut, address(usdcToken));
    assertEq(amountOut, 0);
  }
}
