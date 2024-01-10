// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "../../contracts/common/FeeHandler.sol";
import "forge-std/console.sol";
import "../Constants.sol";

import { Exchange } from "../../lib/mento-core/contracts/Exchange.sol";
import { StableToken } from "../../lib/mento-core/contracts/StableToken.sol";
import "../../contracts/common/FixidityLib.sol";
import "../../contracts/common/Freezer.sol";
import "../../contracts/common/GoldToken.sol";
import "../../contracts/common/FeeCurrencyWhitelist.sol";
import "../../contracts/common/MentoFeeHandlerSeller.sol";
import "../../contracts/common/UniswapFeeHandlerSeller.sol";
import "../../contracts/uniswap/test/MockUniswapV2Router02.sol";
import "../../contracts/uniswap/test/MockUniswapV2Factory.sol";
import "../../contracts/identity/test/MockERC20Token.sol";
import "../../lib/mento-core/test/mocks/MockSortedOracles.sol";
import "../../lib/mento-core/test/mocks/MockReserve.sol";

import "contracts/common/FixidityLib.sol";

contract FeeHandlerFoundry is Test, Constants {
  using FixidityLib for FixidityLib.Fraction;

  FeeHandler feeHandler;
  IRegistry registry;
  GoldToken celoToken;
  MockSortedOracles mockSortedOracles;
  MockReserve mockReserve;

  Freezer freezer;
  MockERC20Token tokenA;

  MockUniswapV2Router02 uniswapRouter;
  MockUniswapV2Factory uniswapV2Factory;

  FeeCurrencyWhitelist feeCurrencyWhitelist;

  MentoFeeHandlerSeller mentoSeller;
  UniswapFeeHandlerSeller uniswapFeeHandlerSeller;

  Exchange exchange;
  Exchange exchange2;
  StableToken stableToken;
  StableToken stableTokenEUR;

  address EXAMPLE_BENEFICIARY_ADDRESS = 0x2A486910DBC72cACcbb8d0e1439C96b03B2A4699;

  address registryAddress = 0x000000000000000000000000000000000000ce10;
  address owner = address(this);
  address user = actor("user");

  uint256 goldAmountForRate = 1000000000000000000000000;
  uint256 stableAmountForRate = 2 * goldAmountForRate;
  uint256 spread;
  uint256 reserveFraction;
  uint256 maxSlippage;
  uint256 initialReserveBalance = 10000000000000000000000;

  uint8 decimals = 18;
  uint256 updateFrequency = 60 * 60;
  uint256 minimumReports = 2;

  function setUp() public {
    vm.warp(YEAR);

    spread = FixidityLib.newFixedFraction(3, 1000).unwrap();
    reserveFraction = FixidityLib.newFixedFraction(5, 100).unwrap();
    maxSlippage = FixidityLib.newFixedFraction(1, 100).unwrap();

    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);

    celoToken = new GoldToken(true);
    mockReserve = new MockReserve();
    stableToken = new StableToken(true);
    stableTokenEUR = new StableToken(true);
    registry = IRegistry(registryAddress);
    feeHandler = new FeeHandler(true);
    freezer = new Freezer(true);
    feeCurrencyWhitelist = new FeeCurrencyWhitelist(true);
    mentoSeller = new MentoFeeHandlerSeller(true);
    uniswapFeeHandlerSeller = new UniswapFeeHandlerSeller(true);

    tokenA = new MockERC20Token();

    feeCurrencyWhitelist.initialize();
    registry.setAddressFor("FeeCurrencyWhitelist", address(feeCurrencyWhitelist));
    registry.setAddressFor("Freezer", address(freezer));
    registry.setAddressFor("GoldToken", address(celoToken));
    registry.setAddressFor("Reserve", address(mockReserve));

    mockReserve.setGoldToken(address(celoToken));
    mockReserve.addToken(address(stableToken));
    mockReserve.addToken(address(stableTokenEUR));

    address[] memory tokenAddresses;
    uint256[] memory newMininumReports;

    mentoSeller.initialize(address(registry), tokenAddresses, newMininumReports);
    celoToken.initialize(address(registry));
    stableToken.initialize(
      "Celo Dollar",
      "cUSD",
      decimals,
      address(registry),
      FIXED1,
      WEEK,
      new address[](0),
      new uint256[](0),
      "Exchange"
    );

    stableTokenEUR.initialize(
      "Celo Euro",
      "cEUR",
      decimals,
      address(registry),
      FIXED1,
      WEEK,
      new address[](0),
      new uint256[](0),
      "Exchange"
    );

    mockSortedOracles = new MockSortedOracles();
    registry.setAddressFor("SortedOracles", address(mockSortedOracles));

    mockSortedOracles.setMedianRate(address(stableToken), stableAmountForRate);
    mockSortedOracles.setMedianTimestampToNow(address(stableToken));
    mockSortedOracles.setNumRates(address(stableToken), 2);

    mockSortedOracles.setMedianRate(address(stableTokenEUR), stableAmountForRate);
    mockSortedOracles.setMedianTimestampToNow(address(stableTokenEUR));
    mockSortedOracles.setNumRates(address(stableTokenEUR), 2);

    fundReserve();

    exchange = new Exchange(true);
    exchange.initialize(
      address(registry),
      "StableToken",
      spread,
      reserveFraction,
      updateFrequency,
      minimumReports
    );

    exchange2 = new Exchange(true);
    exchange2.initialize(
      address(registry),
      "StableTokenEUR",
      spread,
      reserveFraction,
      updateFrequency,
      minimumReports
    );

    registry.setAddressFor("StableToken", address(stableToken));
    registry.setAddressFor("Exchange", address(exchange));
    registry.setAddressFor("StableTokenEUR", address(stableTokenEUR));
    registry.setAddressFor("ExchangeEUR", address(exchange2));

    exchange.activateStable();
    exchange2.activateStable();

    feeHandler.initialize(
      registryAddress,
      EXAMPLE_BENEFICIARY_ADDRESS,
      0,
      new address[](0),
      new address[](0),
      new uint256[](0),
      new uint256[](0)
    );
  }

  function fundReserve() public {
    vm.prank(owner);
    celoToken.transfer(address(mockReserve), initialReserveBalance);
  }
}

contract FeeHandlerSetBurnFraction is FeeHandlerFoundry {
  function testOnlyOwnerCanSetBurnFraction() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.setBurnFraction(100);
  }

  function testSetBurnFraction() public {
    feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
    assertEq(
      feeHandler.burnFraction(),
      FixidityLib.newFixedFraction(80, 100).unwrap(),
      "Burn fraction should be set"
    );
  }

  function testRevertsOnFractionsGreaterThanOne() public {
    vm.prank(owner);
    vm.expectRevert("Burn fraction must be less than or equal to 1");
    feeHandler.setBurnFraction(FixidityLib.newFixedFraction(3, 2).unwrap());
  }
}

contract FeeHandlerSetHandler is FeeHandlerFoundry {
  function testOnlyOwnerCanSetHandler() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.setHandler(address(stableToken), address(mentoSeller));
  }

  function testSetsHandler() public {
    vm.prank(owner);
    feeHandler.setHandler(address(stableToken), address(mentoSeller));
    assertEq(
      feeHandler.getTokenHandler(address(stableToken)),
      address(mentoSeller),
      "Handler should be set"
    );
  }
}

contract FeeHandlerAddToken is FeeHandlerFoundry {
  function testOnlyOwnerCanAddToken() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.addToken(address(stableToken), address(mentoSeller));
  }

  function testAddsToken() public {
    vm.prank(owner);
    feeHandler.addToken(address(stableToken), address(mentoSeller));
    assertEq(
      feeHandler.getActiveTokens(),
      address(stableToken)
    );
    assertTrue(feeHandler.getTokenActive(address(stableToken)));
    assertEq(
      feeHandler.getTokenHandler(address(stableToken)),
      address(mentoSeller)
    );
  }
}

contract FeeHandlerRemoveToken is FeeHandlerFoundry {
  function testOnlyOwnerCanRemoveToken() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.removeToken(address(stableToken));
  }

  function testRemovesToken() public {
    vm.prank(owner);
    feeHandler.addToken(address(stableToken), address(mentoSeller));
    feeHandler.removeToken(address(stableToken));
    assertFalse(feeHandler.getTokenActive(address(stableToken)));
    assertEq(
      feeHandler.getActiveTokens(),
      new address[](0)
    );
    assertEq(
      feeHandler.getTokenHandler(address(stableToken), address(0))
    );
  }
}

contract FeeHandlerDeactivateAndActivateToken is FeeHandlerFoundry {
  function testOnlyOwnerCanDeactivateToken() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.deactivateToken(address(stableToken));
  }

  function testOnlyOwnerCanActivateToken() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.activateToken(address(stableToken));
  }

  function testDeactivateAndActivateToken() public {
    vm.prank(owner);
    feeHandler.addToken(address(stableToken), address(mentoSeller));
    feeHandler.deactivateToken(address(stableToken));
    assertFalse(feeHandler.getTokenActive(address(stableToken)));
    assertEq(feeHandler.getActiveTokens(), new address[](0));

    feeHandler.activateToken(address(stableToken));
    assertTrue(feeHandler.getTokenActive(address(stableToken)));
    assertEq(feeHandler.getActiveTokens(), address(stableToken));
  }
}



