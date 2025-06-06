// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

// Refactor this test, make it easy to generate
// will have to support more fees

import "@celo-contracts/common/FeeHandler.sol";

import { TestWithUtils } from "@test-sol/TestWithUtils.sol";
import "@test-sol/utils/WhenL2.sol";

import { Exchange } from "@mento-core/contracts/Exchange.sol";
import { StableToken } from "@mento-core/contracts/StableToken.sol";
import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/Freezer.sol";
import "@celo-contracts/common/GoldToken.sol";
import "@celo-contracts/common/FeeCurrencyWhitelist.sol";
import "@celo-contracts/common/MentoFeeHandlerSeller.sol";
import "@celo-contracts/common/UniswapFeeHandlerSeller.sol";
import "@celo-contracts/uniswap/test/MockUniswapV2Router02.sol";
import "@celo-contracts/uniswap/test/MockUniswapV2Factory.sol";
import "@celo-contracts/uniswap/test/MockERC20.sol";
import "@celo-contracts/stability/test/MockSortedOracles.sol";
import "@mento-core/test/mocks/MockReserve.sol";
import "@celo-contracts/common/ProxyFactory.sol";
import "@celo-contracts/governance/GovernanceApproverMultiSig.sol";

contract FeeHandlerTest is TestWithUtils {
  using FixidityLib for FixidityLib.Fraction;

  event BeneficiaryAdded(address beneficiary);
  event BeneficiaryFractionSet(address beneficiary, uint256 fraction);
  event BeneficiaryNameSet(address beneficiary, string name);

  FeeHandler feeHandler;

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
  address OTHER_BENEFICIARY_ADDRESS = 0x2A486910dBc72CACCBB8D0E1439c96B03b2A4610;

  address owner = address(this);
  address user = actor("user");
  address celoUnreleasedTreasury = actor("CeloUnreleasedTreasury");

  uint256 celoAmountForRate = 1e24;
  uint256 stableAmountForRate = 2 * celoAmountForRate;
  uint256 spread;
  uint256 reserveFraction;
  uint256 maxSlippage;
  uint256 initialReserveBalance = 1e22;

  uint8 decimals = 18;
  uint256 updateFrequency = 60 * 60;
  uint256 minimumReports = 2;
  address op;

  event SoldAndBurnedToken(address token, uint256 value);
  event DailyLimitSet(address tokenAddress, uint256 newLimit);
  event DailyLimitHit(address token, uint256 burning);
  event MaxSlippageSet(address token, uint256 maxSlippage);
  event DailySellLimitUpdated(uint256 amount);
  event FeeBeneficiarySet(address newBeneficiary);
  event BurnFractionSet(uint256 fraction);
  event TokenAdded(address tokenAddress, address handlerAddress);
  event TokenRemoved(address tokenAddress);

  function setUp() public {
    super.setUp();
    vm.warp(YEAR); // foundry starts block.timestamp at 0, which leads to underflow errors in Uniswap contracts
    op = actor("op");

    spread = FixidityLib.newFixedFraction(3, 1000).unwrap();
    reserveFraction = FixidityLib.newFixedFraction(5, 100).unwrap();
    maxSlippage = FixidityLib.newFixedFraction(1, 100).unwrap();

    celoToken = new GoldToken(true);
    mockReserve = new MockReserve();
    stableToken = new StableToken(true);
    stableTokenEUR = new StableToken(true);
    registry = IRegistry(REGISTRY_ADDRESS);
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
    registry.setAddressFor("CeloToken", address(celoToken));
    registry.setAddressFor("Reserve", address(mockReserve));
    registry.setAddressFor("CeloUnreleasedTreasury", celoUnreleasedTreasury);

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
      "ExchangeEUR"
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
      REGISTRY_ADDRESS,
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

contract FeeHandlerTest_L2 is WhenL2, FeeHandlerTest {}

contract FeeHandlerTest_Initialize is FeeHandlerTest {
  function test_Reverts_WhenAlreadyInitialized() public {
    vm.expectRevert("contract already initialized");
    feeHandler.initialize(
      REGISTRY_ADDRESS,
      EXAMPLE_BENEFICIARY_ADDRESS,
      0,
      new address[](0),
      new address[](0),
      new uint256[](0),
      new uint256[](0)
    );
  }

  function test_registryAddressSet() public {
    assertEq(address(feeHandler.registry()), REGISTRY_ADDRESS);
  }

  function test_FeeBeneficiarySet() public {
    assertEq(feeHandler.carbonFeeBeneficiary(), EXAMPLE_BENEFICIARY_ADDRESS);
  }
}

contract FeeHandlerTest_SetCarbonFraction is FeeHandlerTest {
  event CarbonFractionSet(uint256 fraction);

  function test_Reverts_WhenCallerNotOwner() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.setCarbonFraction(100);
  }

  function test_Reverts_WhenFractionsGreaterThanOne() public {
    vm.expectRevert("New cargon fraction can't be greather than 1");
    feeHandler.setCarbonFraction(FixidityLib.newFixedFraction(3, 2).unwrap());
  }

  function test_WhenOtherBeneficiaryWouldAddToOne() public {
    feeHandler.addOtherBeneficiary(
      op,
      (20 * 1e24) / 100, // TODO use fixidity
      "OP revenue share"
    );

    feeHandler.setCarbonFraction(FixidityLib.newFixedFraction(8, 10).unwrap());
  }

  function test_setsCarbonFraction() public {
    feeHandler.setCarbonFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
    assertEq(
      feeHandler.getCarbonFraction(),
      FixidityLib.newFixedFraction(80, 100).unwrap(),
      "Burn fraction should be set"
    );
  }

  function test_ShouldEmitBurnFractionSet() public {
    vm.expectEmit(true, true, true, true);
    emit CarbonFractionSet(FixidityLib.newFixedFraction(80, 100).unwrap());
    feeHandler.setCarbonFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
  }
}

contract FeeHandlerTest_SetCarbonFraction_L2 is
  FeeHandlerTest_L2,
  FeeHandlerTest_SetCarbonFraction
{}

// TODO change beneficiary allocation
contract FeeHandlerTest_changeOtherBeneficiaryAllocation is FeeHandlerTest {
  function setUp() public {
    super.setUp();
    feeHandler.addOtherBeneficiary(
      op,
      (20 * 1e24) / 100, // TODO use fixidity
      "OP revenue share"
    );
  }

  function test_changedSucsesfully() public {
    feeHandler.changeOtherBeneficiaryAllocation(op, (30 * 1e24) / 100);
    (uint256 fraction, , ) = feeHandler.getOtherBeneficiariesInfo(op);
    assertEq(fraction, (30 * 1e24) / 100);
  }

  function test_Reverts_WHenBeneficiaryNotExists() public {
    vm.expectRevert("Beneficiary not found");
    feeHandler.changeOtherBeneficiaryAllocation(actor("notExists"), (30 * 1e24) / 100);
  }

  function test_Emit() public {
    vm.expectEmit(true, true, true, true);
    emit BeneficiaryFractionSet(op, (30 * 1e24) / 100);
    feeHandler.changeOtherBeneficiaryAllocation(op, (30 * 1e24) / 100);
  }

  function test_Reverts_WhenCallerNotOwner() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.changeOtherBeneficiaryAllocation(op, (30 * 1e24) / 100);
  }
}

contract FeeHandlerTest_changeOtherBeneficiaryAllocation_L2 is
  FeeHandlerTest_L2,
  FeeHandlerTest_changeOtherBeneficiaryAllocation
{}

contract FeeHandlerTest_SetHandler is FeeHandlerTest {
  function test_Reverts_WhenCallerNotOwner() public {
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

contract FeeHandlerTest_SetHandler_L2 is FeeHandlerTest_L2, FeeHandlerTest_SetHandler {}

contract FeeHandlerTest_AddToken is FeeHandlerTest {
  function test_Reverts_WhenCallerNotOwner() public {
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

  function test_ShouldEmitTokenAdded() public {
    vm.expectEmit(true, true, true, true);
    emit TokenAdded(address(stableToken), address(mentoSeller));
    feeHandler.addToken(address(stableToken), address(mentoSeller));
  }
}

contract FeeHandlerTest_AddToken_L2 is FeeHandlerTest_L2, FeeHandlerTest_AddToken {}

contract FeeHandlerTest_RemoveToken is FeeHandlerTest {
  function test_Reverts_WhenCallerNotOwner() public {
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

  function test_Emits_TokenRemoved() public {
    feeHandler.addToken(address(stableToken), address(mentoSeller));
    vm.expectEmit(true, true, true, true);
    emit TokenRemoved(address(stableToken));
    feeHandler.removeToken(address(stableToken));
  }
}

contract FeeHandlerTest_RemoveToken_L2 is FeeHandlerTest_L2, FeeHandlerTest_RemoveToken {}

contract FeeHandlerTest_DeactivateAndActivateToken is FeeHandlerTest {
  function test_Reverts_WhenActivateCallerNotOwner() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.deactivateToken(address(stableToken));
  }

  function test_Reverts_WhenDeactivateCallerNotOwner() public {
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

contract FeeHandlerTest_DeactivateAndActivateToken_L2 is
  FeeHandlerTest_L2,
  FeeHandlerTest_DeactivateAndActivateToken
{}

contract FeeHandlerTest_SetFeeBeneficiary is FeeHandlerTest {
  function test_Reverts_WhenCallerNotOwner() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.setCarbonFeeBeneficiary(OTHER_BENEFICIARY_ADDRESS);
  }

  function test_ShouldEmitFeeBeneficiarySet() public {
    vm.expectEmit(true, true, true, true);
    emit FeeBeneficiarySet(OTHER_BENEFICIARY_ADDRESS);
    feeHandler.setCarbonFeeBeneficiary(OTHER_BENEFICIARY_ADDRESS);
  }

  function test_SetsAddressCorrectly() public {
    feeHandler.setCarbonFeeBeneficiary(OTHER_BENEFICIARY_ADDRESS);
    assertEq(feeHandler.carbonFeeBeneficiary(), OTHER_BENEFICIARY_ADDRESS);
  }
}

contract FeeHandlerTest_SetFeeBeneficiary_L2 is
  FeeHandlerTest_L2,
  FeeHandlerTest_SetFeeBeneficiary
{}

contract FeeHandlerTestAbstract is FeeHandlerTest {
  function addAndActivateToken(address token, address handler) public {
    feeHandler.addToken(token, handler);
  }

  function setCarbonFraction(uint256 numerator, uint256 denominator) internal {
    feeHandler.setCarbonFraction(FixidityLib.newFixedFraction(numerator, denominator).unwrap());
  }

  function fundFeeHandlerStable(
    uint256 stableAmount,
    address stableTokenAddress,
    address exchangeAddress
  ) internal {
    vm.prank(address(exchangeAddress));
    StableToken(stableTokenAddress).mint(address(feeHandler), stableAmount);
  }

  function setMaxSlippage(address stableTokenAddress, uint256 slippage) internal {
    feeHandler.setMaxSplippage(stableTokenAddress, slippage);
  }

  function fundFeeHandlerWithCelo() public {
    uint256 celoAmount = 1e18;
    celoToken.transfer(address(feeHandler), celoAmount);
  }
}

contract FeeHandlerTestAbstract_L2 is FeeHandlerTest_L2, FeeHandlerTestAbstract {}

contract FeeHandlerTest_AddOtherBeneficiary is FeeHandlerTestAbstract {
  // TODO only owner
  function test_addsSucsesfully() public {
    feeHandler.addOtherBeneficiary(
      op,
      (20 * 1e24) / 100, // TODO use fixidity
      "OP revenue share"
    );

    assertEq(feeHandler.getOtherBeneficiariesAddresses().length, 1);
    (uint256 fraction, string memory name, ) = feeHandler.getOtherBeneficiariesInfo(op);
    assertEq(fraction, (20 * 1e24) / 100);
    assertEq(name, "OP revenue share");
  }

  function test_SetsWhenBurningFractionWouldBeZero() public {
    setCarbonFraction(20, 100);
    feeHandler.addOtherBeneficiary(
      op,
      (80 * 1e24) / 100, // TODO use fixidity
      "OP revenue share"
    );

    assertFalse(feeHandler.shouldBurn());
  }

  function test_Reverts_WhenaddingSameTokenTwice() public {
    feeHandler.addOtherBeneficiary(
      op,
      (80 * 1e24) / 100, // TODO use fixidity
      "OP revenue share"
    );
    vm.expectRevert("Beneficiary already exists");
    feeHandler.addOtherBeneficiary(
      op,
      (80 * 1e24) / 100, // TODO use fixidity
      "OP revenue share"
    );
  }

  function test_Reverts_WhenCallerNotOwner() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.addOtherBeneficiary(
      op,
      (80 * 1e24) / 100, // TODO use fixidity
      "OP revenue share"
    );
  }

  function test_Emmit() public {
    vm.expectEmit(true, true, true, true);
    emit BeneficiaryFractionSet(op, (80 * 1e24) / 100);
    vm.expectEmit(true, true, true, true);
    emit BeneficiaryNameSet(op, "OP revenue share");
    vm.expectEmit(true, true, true, true);
    emit BeneficiaryAdded(op);
    feeHandler.addOtherBeneficiary(
      op,
      (80 * 1e24) / 100, // TODO use fixidity
      "OP revenue share"
    );
  }
}

contract FeeHandlerTest_AddOtherBeneficiary_L2 is
  FeeHandlerTestAbstract_L2,
  FeeHandlerTest_AddOtherBeneficiary
{}

contract FeeHandlerTest_Distribute is FeeHandlerTestAbstract {
  function setUp() public {
    super.setUp();
    setCarbonFraction(20, 100);
    setMaxSlippage(address(stableToken), FIXED1);
  }

  function test_Reverts_WhenNotActive() public {
    vm.expectRevert("Token needs to be active");
    feeHandler.distribute(address(stableToken));
  }

  function test_Reverts_WhenFrozen() public {
    addAndActivateToken(address(stableToken), address(mentoSeller));
    freezer.freeze(address(feeHandler));
    vm.expectRevert("can't call when contract is frozen");
    feeHandler.distribute(address(stableToken));
  }

  function test_DoesntDistributeWhenToDistributeIsZero() public {
    fundFeeHandlerStable(1e18, address(stableToken), address(exchangeUSD));
    addAndActivateToken(address(stableToken), address(mentoSeller));
    // If we uncomment this the test should fail
    // feeHandler.sell(address(stableToken));
    vm.recordLogs();
    feeHandler.distribute(address(stableToken));
    Vm.Log[] memory entries = vm.getRecordedLogs();
    assertEq(entries.length, 2);
  }

  function test_DoesntDistributeWhenBalanceIsZero() public {
    addAndActivateToken(address(stableToken), address(mentoSeller));
    vm.recordLogs();
    feeHandler.distribute(address(stableToken));
    Vm.Log[] memory entries = vm.getRecordedLogs();
    assertEq(entries.length, 1); // TODO figure out why this is 1 and the above is 2
  }

  function test_Distribute() public {
    fundFeeHandlerStable(1e18, address(stableToken), address(exchangeUSD));
    addAndActivateToken(address(stableToken), address(mentoSeller));
    feeHandler.sell(address(stableToken));

    feeHandler.distribute(address(stableToken));

    assertEq(stableToken.balanceOf(address(feeHandler)), 0);
    assertEq(stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
  }

  function test_distributesWithoutBurn() public {
    fundFeeHandlerStable(1e18, address(stableToken), address(exchangeUSD));
    addAndActivateToken(address(stableToken), address(mentoSeller));

    feeHandler.distribute(address(stableToken));

    assertEq(stableToken.balanceOf(address(feeHandler)), 8e17);
    assertEq(stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
  }

  function test_WhenBurnFractionIsZero() public {
    setCarbonFraction(100, 100);
    fundFeeHandlerStable(1e18, address(stableToken), address(exchangeUSD));
    addAndActivateToken(address(stableToken), address(mentoSeller));

    feeHandler.distribute(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), 0);
  }
}

contract FeeHandlerTest_Distribute_L2 is FeeHandlerTestAbstract_L2, FeeHandlerTest_Distribute {}

contract FeeHandlerTest_Distribute_WhenOtherBeneficiaries is FeeHandlerTestAbstract {
  function setUp() public {
    super.setUp();
    setCarbonFraction(20, 100);
    setMaxSlippage(address(stableToken), FIXED1);
    fundFeeHandlerStable(1e18, address(stableToken), address(exchangeUSD));
    addAndActivateToken(address(stableToken), address(mentoSeller));

    feeHandler.addOtherBeneficiary(
      op,
      (20 * 1e24) / 100, // TODO use fixidity
      "OP revenue share"
    );
  }

  function test_DistributeOP() public {
    feeHandler.sell(address(stableToken));

    assertEq(stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 0); // Make sure the balance is zero at the beginning
    feeHandler.distribute(address(stableToken));

    assertEq(stableToken.balanceOf(address(feeHandler)), 0);
    assertEq(stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
    assertEq(stableToken.balanceOf(op), 2e17);
  }

  function test_DistributeOP_WhenOneMoreBeneficiary() public {
    address otherBeneficiary = actor("otherBeneficiary");
    feeHandler.addOtherBeneficiary(
      otherBeneficiary,
      (30 * 1e24) / 100, // TODO use fixidity
      "otherBeneficiary "
    );

    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 0); // Make sure the balance is zero at the beginning
    feeHandler.distribute(address(stableToken));

    assertEq(feeHandler.getTotalFractionOfOtherBeneficiariesAndCarbon(), 7e23);
    assertEq(feeHandler.getBurnFraction(), 3e23);

    assertApproxEqAbs(stableToken.balanceOf(address(feeHandler)), 0, 10);
    assertApproxEqAbs(stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17, 1);
    assertApproxEqAbs(stableToken.balanceOf(op), 2e17, 1);
    assertApproxEqAbs(stableToken.balanceOf(otherBeneficiary), 3e17, 1);
  }
}

contract FeeHandlerTest_Distribute_WhenOtherBeneficiaries_L2 is
  FeeHandlerTestAbstract_L2,
  FeeHandlerTest_Distribute_WhenOtherBeneficiaries
{}

contract FeeHandlerTest_BurnCelo is FeeHandlerTestAbstract {
  function setUp() public {
    super.setUp();
    setCarbonFraction(20, 100);
    addAndActivateToken(address(stableToken), address(mentoSeller));
    fundFeeHandlerWithCelo();
  }

  function test_BurnsCorrectly() public {
    feeHandler.burnCelo();
    assertEq(celoToken.balanceOf(address(feeHandler)), 2e17);
    assertEq(celoToken.getBurnedAmount(), 8e17);
  }

  function test_DoesntBurnPendingDistribution() public {
    feeHandler.burnCelo();
    assertEq(celoToken.getBurnedAmount(), 8e17);
    // this is the amount pending distribution
    assertEq(celoToken.balanceOf(address(feeHandler)), 2e17);

    feeHandler.burnCelo();
    assertEq(celoToken.getBurnedAmount(), 8e17);
    // amount pending distribution should not be changed by second burn
    assertEq(celoToken.balanceOf(address(feeHandler)), 2e17);
  }

  function test_DistributesCorrectlyAfterBurn() public {
    feeHandler.burnCelo();
    assertEq(celoToken.balanceOf(address(feeHandler)), 2e17);

    feeHandler.distribute(address(celoToken));
    assertEq(celoToken.balanceOf(address(feeHandler)), 0);
    assertEq(celoToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
  }
}

contract FeeHandlerTest_BurnCelo_L2 is FeeHandlerTestAbstract_L2, FeeHandlerTest_BurnCelo {}

contract FeeHandlerTest_SellMentoTokensAbstract is FeeHandlerTestAbstract {
  function setUp() public {
    super.setUp();
    setCarbonFraction(20, 100);
    setMaxSlippage(address(stableToken), FIXED1);
  }
}

contract FeeHandlerTest_SellMentoTokensAbstract_L2 is
  FeeHandlerTestAbstract_L2,
  FeeHandlerTest_SellMentoTokensAbstract
{}

contract FeeHandlerTest_SellMentoTokens_WhenTokenEnabled is FeeHandlerTest_SellMentoTokensAbstract {
  function setUp() public {
    super.setUp();
    addAndActivateToken(address(stableToken), address(mentoSeller));
  }

  function test_Reverts_WhenFrozen() public {
    freezer.freeze(address(feeHandler));
    vm.expectRevert("can't call when contract is frozen");
    feeHandler.sell(address(stableToken));
  }

  function test_WontSellWhenBalanceLow() public {
    fundFeeHandlerStable(feeHandler.MIN_BURN(), address(stableToken), address(exchangeUSD));
    uint256 balanceBefore = stableToken.balanceOf(address(feeHandler));
    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), balanceBefore);
  }

  function resetLimit() internal {
    skip(DAY);
  }

  function test_ResetSellLimitDaily() public {
    fundFeeHandlerStable(3000, address(stableToken), address(exchangeUSD));

    feeHandler.setDailySellLimit(address(stableToken), 1000);
    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), 2000);
    resetLimit();
    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), 1000);
  }

  function test_DoesntSellWhenBiggerThanLimit() public {
    fundFeeHandlerStable(3000, address(stableToken), address(exchangeUSD));
    feeHandler.setDailySellLimit(address(stableToken), 1000);
    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), 2000);
    // selling again shouldn't do anything
    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), 2000);
  }

  function test_HitLimitDoesntAffectAccounting() public {
    fundFeeHandlerStable(3000, address(stableToken), address(exchangeUSD));
    feeHandler.setDailySellLimit(address(stableToken), 1000);

    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), 2000);

    assertEq(feeHandler.getTokenToDistribute(address(stableToken)), 600);

    resetLimit();

    feeHandler.sell(address(stableToken));
    assertEq(feeHandler.getTokenToDistribute(address(stableToken)), 600);
    assertEq(stableToken.balanceOf(address(feeHandler)), 1000);

    resetLimit();

    feeHandler.sell(address(stableToken));
    assertEq(feeHandler.getTokenToDistribute(address(stableToken)), 600);
    assertEq(stableToken.balanceOf(address(feeHandler)), 600);
  }

  function test_setDistributionAndBurnAmountsDoesntAffectBurn() public {
    fundFeeHandlerStable(3000, address(stableToken), address(exchangeUSD));
    feeHandler.setDailySellLimit(address(stableToken), 1000);

    feeHandler.setDistributionAndBurnAmounts(address(stableToken));
    feeHandler.sell(address(stableToken));

    assertEq(stableToken.balanceOf(address(feeHandler)), 2000);
    assertEq(feeHandler.getTokenToDistribute(address(stableToken)), 600);
  }

  function test_Sell_WhenOtherTokenHitLimit() public {
    fundFeeHandlerStable(3000, address(stableToken), address(exchangeUSD));
    feeHandler.setDailySellLimit(address(stableToken), 1000);
    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), 2000);
    // selling again shouldn't do anything
    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), 2000);

    // check that the daily limit of one
    // doesn't influence the other
    uint256 celoAmount = 1e18;
    celoToken.approve(address(exchangeEUR), celoAmount);
    exchangeEUR.sell(celoAmount, 0, true);
    uint256 stableAmount = 3000;
    feeHandler.setMaxSplippage(address(stableTokenEUR), FIXED1);
    stableTokenEUR.transfer(address(feeHandler), stableAmount);
    feeHandler.addToken(address(stableTokenEUR), address(mentoSeller));
    feeHandler.activateToken(address(stableTokenEUR));
    feeHandler.setDailySellLimit(address(stableTokenEUR), 1000);
    feeHandler.sell(address(stableTokenEUR));

    assertEq(stableTokenEUR.balanceOf(address(feeHandler)), 2000);
  }

  function test_WhenBurnFractionIsZero() public {
    setCarbonFraction(100, 100);
    fundFeeHandlerStable(3000, address(stableToken), address(exchangeUSD));
    feeHandler.sell(address(stableToken));

    assertEq(stableToken.balanceOf(address(feeHandler)), 3000);
  }

  function test_SellsWithMento() public {
    fundFeeHandlerStable(1e18, address(stableToken), address(exchangeUSD));
    assertEq(feeHandler.getPastBurnForToken(address(stableToken)), 0);
    uint256 expectedCeloAmount = exchangeUSD.getBuyTokenAmount(8e17, false);
    feeHandler.sell(address(stableToken));
    assertEq(feeHandler.getPastBurnForToken(address(stableToken)), 8e17);
    assertEq(stableToken.balanceOf(address(feeHandler)), 2e17);
    assertEq(feeHandler.getTokenToDistribute(address(stableToken)), 2e17);
    assertEq(feeHandler.getCeloToBeBurned(), expectedCeloAmount);
  }

  function test_Reverts_WhenNotEnoughReports() public {
    fundFeeHandlerStable(1e18, address(stableToken), address(exchangeUSD));
    mentoSeller.setMinimumReports(address(stableToken), 3);
    vm.expectRevert("Number of reports for token not enough");
    feeHandler.sell(address(stableToken));
  }

  function test_DoesntSellBalanceToDistribute() public {
    fundFeeHandlerStable(1e18, address(stableToken), address(exchangeUSD));
    feeHandler.sell(address(stableToken));
    uint256 balanceBefore = stableToken.balanceOf(address(feeHandler));
    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), balanceBefore);
  }
}

contract FeeHandlerTest_SellMentoTokens_WhenTokenEnabled_L2 is
  FeeHandlerTest_SellMentoTokensAbstract_L2,
  FeeHandlerTest_SellMentoTokens_WhenTokenEnabled
{}

contract FeeHandlerTest_SellMentoTokens_WhenTokenNotEnabled is
  FeeHandlerTest_SellMentoTokensAbstract
{
  function test_Reverts_WhenSelling() public {
    fundFeeHandlerStable(3000, address(stableToken), address(exchangeUSD));
    vm.expectRevert("Token needs to be active to sell");
    feeHandler.sell(address(stableToken));
  }
}

contract FeeHandlerTest_SellMentoTokens_WhenTokenNotEnabled_L2 is
  FeeHandlerTest_SellMentoTokensAbstract_L2,
  FeeHandlerTest_SellMentoTokens_WhenTokenNotEnabled
{}

contract FeeHandlerTest_SellNonMentoTokens is FeeHandlerTestAbstract {
  uint256 deadline;

  function setUp() public {
    super.setUp();
    setCarbonFraction(20, 100);
    setMaxSlippage(address(stableToken), FIXED1);
    setMaxSlippage(address(tokenA), FixidityLib.newFixedFraction(99, 100).unwrap());
    addAndActivateToken(address(tokenA), address(uniswapFeeHandlerSeller));
    setUpUniswap();
    setUpOracles();
  }

  function setUpUniswap() public {
    uniswapFactory = new MockUniswapV2Factory(address(0));
    bytes32 initCodePairHash = uniswapFactory.INIT_CODE_PAIR_HASH();
    uniswapRouter = new MockUniswapV2Router02(
      address(uniswapFactory),
      address(0),
      initCodePairHash
    );

    uniswapFactory2 = new MockUniswapV2Factory(address(0));
    uniswapRouter2 = new MockUniswapV2Router02(
      address(uniswapFactory2),
      address(0),
      initCodePairHash
    );
    uniswapFeeHandlerSeller.initialize(address(registry), new address[](0), new uint256[](0));
    uniswapFeeHandlerSeller.setRouter(address(tokenA), address(uniswapRouter));
  }

  modifier setUpLiquidity(uint256 toMint, uint256 toTransfer) {
    deadline = block.timestamp + 100;
    tokenA.mint(address(feeHandler), toMint);
    tokenA.mint(user, toMint);
    celoToken.transfer(user, toMint);

    vm.startPrank(user);
    tokenA.approve(address(uniswapRouter), toTransfer);
    celoToken.approve(address(uniswapRouter), toTransfer);
    uniswapRouter.addLiquidity(
      address(tokenA),
      address(celoToken),
      toTransfer,
      toTransfer,
      toTransfer,
      toTransfer,
      user,
      deadline
    );
    vm.stopPrank();
    _;
  }

  function setUpOracles() public {
    uniswapFeeHandlerSeller.setMinimumReports(address(tokenA), 1);
    mockSortedOracles.setMedianRate(address(tokenA), celoAmountForRate);
    mockSortedOracles.setNumRates(address(tokenA), 2);
  }

  function test_Reverts_WhenNotEnoughReports() public setUpLiquidity(1e19, 5e18) {
    mockSortedOracles.setNumRates(address(tokenA), 0);
    vm.expectRevert("Number of reports for token not enough");
    feeHandler.sell(address(tokenA));
    assertEq(tokenA.balanceOf(address(feeHandler)), 1e19);
  }

  function test_SellWorksWithReports() public setUpLiquidity(1e19, 5e18) {
    feeHandler.sell(address(tokenA));
    assertEq(tokenA.balanceOf(address(feeHandler)), 2e18);
  }

  function test_Reverts_WhenOracleSlippageIsHigh() public setUpLiquidity(1e19, 5e18) {
    mockSortedOracles.setMedianRate(address(tokenA), 300 * celoAmountForRate);

    vm.expectRevert("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
    feeHandler.sell(address(tokenA));
  }

  function test_UniswapTrade() public setUpLiquidity(1e19, 5e18) {
    // Make sure our uniswap mock works
    uint256 balanceBeforeA = tokenA.balanceOf(user);
    uint256 balanceBeforeCelo = celoToken.balanceOf(user);

    vm.startPrank(user);
    tokenA.approve(address(uniswapRouter), 1e18);
    address[] memory tokenAddresses = new address[](2);
    tokenAddresses[0] = address(tokenA);
    tokenAddresses[1] = address(celoToken);
    uniswapRouter.swapExactTokensForTokens(1e18, 0, tokenAddresses, user, deadline);
    vm.stopPrank();

    // simple directional check
    assertGt(balanceBeforeA, tokenA.balanceOf(user));
    assertGt(celoToken.balanceOf(user), balanceBeforeCelo);
  }

  function test_SellsNonMentoTokens() public setUpLiquidity(1e19, 5e18) {
    assertEq(tokenA.balanceOf(address(feeHandler)), 1e19);
    feeHandler.sell(address(tokenA));
    assertEq(tokenA.balanceOf(address(feeHandler)), 2e18);
  }

  function test_Reverts_WhenSlippageIsTooHigh() public setUpLiquidity(1e19, 5e18) {
    feeHandler.setMaxSplippage(address(tokenA), maxSlippage);
    vm.expectRevert("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
    feeHandler.sell(address(tokenA));
    assertEq(tokenA.balanceOf(address(feeHandler)), 1e19);
  }

  function test_TriesToGetBestRateWithManyExchanges() public setUpLiquidity(2e19, 5e18) {
    // Setup second uniswap exchange
    uniswapFeeHandlerSeller.setRouter(address(tokenA), address(uniswapRouter2));
    uint256 toTransfer2 = 1e19; // this is higher than toTransfer1 (5e18) set in modifier
    vm.startPrank(user);
    tokenA.approve(address(uniswapRouter2), toTransfer2);
    celoToken.approve(address(uniswapRouter2), toTransfer2);
    uniswapRouter2.addLiquidity(
      address(tokenA),
      address(celoToken),
      toTransfer2,
      toTransfer2,
      toTransfer2,
      toTransfer2,
      user,
      deadline
    );
    vm.stopPrank();

    address[] memory tokenAddresses = new address[](2);
    tokenAddresses[0] = address(tokenA);
    tokenAddresses[1] = address(celoToken);

    uint256 quote1before = uniswapRouter.getAmountsOut(1e18, tokenAddresses)[1];
    uint256 quote2before = uniswapRouter2.getAmountsOut(1e18, tokenAddresses)[1];

    // safety check
    assertEq(tokenA.balanceOf(address(feeHandler)), 2e19);

    feeHandler.sell(address(tokenA));

    // Exchange should have occurred on uniswap2 because it has more liquidity.
    // After the exchange, uniswap2 has less Celo liquidity than it did before,
    // so the quote for tokenA (denominated in Celo) is lower.
    uint256 quote1after = uniswapRouter.getAmountsOut(1e18, tokenAddresses)[1];
    uint256 quote2after = uniswapRouter.getAmountsOut(1e18, tokenAddresses)[1];
    assertEq(quote1before, quote1after); // uniswap1 quote should be untouched, since liquidity hasn't changed
    assertGt(quote2before, quote2after); // uniswap2 quoute should be lower, since it now has more tokenA per Celo
    assertEq(tokenA.balanceOf(address(feeHandler)), 4e18); // check that it burned
  }
}

contract FeeHandlerTest_SellNonMentoTokens_L2 is
  FeeHandlerTestAbstract_L2,
  FeeHandlerTest_SellNonMentoTokens
{}

contract FeeHandlerTest_HandleCelo is FeeHandlerTestAbstract {
  function setUp() public {
    super.setUp();
    setCarbonFraction(20, 100);
    fundFeeHandlerWithCelo();
  }

  function test_HandleCelo() public {
    feeHandler.handle(address(celoToken));
    assertEq(celoToken.getBurnedAmount(), 8e17);
    assertEq(celoToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
  }

  function test_HandleCelo_WhenThereAreMoreBeneficiaries() public {
    feeHandler.addOtherBeneficiary(
      op,
      (20 * 1e24) / 100, // TODO use fixidity
      "OP revenue share"
    );

    feeHandler.handle(address(celoToken));
    assertEq(celoToken.getBurnedAmount(), 6e17);
    assertEq(celoToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
    assertEq(celoToken.balanceOf(op), 2e17);
  }

  function test_HandleCelo_WhenThereAreMoreTwoOtherBeneficiaries() public {
    feeHandler.addOtherBeneficiary(
      op,
      (20 * 1e24) / 100, // TODO use fixidity
      "OP revenue share"
    );
    address otherBeneficiary = actor("otherBeneficiary");
    feeHandler.addOtherBeneficiary(
      otherBeneficiary,
      (30 * 1e24) / 100, // TODO use fixidity
      "otherBeneficiary "
    );

    assertEq(feeHandler.getTotalFractionOfOtherBeneficiariesAndCarbon(), 7e23);
    assertEq(feeHandler.getBurnFraction(), 3e23);

    feeHandler.handle(address(celoToken));
    assertEq(celoToken.getBurnedAmount(), 3e17);
    assertApproxEqAbs(celoToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17, 1);
    assertApproxEqAbs(celoToken.balanceOf(op), 2e17, 1);
    assertApproxEqAbs(celoToken.balanceOf(otherBeneficiary), 3e17, 1);
  }
}

contract FeeHandlerTest_HandleCelo_L2 is FeeHandlerTestAbstract_L2, FeeHandlerTest_HandleCelo {}

contract FeeHandlerTest_HandleMentoTokens is FeeHandlerTestAbstract {
  function setUp() public {
    super.setUp();
    setCarbonFraction(20, 100);
    setMaxSlippage(address(stableToken), FIXED1);
  }

  function test_Reverts_WhenTokenNotAdded() public {
    vm.expectRevert("Token needs to be active to sell");
    feeHandler.handle(address(stableToken));
  }

  function test_HandleStable() public {
    fundFeeHandlerStable(1e18, address(stableToken), address(exchangeUSD));
    addAndActivateToken(address(stableToken), address(mentoSeller));
    feeHandler.handle(address(stableToken));
    assertEq(feeHandler.getPastBurnForToken(address(stableToken)), 8e17);
    assertEq(stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
    // Number is not exactly 0.8/2 because of slippage in the Mento exchange
    assertEq(
      celoToken.balanceOf(address(0x000000000000000000000000000000000000dEaD)),
      398482170620712919
    );

    assertEq(stableToken.balanceOf(address(feeHandler)), 0);
  }
}

contract FeeHandlerTest_HandleMentoTokens_L2 is
  FeeHandlerTestAbstract_L2,
  FeeHandlerTest_HandleMentoTokens
{}

contract FeeHandlerTest_HandleAll is FeeHandlerTestAbstract {
  function setUp() public {
    super.setUp();
    setCarbonFraction(20, 100);
    setMaxSlippage(address(stableToken), FIXED1);
    setMaxSlippage(address(stableTokenEUR), FIXED1);
    feeHandler.addToken(address(stableToken), address(mentoSeller));
    feeHandler.addToken(address(stableTokenEUR), address(mentoSeller));
    fundFeeHandlerStable(1e18, address(stableToken), address(exchangeUSD));
    fundFeeHandlerStable(1e18, address(stableTokenEUR), address(exchangeEUR));
  }

  function test_BurnsWithMento() public {
    uint256 previousCeloBurn = celoToken.getBurnedAmount();
    assertEq(feeHandler.getPastBurnForToken(address(stableToken)), 0);
    assertEq(feeHandler.getPastBurnForToken(address(stableTokenEUR)), 0);

    feeHandler.handleAll();

    assertEq(feeHandler.getPastBurnForToken(address(stableToken)), 8e17);
    assertEq(feeHandler.getPastBurnForToken(address(stableTokenEUR)), 8e17);
    assertEq(stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
    assertEq(stableTokenEUR.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);

    // everything should have been burned or distributed
    assertEq(feeHandler.getTokenToDistribute(address(stableToken)), 0);
    assertEq(feeHandler.getTokenToDistribute(address(stableTokenEUR)), 0);

    // celo burn is non zero
    assertTrue(celoToken.getBurnedAmount() > previousCeloBurn);
  }
}

contract FeeHandlerTest_HandleAll_L2 is FeeHandlerTestAbstract_L2, FeeHandlerTest_HandleAll {}

contract FeeHandlerTest_Transfer is FeeHandlerTest {
  modifier mintToken(uint256 amount) {
    tokenA.mint(address(feeHandler), amount);
    _;
  }

  function test_Reverts_WhenCallerNotOwner() public mintToken(1e18) {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.transfer(address(tokenA), user, 1e18);
  }

  function test_CanTakeFundsOut() public mintToken(1e18) {
    feeHandler.transfer(address(tokenA), user, 1e18);
    assertEq(tokenA.balanceOf(user), 1e18);
  }
}

contract FeeHandlerTest_Transfer_L2 is FeeHandlerTest_L2, FeeHandlerTest_Transfer {}

contract FeeHandlerTest_SetDailySellLimit is FeeHandlerTest {
  uint256 newCeloAmountForRate;

  function setUp() public {
    super.setUp();
    newCeloAmountForRate = celoAmountForRate * 2;
  }

  function test_Reverts_WhenCallerNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(user);
    feeHandler.setDailySellLimit(address(stableToken), celoAmountForRate);
  }

  function test_SetsDailySellLimit() public {
    feeHandler.setDailySellLimit(address(stableToken), newCeloAmountForRate);
    assertEq(feeHandler.getTokenDailySellLimit(address(stableToken)), newCeloAmountForRate);
  }

  function test_Emits_DailyLimitSet() public {
    vm.expectEmit(true, true, true, true);
    emit DailyLimitSet(address(stableToken), newCeloAmountForRate);
    feeHandler.setDailySellLimit(address(stableToken), newCeloAmountForRate);
  }
}

contract FeeHandlerTest_SetDailySellLimit_L2 is
  FeeHandlerTest_L2,
  FeeHandlerTest_SetDailySellLimit
{}

contract FeeHandlerTest_SetMaxSlippage is FeeHandlerTest {
  uint256 newMaxSlipapge;

  function setUp() public {
    super.setUp();
    newMaxSlipapge = maxSlippage * 2;
  }

  function test_Reverts_WhenCallerNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(user);
    feeHandler.setMaxSplippage(address(stableToken), maxSlippage);
  }

  function test_SetsMaxSlippage() public {
    feeHandler.setMaxSplippage(address(stableToken), newMaxSlipapge);
    assertEq(feeHandler.getTokenMaxSlippage(address(stableToken)), newMaxSlipapge);
  }

  function test_Emits_MaxSlippageSet() public {
    vm.expectEmit(true, true, true, true);
    emit MaxSlippageSet(address(stableToken), maxSlippage);
    feeHandler.setMaxSplippage(address(stableToken), maxSlippage);
  }
}

contract FeeHandlerTest_SetMaxSlippage_L2 is FeeHandlerTest_L2, FeeHandlerTest_SetMaxSlippage {}

contract FeeHandlerTest_RemoveOtherBeneficiary is FeeHandlerTestAbstract {
  event BeneficiaryRemoved(address beneficiary);
  function setUp() public {
    super.setUp();
    feeHandler.addOtherBeneficiary(
      op,
      (20 * 1e24) / 100, // TODO use fixidity
      "OP revenue share"
    );
  }

  function test_removedSucsesfully() public {
    feeHandler.removeOtherBeneficiary(op);
    assertEq(feeHandler.getOtherBeneficiariesAddresses().length, 0);
    vm.expectRevert("Beneficiary not found");
    feeHandler.getOtherBeneficiariesInfo(op);

    setCarbonFraction(20, 100);
    assertEq(
      feeHandler.getTotalFractionOfOtherBeneficiariesAndCarbon(),
      0.2e24,
      "Allocation should only be carbon"
    );
  }

  function test_Emits_BeneficiaryRemoved() public {
    vm.expectEmit(true, true, true, true);
    emit BeneficiaryRemoved(op);
    feeHandler.removeOtherBeneficiary(op);
  }

  function test_Reverts_WhenCallerNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(user);
    feeHandler.removeOtherBeneficiary(op);
  }
}

contract FeeHandlerTest_RemoveOtherBeneficiary_L2 is
  FeeHandlerTestAbstract_L2,
  FeeHandlerTest_RemoveOtherBeneficiary
{}

contract FeeHandlerTest_SetBeneficiaryFraction is FeeHandlerTestAbstract {
  function setUp() public {
    super.setUp();
    feeHandler.addOtherBeneficiary(
      op,
      (20 * 1e24) / 100, // TODO use fixidity
      "OP revenue share"
    );
  }

  function test_setFractionSucsesfully() public {
    feeHandler.setBeneficiaryFraction(op, (30 * 1e24) / 100);
    (uint256 fraction, , ) = feeHandler.getOtherBeneficiariesInfo(op);
    assertEq(fraction, (30 * 1e24) / 100);
  }

  function test_WhenFractionWouldBeZero() public {
    feeHandler.setBeneficiaryFraction(op, (80 * 1e24) / 100);
  }

  function test_Emits_BeneficiaryFractionSet() public {
    vm.expectEmit(true, true, true, true);
    emit BeneficiaryFractionSet(op, (30 * 1e24) / 100);
    feeHandler.setBeneficiaryFraction(op, (30 * 1e24) / 100);
  }

  function test_Reverts_WhenCallerNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(user);
    feeHandler.setBeneficiaryFraction(op, (30 * 1e24) / 100);
  }
}

contract FeeHandlerTest_SetBeneficiaryFraction_L2 is
  FeeHandlerTestAbstract_L2,
  FeeHandlerTest_SetBeneficiaryFraction
{}

contract FeeHandlerTest_SetBeneficiaryName is FeeHandlerTestAbstract {
  function setUp() public {
    super.setUp();
    feeHandler.addOtherBeneficiary(
      op,
      (20 * 1e24) / 100, // TODO use fixidity
      "OP revenue share"
    );
  }

  function test_setNameSucsesfully() public {
    feeHandler.setBeneficiaryName(op, "OP revenue share updated");
    (, string memory name, ) = feeHandler.getOtherBeneficiariesInfo(op);
    assertEq(name, "OP revenue share updated");
  }

  function test_Reverts_WhenBeneficiaryNotFound() public {
    vm.expectRevert("Beneficiary not found");
    feeHandler.setBeneficiaryName(actor("otherBeneficiary"), "OP revenue share updated");
  }

  function test_Emits_BeneficiaryNameSet() public {
    vm.expectEmit(true, true, true, true);
    emit BeneficiaryNameSet(op, "OP revenue share updated");
    feeHandler.setBeneficiaryName(op, "OP revenue share updated");
  }

  function test_Reverts_WhenCallerNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(user);
    feeHandler.setBeneficiaryName(op, "OP revenue share updated");
  }
}

contract FeeHandlerTest_SetBeneficiaryName_L2 is
  FeeHandlerTestAbstract_L2,
  FeeHandlerTest_SetBeneficiaryName
{}
