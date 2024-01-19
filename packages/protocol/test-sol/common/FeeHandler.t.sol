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
import "../../contracts/uniswap/test/MockERC20.sol";
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
  MockERC20 tokenA;

  MockUniswapV2Router02 uniswapRouter;
  MockUniswapV2Router02 uniswapRouter2;
  MockUniswapV2Factory uniswapFactory;
  MockUniswapV2Factory uniswapFactory2;

  FeeCurrencyWhitelist feeCurrencyWhitelist;

  MentoFeeHandlerSeller mentoSeller;
  UniswapFeeHandlerSeller uniswapFeeHandlerSeller;

  Exchange exchangeUSD;
  Exchange exchangeEUR;
  StableToken stableToken;
  StableToken stableTokenEUR;

  address EXAMPLE_BENEFICIARY_ADDRESS = 0x2A486910DBC72cACcbb8d0e1439C96b03B2A4699;

  address registryAddress = 0x000000000000000000000000000000000000ce10;
  address owner = address(this);
  address user = actor("user");

  uint256 celoAmountForRate = 1e24;
  uint256 stableAmountForRate = 2 * celoAmountForRate;
  uint256 spread;
  uint256 reserveFraction;
  uint256 maxSlippage;
  uint256 initialReserveBalance = 1e22;

  uint8 decimals = 18;
  uint256 updateFrequency = 60 * 60;
  uint256 minimumReports = 2;

  function setUp() public {
    vm.warp(YEAR); // TODO(Alec) why do we do this?

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

    tokenA = new MockERC20();

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

    exchangeUSD = new Exchange(true);
    exchangeUSD.initialize(
      address(registry),
      "StableToken",
      spread,
      reserveFraction,
      updateFrequency,
      minimumReports
    );

    exchangeEUR = new Exchange(true);
    exchangeEUR.initialize(
      address(registry),
      "StableTokenEUR",
      spread,
      reserveFraction,
      updateFrequency,
      minimumReports
    );

    registry.setAddressFor("StableToken", address(stableToken));
    registry.setAddressFor("Exchange", address(exchangeUSD));
    registry.setAddressFor("StableTokenEUR", address(stableTokenEUR));
    registry.setAddressFor("ExchangeEUR", address(exchangeEUR));

    exchangeUSD.activateStable();
    exchangeEUR.activateStable();

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
    celoToken.transfer(address(mockReserve), initialReserveBalance);
  }
}

contract FeeHandlerSetBurnFraction is FeeHandlerFoundry {
  function test_OnlyOwnerCanSetBurnFraction() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.setBurnFraction(100);
  }

  function test_SetBurnFraction() public {
    feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
    assertEq(
      feeHandler.burnFraction(),
      FixidityLib.newFixedFraction(80, 100).unwrap(),
      "Burn fraction should be set"
    );
  }

  function test_RevertsOnFractionsGreaterThanOne() public {
    vm.expectRevert("Burn fraction must be less than or equal to 1");
    feeHandler.setBurnFraction(FixidityLib.newFixedFraction(3, 2).unwrap());
  }
}

contract FeeHandlerSetHandler is FeeHandlerFoundry {
  function test_OnlyOwnerCanSetHandler() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.setHandler(address(stableToken), address(mentoSeller));
  }

  function test_SetsHandler() public {
    feeHandler.setHandler(address(stableToken), address(mentoSeller));
    assertEq(
      feeHandler.getTokenHandler(address(stableToken)),
      address(mentoSeller),
      "Handler should be set"
    );
  }
}

contract FeeHandlerAddToken is FeeHandlerFoundry {
  function test_OnlyOwnerCanAddToken() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.addToken(address(stableToken), address(mentoSeller));
  }

  function test_AddsToken() public {
    feeHandler.addToken(address(stableToken), address(mentoSeller));
    address[] memory expectedActiveTokens = new address[](1);
    expectedActiveTokens[0] = address(stableToken);
    assertEq(feeHandler.getActiveTokens(), expectedActiveTokens);
    assertTrue(feeHandler.getTokenActive(address(stableToken)));
    assertEq(feeHandler.getTokenHandler(address(stableToken)), address(mentoSeller));
  }
}

contract FeeHandlerRemoveToken is FeeHandlerFoundry {
  function test_OnlyOwnerCanRemoveToken() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.removeToken(address(stableToken));
  }

  function test_RemovesToken() public {
    feeHandler.addToken(address(stableToken), address(mentoSeller));
    feeHandler.removeToken(address(stableToken));
    assertFalse(feeHandler.getTokenActive(address(stableToken)));
    assertEq(feeHandler.getActiveTokens().length, 0);
    assertEq(feeHandler.getTokenHandler(address(stableToken)), address(0));
  }
}

contract FeeHandlerDeactivateAndActivateToken is FeeHandlerFoundry {
  function test_OnlyOwnerCanDeactivateToken() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.deactivateToken(address(stableToken));
  }

  function test_OnlyOwnerCanActivateToken() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.activateToken(address(stableToken));
  }

  function test_DeactivateAndActivateToken() public {
    feeHandler.addToken(address(stableToken), address(mentoSeller));
    feeHandler.deactivateToken(address(stableToken));
    assertFalse(feeHandler.getTokenActive(address(stableToken)));
    assertEq(feeHandler.getActiveTokens().length, 0);

    feeHandler.activateToken(address(stableToken));
    assertTrue(feeHandler.getTokenActive(address(stableToken)));
    address[] memory expectedActiveTokens = new address[](1);
    expectedActiveTokens[0] = address(stableToken);
    assertEq(feeHandler.getActiveTokens(), expectedActiveTokens);
  }
}

contract FeeHandlerSetFeeBeneficiary is FeeHandlerFoundry {
  function test_OnlyOwnerCanSetFeeBeneficiary() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS);
  }

  function test_SetsAddressCorrectly() public {
    feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS);
    assertEq(feeHandler.feeBeneficiary(), EXAMPLE_BENEFICIARY_ADDRESS);
  }
}

contract FeeHandlerDistribute is FeeHandlerFoundry {
  modifier setUpBeneficiary() {
    feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS);
    _;
  }

  function test_CantDistributeWhenNotActive() public setUpBeneficiary {
    vm.expectRevert("Handler has to be set to sell token");
    feeHandler.distribute(address(stableToken));
  }

  modifier activateToken() {
    feeHandler.addToken(address(stableToken), address(mentoSeller));
    feeHandler.activateToken(address(stableToken));
    _;
  }

  function test_CantDistributeWhenFrozen() public setUpBeneficiary activateToken {
    freezer.freeze(address(feeHandler));
    vm.expectRevert("can't call when contract is frozen");
    feeHandler.distribute(address(stableToken));
  }

  // ERC20 Transfer event
  event Transfer(address indexed from, address indexed to, uint256 amount);

  function testFail_DoesntDistributeWhenBalanceIsZero() public setUpBeneficiary activateToken {
    assertEq(stableToken.balanceOf(address(feeHandler)), 0);
    // We don't care about the topics or data, just whether an event was emitted
    vm.expectEmit(false, false, false, false);
    emit Transfer(address(feeHandler), address(mentoSeller), 0);
    feeHandler.distribute(address(stableToken));
    // TODO(Alec) check that this works / is there a better way? ß
  }

  function test_Distribute() public setUpBeneficiary activateToken {
    uint256 celoAmount = 1e18;
    uint256 stableTokenAmount = 1e18;

    vm.startPrank(user);
    vm.deal(user, celoAmount);
    celoToken.approve(address(exchangeUSD), celoAmount);
    exchangeUSD.sell(celoAmount, 0, true);
    stableToken.transfer(address(feeHandler), stableTokenAmount);
    vm.stopPrank();
    feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
    feeHandler.setMaxSplippage(address(stableToken), FIXED1);
    feeHandler.sell(address(stableToken));

    feeHandler.distribute(address(stableToken));

    assertEq(stableToken.balanceOf(address(feeHandler)), 0);
    assertEq(stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
  }
}

// TODO(Alec) Reviewed up to here

// contract FeeHandlerBurnCelo is FeeHandlerFoundry {
//   // TODO(Alec) understand these tests

//   function testBurnsCorrectly() public {
//     uint256 celoAmount = 100000000000000000;

//     feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
//     feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS);
//     feeHandler.addToken(address(stableToken), address(mentoSeller));
//     feeHandler.activateToken(address(stableToken));
//     feeHandler.activateToken(address(celoToken));
//     vm.prank(user);
//     celoToken.transfer(address(feeHandler), celoAmount);

//     feeHandler.burnCelo();
//     assertEq(celoToken.balanceOf(address(feeHandler)), 200000000000000000);
//     assertEq(celoToken.getBurnedAmount(), 800000000000000000);
//   }

//   function testDoesntBurnPendingDistribution() public {
//     uint256 celoAmount = 100000000000000000;

//     feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
//     feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS);
//     feeHandler.addToken(address(stableToken), address(mentoSeller));
//     feeHandler.activateToken(address(stableToken));
//     feeHandler.activateToken(address(celoToken));
//     vm.prank(user);
//     celoToken.transfer(address(feeHandler), celoAmount);

//     // TODO(Alec) is state reset between tests?
//     uint256 prevBurn = celoToken.getBurnedAmount();

//     feeHandler.burnCelo();

//     assertEq(celoToken.getBurnedAmount(), 800000000000000000 + prevBurn);

//     feeHandler.burnCelo();
//     assertEq(celoToken.balanceOf(address(feeHandler)), 200000000000000000);
//     assertEq(celoToken.getBurnedAmount(), 800000000000000000 + prevBurn);
//   }

//   function testDistributesCorrectlyAfterBurn() public {
//     // TODO(Alec) isn't this also tested above in Distribute?
//     feeHandler.burnCelo();
//     feeHandler.distribute(address(stableToken));
//     assertEq(stableToken.balanceOf(address(feeHandler)), 200000000000000000);
//     feeHandler.distribute(address(celoToken));
//     assertEq(celoToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 200000000000000000);
//   }
// }

// contract FeeHandlerSell is FeeHandlerFoundry {
//   function testCantSellWhenFrozen() public {
//     feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
//     freezer.freeze(address(feeHandler));
//     vm.expectRevert("can't call when contract is frozen.");
//     feeHandler.sell(address(stableToken));
//   }
// }

// contract FeeHandlerSellMentoTokens is FeeHandlerFoundry {
//   function testWontSellWhenBalanceLow() public {
//     uint256 celoAmount = 1000000000000000000;
//     vm.startPrank(user);
//     celoToken.approve(address(exchangeUSD), celoAmount);
//     exchangeUSD.sell(celoAmount, 0, true);
//     vm.stopPrank();
//     feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
//     feeHandler.addToken(address(stableToken), address(mentoSeller));
//     feeHandler.setMaxSplippage(address(stableToken), FIXED1);

//     vm.prank(user);
//     stableToken.transfer(address(feeHandler), feeHandler.MIN_BURN());
//     uint256 balanceBefore = stableToken.balanceOf(address(feeHandler));
//     feeHandler.sell(address(stableToken));
//     assertEq(stableToken.balanceOf(address(feeHandler)), balanceBefore);
//   }

//   function testResetSellLimit() public {
//     uint256 celoAmount = 1000000000000000000;
//     vm.startPrank(user);
//     celoToken.approve(address(exchangeUSD), celoAmount);
//     exchangeUSD.sell(celoAmount, 0, true);
//     vm.stopPrank();
//     feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
//     feeHandler.addToken(address(stableToken), address(mentoSeller));
//     feeHandler.setMaxSplippage(address(stableToken), FIXED1);

//     feeHandler.setDailySellLimit(address(stableToken), 1000);
//     vm.prank(user);
//     stableToken.transfer(address(feeHandler), 3000);
//     feeHandler.sell(address(stableToken));
//     vm.warp(DAY);
//     feeHandler.sell(address(stableToken));

//     assertEq(stableToken.balanceOf(address(feeHandler)), 1000);
//   }

//   function testDoesntSellWhenBiggerThanLimit() public {
//     uint256 celoAmount = 1000000000000000000;
//     vm.startPrank(user);
//     celoToken.approve(address(exchangeUSD), celoAmount);
//     exchangeUSD.sell(celoAmount, 0, true);
//     vm.startPrank(owner);
//     feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
//     feeHandler.addToken(address(stableToken), address(mentoSeller));
//     feeHandler.setMaxSplippage(address(stableToken), FIXED1);

//     feeHandler.setDailySellLimit(address(stableToken), 1000);
//     vm.startPrank(user);
//     stableToken.transfer(address(feeHandler), 3000);

//     feeHandler.sell(address(stableToken));
//     assertEq(stableToken.balanceOf(address(feeHandler)), 2000);
//     // selling again shouldn't do anything
//     feeHandler.sell(address(stableToken));
//     assertEq(stableToken.balanceOf(address(feeHandler)), 2000);
//   }

//   function testSellsWithMento() public {
//     uint256 celoAmount = 1000000000000000000;
//     vm.startPrank(user);
//     celoToken.approve(address(exchangeUSD), celoAmount);
//     exchangeUSD.sell(celoAmount, 0, true);
//     vm.startPrank(owner);
//     feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
//     feeHandler.addToken(address(stableToken), address(mentoSeller));
//     feeHandler.setMaxSplippage(address(stableToken), FIXED1);
//     vm.startPrank(user);
//     stableToken.transfer(address(feeHandler), celoAmount);

//     assertEq(feeHandler.getPastBurnForToken(address(stableToken)), 0);
//     uint256 startFeeHandlerBalanceStable = stableToken.balanceOf(address(feeHandler));
//     feeHandler.setMaxSplippage(address(stableToken), FIXED1);
//     feeHandler.sell(address(stableToken));
//     assertEq(
//       feeHandler.getPastBurnForToken(address(feeHandler)),
//       FixidityLib
//         .newFixed(startFeeHandlerBalanceStable)
//         .multiply(FixidityLib.newFixedFraction(80, 100))
//         .unwrap()
//     );
//     assertEq(stableToken.balanceOf(address(feeHandler)), 200000000000000000);
//     assertEq(feeHandler.getTokenToDistribute(address(stableToken)), 200000000000000000);
//     // TODO(Alec) how to do 'expectBigNumberInRange'
//   }

//   function testDoesntExchangeWhenNotEnoughReports() public {
//     uint256 celoAmount = 1000000000000000000;
//     vm.startPrank(user);
//     celoToken.approve(address(exchangeUSD), celoAmount);
//     exchangeUSD.sell(celoAmount, 0, true);
//     vm.startPrank(owner);
//     feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
//     feeHandler.addToken(address(stableToken), address(mentoSeller));
//     feeHandler.setMaxSplippage(address(stableToken), FIXED1);
//     vm.startPrank(user);
//     stableToken.transfer(address(feeHandler), celoAmount);

//     mentoSeller.setMinimumReports(address(tokenA), 2);
//     // TODO(Alec) from before migration "this balance is wrong"
//     uint256 balanceBefore = stableToken.balanceOf(address(feeHandler));
//     feeHandler.setMaxSplippage(address(tokenA), maxSlippage);
//     vm.expectRevert("Handler has to be set to sell token.");
//     feeHandler.sell(address(tokenA));
//     assertEq(stableToken.balanceOf(address(feeHandler)), balanceBefore);
//   }

//   function testDoesntBurnBalanceIfHasntDistributed() public {
//     uint256 celoAmount = 1000000000000000000;
//     vm.startPrank(user);
//     celoToken.approve(address(exchangeUSD), celoAmount);
//     exchangeUSD.sell(celoAmount, 0, true);
//     vm.startPrank(owner);
//     feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
//     feeHandler.addToken(address(stableToken), address(mentoSeller));
//     feeHandler.setMaxSplippage(address(stableToken), FIXED1);
//     vm.startPrank(user);
//     stableToken.transfer(address(feeHandler), celoAmount);

//     feeHandler.sell(address(stableToken));
//     uint256 balanceBefore = stableToken.balanceOf(address(feeHandler));
//     feeHandler.sell(address(stableToken));
//     assertEq(stableToken.balanceOf(address(feeHandler)), balanceBefore);
//   }
// }

// contract FeeHandlerSellNonMentoTokens is FeeHandlerFoundry {
//   function testDoesntExchangeWhenNotEnoughReports() public {
//     uint256 deadline = block.timestamp + 100;
//     uniswapFactory = new MockUniswapV2Factory(0x0000000000000000000000000000000000000000); // feeSetter
//     bytes32 initCodePairHash = uniswapFactory.INIT_CODE_PAIR_HASH();
//     uniswapRouter = new MockUniswapV2Router02(
//       address(uniswapFactory),
//       0x0000000000000000000000000000000000000000,
//       initCodePairHash
//     );

//     uniswapFactory2 = new MockUniswapV2Factory(0x0000000000000000000000000000000000000000); // feeSetter
//     uniswapRouter2 = new MockUniswapV2Router02(
//       address(uniswapFactory2),
//       0x0000000000000000000000000000000000000000,
//       initCodePairHash
//     );

//     vm.startPrank(owner);
//     feeCurrencyWhitelist.addToken(address(tokenA));

//     uniswapFeeHandlerSeller.initialize(address(registry), new address[](0), new uint256[](0));
//     uniswapFeeHandlerSeller.setRouter(address(tokenA), address(uniswapRouter));
//     tokenA.mint(address(feeHandler), 10000000000000000000);
//     tokenA.mint(user, 10000000000000000000);
//     celoToken.transfer(user, 10000000000000000000);
//     uint256 toTransfer = 5000000000000000000;

//     vm.startPrank(user);
//     tokenA.approve(address(uniswapRouter), toTransfer);
//     celoToken.approve(address(uniswapRouter), toTransfer);
//     uniswapRouter.addLiquidity(
//       address(tokenA),
//       address(celoToken),
//       toTransfer,
//       toTransfer,
//       toTransfer,
//       toTransfer,
//       user,
//       deadline
//     );

//     vm.startPrank(owner);
//     feeHandler.addToken(address(tokenA), address(uniswapFeeHandlerSeller));
//     feeHandler.setMaxSplippage(address(tokenA), FIXED1);

//     // TODO(Alec) beforeEach

//     uniswapFeeHandlerSeller.setMinimumReports(address(tokenA), 1);
//     feeHandler.setMaxSplippage(address(tokenA), FixidityLib.newFixedFraction(99, 100).unwrap());
//     mockSortedOracles.setMedianRate(address(tokenA), celoAmountForRate);

//     // TODO(Alec) beforeEach

//     vm.expectRevert("Number of reports for token not enough");
//     feeHandler.sell(address(tokenA));
//     assertEq(tokenA.balanceOf(address(feeHandler)), 10000000000000000000);
//   }

//   function testSellWorksWithCheck() public {
//     uint256 deadline = block.timestamp + 100;
//     uniswapFactory = new MockUniswapV2Factory(0x0000000000000000000000000000000000000000); // feeSetter
//     bytes32 initCodePairHash = uniswapFactory.INIT_CODE_PAIR_HASH();
//     uniswapRouter = new MockUniswapV2Router02(
//       address(uniswapFactory),
//       0x0000000000000000000000000000000000000000,
//       initCodePairHash
//     );

//     uniswapFactory2 = new MockUniswapV2Factory(0x0000000000000000000000000000000000000000); // feeSetter
//     uniswapRouter2 = new MockUniswapV2Router02(
//       address(uniswapFactory2),
//       0x0000000000000000000000000000000000000000,
//       initCodePairHash
//     );

//     vm.startPrank(owner);
//     feeCurrencyWhitelist.addToken(address(tokenA));
//     uniswapFeeHandlerSeller.initialize(address(registry), new address[](0), new uint256[](0));
//     uniswapFeeHandlerSeller.setRouter(address(tokenA), address(uniswapRouter));
//     tokenA.mint(address(feeHandler), 10000000000000000000);
//     tokenA.mint(user, 10000000000000000000);
//     celoToken.transfer(user, 10000000000000000000);
//     uint256 toTransfer = 5000000000000000000;

//     vm.startPrank(user);
//     tokenA.approve(address(uniswapRouter), toTransfer);
//     celoToken.approve(address(uniswapRouter), toTransfer);
//     uniswapRouter.addLiquidity(
//       address(tokenA),
//       address(celoToken),
//       toTransfer,
//       toTransfer,
//       toTransfer,
//       toTransfer,
//       user,
//       deadline
//     );

//     vm.startPrank(owner);
//     feeHandler.addToken(address(tokenA), address(uniswapFeeHandlerSeller));
//     feeHandler.setMaxSplippage(address(tokenA), FIXED1);

//     // TODO(Alec) beforeEach

//     uniswapFeeHandlerSeller.setMinimumReports(address(tokenA), 1);
//     feeHandler.setMaxSplippage(address(tokenA), FixidityLib.newFixedFraction(99, 100).unwrap());
//     mockSortedOracles.setMedianRate(address(tokenA), celoAmountForRate);

//     // TODO(Alec) beforeEach

//     mockSortedOracles.setNumRates(address(tokenA), 2);
//     feeHandler.sell(address(tokenA));
//     assertEq(tokenA.balanceOf(address(feeHandler)), 2000000000000000000);
//   }

//   function testFailsWhenOracleSlippageIsHigh() public {
//     uint256 deadline = block.timestamp + 100;
//     uniswapFactory = new MockUniswapV2Factory(0x0000000000000000000000000000000000000000); // feeSetter
//     bytes32 initCodePairHash = uniswapFactory.INIT_CODE_PAIR_HASH();
//     uniswapRouter = new MockUniswapV2Router02(
//       address(uniswapFactory),
//       0x0000000000000000000000000000000000000000,
//       initCodePairHash
//     );

//     uniswapFactory2 = new MockUniswapV2Factory(0x0000000000000000000000000000000000000000); // feeSetter
//     uniswapRouter2 = new MockUniswapV2Router02(
//       address(uniswapFactory2),
//       0x0000000000000000000000000000000000000000,
//       initCodePairHash
//     );

//     vm.startPrank(owner);
//     feeCurrencyWhitelist.addToken(address(tokenA));
//     uniswapFeeHandlerSeller.initialize(address(registry), new address[](0), new uint256[](0));
//     uniswapFeeHandlerSeller.setRouter(address(tokenA), address(uniswapRouter));
//     tokenA.mint(address(feeHandler), 10000000000000000000);
//     tokenA.mint(user, 10000000000000000000);
//     celoToken.transfer(user, 10000000000000000000);
//     uint256 toTransfer = 5000000000000000000;

//     vm.startPrank(user);
//     tokenA.approve(address(uniswapRouter), toTransfer);
//     celoToken.approve(address(uniswapRouter), toTransfer);
//     uniswapRouter.addLiquidity(
//       address(tokenA),
//       address(celoToken),
//       toTransfer,
//       toTransfer,
//       toTransfer,
//       toTransfer,
//       user,
//       deadline
//     );

//     vm.startPrank(owner);
//     feeHandler.addToken(address(tokenA), address(uniswapFeeHandlerSeller));
//     feeHandler.setMaxSplippage(address(tokenA), FIXED1);

//     // TODO(Alec) beforeEach

//     uniswapFeeHandlerSeller.setMinimumReports(address(tokenA), 1);
//     feeHandler.setMaxSplippage(address(tokenA), FixidityLib.newFixedFraction(99, 100).unwrap());
//     mockSortedOracles.setMedianRate(address(tokenA), celoAmountForRate);

//     // TODO(Alec) beforeEach

//     mockSortedOracles.setNumRates(address(tokenA), 2);
//     feeHandler.setMaxSplippage(address(tokenA), FixidityLib.newFixedFraction(80, 100).unwrap());

//     mockSortedOracles.setMedianRate(address(tokenA), 300 * celoAmountForRate);
//     vm.expectRevert("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
//     feeHandler.sell(address(tokenA));
//   }

//   function testUniswapTrade() public {
//     uint256 deadline = block.timestamp + 100;
//     uniswapFactory = new MockUniswapV2Factory(0x0000000000000000000000000000000000000000); // feeSetter
//     bytes32 initCodePairHash = uniswapFactory.INIT_CODE_PAIR_HASH();
//     uniswapRouter = new MockUniswapV2Router02(
//       address(uniswapFactory),
//       0x0000000000000000000000000000000000000000,
//       initCodePairHash
//     );

//     uniswapFactory2 = new MockUniswapV2Factory(0x0000000000000000000000000000000000000000); // feeSetter
//     uniswapRouter2 = new MockUniswapV2Router02(
//       address(uniswapFactory2),
//       0x0000000000000000000000000000000000000000,
//       initCodePairHash
//     );

//     vm.startPrank(owner);
//     feeCurrencyWhitelist.addToken(address(tokenA));
//     uniswapFeeHandlerSeller.initialize(address(registry), new address[](0), new uint256[](0));
//     uniswapFeeHandlerSeller.setRouter(address(tokenA), address(uniswapRouter));
//     tokenA.mint(address(feeHandler), 10000000000000000000);
//     tokenA.mint(user, 10000000000000000000);
//     celoToken.transfer(user, 10000000000000000000);
//     uint256 toTransfer = 5000000000000000000;

//     vm.startPrank(user);
//     tokenA.approve(address(uniswapRouter), toTransfer);
//     celoToken.approve(address(uniswapRouter), toTransfer);
//     uniswapRouter.addLiquidity(
//       address(tokenA),
//       address(celoToken),
//       toTransfer,
//       toTransfer,
//       toTransfer,
//       toTransfer,
//       user,
//       deadline
//     );

//     vm.startPrank(owner);
//     feeHandler.addToken(address(tokenA), address(uniswapFeeHandlerSeller));
//     feeHandler.setMaxSplippage(address(tokenA), FIXED1);

//     // TODO(Alec) beforeEach

//     uint256 balanceAbefore = tokenA.balanceOf(user);
//     uint256 balanceBbefore = celoToken.balanceOf(user);

//     vm.startPrank(user);
//     tokenA.approve(address(uniswapRouter), 1000000000000000000);
//     address[] memory tokenAddresses = new address[](2);
//     tokenAddresses[0] = address(tokenA);
//     tokenAddresses[1] = address(celoToken);
//     uniswapRouter.swapExactTokensForTokens(1000000000000000000, 0, tokenAddresses, user, deadline);

//     assertEq(balanceAbefore, tokenA.balanceOf(user));
//     assertEq(celoToken.balanceOf(user), balanceBbefore);
//   }

//   function testSellsNonMentoTokens() public {
//     uint256 deadline = block.timestamp + 100;
//     uniswapFactory = new MockUniswapV2Factory(0x0000000000000000000000000000000000000000); // feeSetter
//     bytes32 initCodePairHash = uniswapFactory.INIT_CODE_PAIR_HASH();
//     uniswapRouter = new MockUniswapV2Router02(
//       address(uniswapFactory),
//       0x0000000000000000000000000000000000000000,
//       initCodePairHash
//     );

//     // TODO(Alec) are these being used??
//     uniswapFactory2 = new MockUniswapV2Factory(0x0000000000000000000000000000000000000000); // feeSetter
//     uniswapRouter2 = new MockUniswapV2Router02(
//       address(uniswapFactory2),
//       0x0000000000000000000000000000000000000000,
//       initCodePairHash
//     );

//     vm.startPrank(owner);
//     feeCurrencyWhitelist.addToken(address(tokenA));
//     uniswapFeeHandlerSeller.initialize(address(registry), new address[](0), new uint256[](0));
//     uniswapFeeHandlerSeller.setRouter(address(tokenA), address(uniswapRouter));
//     tokenA.mint(address(feeHandler), 10000000000000000000);
//     tokenA.mint(user, 10000000000000000000);
//     celoToken.transfer(user, 10000000000000000000);
//     uint256 toTransfer = 5000000000000000000;

//     vm.startPrank(user);
//     tokenA.approve(address(uniswapRouter), toTransfer);
//     celoToken.approve(address(uniswapRouter), toTransfer);
//     uniswapRouter.addLiquidity(
//       address(tokenA),
//       address(celoToken),
//       toTransfer,
//       toTransfer,
//       toTransfer,
//       toTransfer,
//       user,
//       deadline
//     );

//     vm.startPrank(owner);
//     feeHandler.addToken(address(tokenA), address(uniswapFeeHandlerSeller));
//     feeHandler.setMaxSplippage(address(tokenA), FIXED1);

//     // TODO(Alec) beforeEach

//     assertTrue(tokenA.balanceOf(address(feeHandler)) > 0);
//     feeHandler.sell(address(tokenA));
//     assertEq(tokenA.balanceOf(address(feeHandler)), 2000000000000000000);
//   }

//   function testDoesntExchangeWhenSlippageIsTooHigh() public {
//     uint256 deadline = block.timestamp + 100;
//     uniswapFactory = new MockUniswapV2Factory(0x0000000000000000000000000000000000000000); // feeSetter
//     bytes32 initCodePairHash = uniswapFactory.INIT_CODE_PAIR_HASH();
//     uniswapRouter = new MockUniswapV2Router02(
//       address(uniswapFactory),
//       0x0000000000000000000000000000000000000000,
//       initCodePairHash
//     );

//     uniswapFactory2 = new MockUniswapV2Factory(0x0000000000000000000000000000000000000000); // feeSetter
//     uniswapRouter2 = new MockUniswapV2Router02(
//       address(uniswapFactory2),
//       0x0000000000000000000000000000000000000000,
//       initCodePairHash
//     );

//     vm.startPrank(owner);
//     feeCurrencyWhitelist.addToken(address(tokenA));
//     uniswapFeeHandlerSeller.initialize(address(registry), new address[](0), new uint256[](0));
//     uniswapFeeHandlerSeller.setRouter(address(tokenA), address(uniswapRouter));
//     tokenA.mint(address(feeHandler), 10000000000000000000);
//     tokenA.mint(user, 10000000000000000000);
//     celoToken.transfer(user, 10000000000000000000);
//     uint256 toTransfer = 5000000000000000000;

//     vm.startPrank(user);
//     tokenA.approve(address(uniswapRouter), toTransfer);
//     celoToken.approve(address(uniswapRouter), toTransfer);
//     uniswapRouter.addLiquidity(
//       address(tokenA),
//       address(celoToken),
//       toTransfer,
//       toTransfer,
//       toTransfer,
//       toTransfer,
//       user,
//       deadline
//     );

//     vm.startPrank(owner);
//     feeHandler.addToken(address(tokenA), address(uniswapFeeHandlerSeller));

//     // TODO(Alec) beforeEach

//     feeHandler.setMaxSplippage(address(tokenA), maxSlippage);
//     vm.expectRevert("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
//     feeHandler.sell(address(tokenA));
//     assertEq(tokenA.balanceOf(address(feeHandler)), 10000000000000000000);
//   }

//   function testTriesToGetBestRateWithManyExchanges() public {
//     uint256 deadline = block.timestamp + 100;
//     uniswapFactory = new MockUniswapV2Factory(0x0000000000000000000000000000000000000000); // feeSetter
//     bytes32 initCodePairHash = uniswapFactory.INIT_CODE_PAIR_HASH();
//     uniswapRouter = new MockUniswapV2Router02(
//       address(uniswapFactory),
//       0x0000000000000000000000000000000000000000,
//       initCodePairHash
//     );

//     uniswapFactory2 = new MockUniswapV2Factory(0x0000000000000000000000000000000000000000); // feeSetter
//     uniswapRouter2 = new MockUniswapV2Router02(
//       address(uniswapFactory2),
//       0x0000000000000000000000000000000000000000,
//       initCodePairHash
//     );

//     vm.startPrank(owner);
//     feeCurrencyWhitelist.addToken(address(tokenA));
//     uniswapFeeHandlerSeller.initialize(address(registry), new address[](0), new uint256[](0));
//     uniswapFeeHandlerSeller.setRouter(address(tokenA), address(uniswapRouter));
//     tokenA.mint(address(feeHandler), 10000000000000000000);
//     tokenA.mint(user, 10000000000000000000);
//     celoToken.transfer(user, 10000000000000000000);
//     uint256 toTransfer = 5000000000000000000;

//     vm.startPrank(user);
//     tokenA.approve(address(uniswapRouter), toTransfer);
//     celoToken.approve(address(uniswapRouter), toTransfer);
//     uniswapRouter.addLiquidity(
//       address(tokenA),
//       address(celoToken),
//       toTransfer,
//       toTransfer,
//       toTransfer,
//       toTransfer,
//       user,
//       deadline
//     );

//     vm.startPrank(owner);
//     feeHandler.addToken(address(tokenA), address(uniswapFeeHandlerSeller));
//     feeHandler.setMaxSplippage(address(tokenA), FIXED1);

//     // TODO(Alec) beforeEach

//     uniswapFeeHandlerSeller.setRouter(address(tokenA), address(uniswapRouter2));
//     tokenA.mint(user, 10000000000000000000);

//     // safety check, check that the balance is no empty before the burn
//     assertTrue(tokenA.balanceOf(address(feeHandler)) > 0);

//     uint256 toTransfer2 = 100000000000000000000;

//     vm.startPrank(user);
//     tokenA.approve(address(uniswapRouter2), toTransfer2);
//     celoToken.approve(address(uniswapRouter2), toTransfer2);

//     uniswapRouter2.addLiquidity(
//       address(tokenA),
//       address(celoToken),
//       toTransfer2,
//       toTransfer2,
//       toTransfer2,
//       toTransfer2,
//       user,
//       deadline
//     );

//     address[] memory tokenAddresses = new address[](2);
//     tokenAddresses[0] = address(tokenA);
//     tokenAddresses[1] = address(celoToken);

//     uint256 quote1before = uniswapRouter.getAmountsOut(1000000000000000000, tokenAddresses)[1];
//     uint256 quote2before = uniswapRouter2.getAmountsOut(1000000000000000000, tokenAddresses)[1];

//     feeHandler.sell(address(tokenA));

//     // liquidity should have been taken of uniswap2, because it has better liquidity, and thus higher quote
//     // so the quote gets worse (smaller number)

//     uint256 quote1after = uniswapRouter.getAmountsOut(1000000000000000000, tokenAddresses)[1];
//     uint256 quote2after = uniswapRouter.getAmountsOut(1000000000000000000, tokenAddresses)[1];

//     assertEq(quote1before, quote1after); // uniswap 1 should be untouched
//     assertTrue(quote2before > quote2after);
//     assertEq(tokenA.balanceOf(address(feeHandler)), 2000000000000000000); // check that it burned
//   }
// }

// contract FeeHandlerHandleMentoTokens is FeeHandlerFoundry {
//   function testRevertsWhenTokenNotAdded() public {
//     vm.startPrank(user);
//     celoToken.transfer(address(feeHandler), 1000000000000000000);
//     vm.startPrank(owner);
//     feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
//     feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS);

//     // TODO(Alec) beforeEach

//     vm.expectRevert("Handler has to be set to sell token");
//     feeHandler.handle(address(stableToken));
//   }

//   function testHandleCelo() public {
//     vm.startPrank(user);
//     celoToken.transfer(address(feeHandler), 1000000000000000000);
//     vm.startPrank(owner);
//     feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
//     feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS);
//     feeHandler.activateToken(address(celoToken));

//     // TODO(Alec) beforeEach

//     uint256 pastBurn = celoToken.getBurnedAmount();
//     uint256 prevBeneficiaryBalance = celoToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS);
//     feeHandler.handle(address(celoToken));
//     assertEq(celoToken.getBurnedAmount(), 800000000000000000 + pastBurn);
//     assertEq(
//       celoToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS),
//       200000000000000000 + prevBeneficiaryBalance
//     );
//   }
// }

// contract FeeHandlerHandleAll is FeeHandlerFoundry {
//   function testBurnsWithMento() public {
//     uint256 celoTokenAmount = 1000000000000000000;

//     vm.startPrank(user);

//     celoToken.approve(address(exchangeUSD), celoTokenAmount);
//     celoToken.approve(address(exchangeEUR), celoTokenAmount);

//     exchangeUSD.sell(celoTokenAmount, 0, true);
//     exchangeEUR.sell(celoTokenAmount, 0, true);

//     vm.startPrank(owner);

//     feeHandler.addToken(address(stableToken), address(mentoSeller));
//     feeHandler.addToken(address(stableTokenEUR), address(mentoSeller));
//     feeHandler.setMaxSplippage(address(stableToken), FIXED1);
//     feeHandler.setMaxSplippage(address(stableTokenEUR), FIXED1);

//     feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
//     feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS);

//     uint256 previousBurn = celoToken.getBurnedAmount();
//     vm.startPrank(user);
//     stableToken.transfer(address(feeHandler), 1000000000000000000);
//     stableTokenEUR.transfer(address(feeHandler), 1000000000000000000);

//     assertEq(feeHandler.getPastBurnForToken(address(stableToken)), 0);
//     uint256 burnedAmountStable = stableToken.balanceOf(address(feeHandler));

//     feeHandler.handleAll();

//     assertEq(
//       feeHandler.getPastBurnForToken(address(stableToken)),
//       FixidityLib
//         .newFixed(burnedAmountStable)
//         .multiply(FixidityLib.newFixedFraction(80, 100))
//         .unwrap()
//     );
//     assertEq(
//       feeHandler.getPastBurnForToken(address(stableTokenEUR)),
//       FixidityLib
//         .newFixed(burnedAmountStable)
//         .multiply(FixidityLib.newFixedFraction(80, 100))
//         .unwrap()
//     );
//     assertEq(stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 200000000000000000);
//     assertEq(stableTokenEUR.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 200000000000000000);

//     // everything should have been burned
//     assertEq(feeHandler.getTokenToDistribute(address(stableToken)), 0);
//     assertEq(feeHandler.getTokenToDistribute(address(stableTokenEUR)), 0);

//     // burn is non zero
//     assertTrue(celoToken.getBurnedAmount() > previousBurn);
//   }
// }

// contract FeeHandlerTransfer is FeeHandlerFoundry {
//   function testOnlyOwnerCanTakeFundsOut() public {
//     tokenA.mint(address(feeHandler), 1000000000000000000);

//     vm.expectRevert("Ownable: caller is not the owner.");
//     feeHandler.transfer(address(tokenA), user, 1000000000000000000);
//   }

//   function testCanTakeFundsOut() public {
//     tokenA.mint(address(feeHandler), 1000000000000000000);

//     feeHandler.transfer(address(tokenA), user, 1000000000000000000);
//     assertEq(tokenA.balanceOf(user), 1000000000000000000);
//   }
// }

// contract FeeHandlerSetDailySellLimit is FeeHandlerFoundry {
//   function testOnlyOwnerCanSetLimit() public {
//     vm.expectRevert("Ownable: caller is not the owner.");
//     vm.startPrank(user);
//     feeHandler.setDailySellLimit(address(stableToken), celoAmountForRate);
//   }
// }

// contract FeeHandlerSetMaxSlippage is FeeHandlerFoundry {
//   function testShouldOnlyBeCalledByOwner() public {
//     vm.expectRevert("Ownable: caller is not the owner.");
//     vm.startPrank(user);
//     feeHandler.setMaxSplippage(address(stableToken), maxSlippage);
//   }
// }
