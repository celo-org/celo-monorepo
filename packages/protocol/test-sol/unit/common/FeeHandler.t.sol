// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;
pragma experimental ABIEncoderV2;

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";
import { Vm } from "forge-std-8/Vm.sol";

import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/interfaces/IFreezer.sol";
import "@celo-contracts/common/interfaces/IFreezerInitializer.sol";
import { IGoldTokenTest } from "@test-sol/unit/common/interfaces/IGoldTokenTest.sol";
import "@celo-contracts/common/interfaces/IFeeCurrencyWhitelist.sol";
import "@celo-contracts/stability/test/MockSortedOracles.sol";
import "@celo-contracts-8/stability/test/MockReserve.sol";
import "@test-sol/unit/common/mocks/MockExchange08.sol";
import "@test-sol/unit/common/mocks/MockERC20.sol";
import "@test-sol/unit/common/mocks/MockStableTokenFull.sol";
import "@test-sol/unit/common/mocks/FeeHandlerFamilyMocks08.sol";
import "@test-sol/unit/common/mocks/FreezerMocks08.sol";
import "@test-sol/unit/common/mocks/FeeCurrencyWhitelistCompile.sol";
import "@test-sol/unit/common/interfaces/IFeeHandlerTest.sol";
import "@test-sol/unit/common/interfaces/IFeeHandlerSellerTest.sol";
import "@test-sol/unit/common/mocks/MockUniswapV2_08.sol";

interface IUniswapV2FactoryTest {
  function INIT_CODE_PAIR_HASH() external view returns (bytes32);
}

interface IUniswapV2RouterTest {
  function addLiquidity(
    address tokenA,
    address tokenB,
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
  ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);
  function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external returns (uint256[] memory amounts);
  function getAmountsOut(
    uint256 amountIn,
    address[] calldata path
  ) external view returns (uint256[] memory amounts);
}

contract FeeHandlerTest is TestWithUtils08 {
  using FixidityLib for FixidityLib.Fraction;

  event BeneficiaryAdded(address beneficiary);
  event BeneficiaryFractionSet(address beneficiary, uint256 fraction);
  event BeneficiaryNameSet(address beneficiary, string name);

  IFeeHandlerTest feeHandler;

  // Deployed via deployCodeTo; different name avoids shadowing inherited celoToken from TestWithUtils08.
  IGoldTokenTest goldToken;
  MockSortedOracles mockSortedOracles;
  MockReserve08 mockReserve;

  IFreezer freezer;
  MockERC20 tokenA;

  IUniswapV2RouterTest uniswapRouter;
  IUniswapV2RouterTest uniswapRouter2;
  IUniswapV2FactoryTest uniswapFactory;
  IUniswapV2FactoryTest uniswapFactory2;

  IFeeCurrencyWhitelist feeCurrencyWhitelist;

  IFeeHandlerSellerTest mentoSeller;
  IFeeHandlerSellerTest uniswapFeeHandlerSeller;

  // 0.8-native mocks; deployed directly with new.
  MockExchange08 exchangeUSD;
  MockExchange08 exchangeEUR;
  MockStableTokenFull stableToken;
  MockStableTokenFull stableTokenEUR;

  address EXAMPLE_BENEFICIARY_ADDRESS = 0x2A486910DBC72cACcbb8d0e1439C96b03B2A4699;
  address OTHER_BENEFICIARY_ADDRESS = 0x2A486910dBc72CACCBB8D0E1439c96B03b2A4610;

  address owner = address(this);
  address user = actor("user");
  // Different name to avoid shadowing inherited celoUnreleasedTreasury from TestWithUtils08.
  address celoUnreleasedTreasuryAddr = actor("CeloUnreleasedTreasury");

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

  function setUp() public virtual override {
    super.setUp();
    vm.warp(YEAR);
    op = actor("op");

    spread = FixidityLib.newFixedFraction(3, 1000).value;
    reserveFraction = FixidityLib.newFixedFraction(5, 100).value;
    maxSlippage = FixidityLib.newFixedFraction(1, 100).value;

    address goldTokenAddress = actor("goldToken");
    deployCodeTo("GoldToken.sol", abi.encode(true), goldTokenAddress);
    goldToken = IGoldTokenTest(goldTokenAddress);

    mockReserve = new MockReserve08();

    // Deploy 0.8-native stable token mocks. Pass the exchange registry id so
    // MentoFeeHandlerSeller can look up the correct exchange for each stable token.
    stableToken = new MockStableTokenFull(keccak256(abi.encodePacked("Exchange")));
    stableTokenEUR = new MockStableTokenFull(keccak256(abi.encodePacked("ExchangeEUR")));

    address feeHandlerAddress = actor("feeHandler");
    deployCodeTo("FeeHandlerCompile", feeHandlerAddress);
    feeHandler = IFeeHandlerTest(feeHandlerAddress);

    address freezerAddress = actor("freezer");
    deployCodeTo("FreezerCompile", freezerAddress);
    freezer = IFreezer(freezerAddress);
    IFreezerInitializer(freezerAddress).initialize();

    address feeCurrencyWhitelistAddress = actor("feeCurrencyWhitelist");
    deployCodeTo("FeeCurrencyWhitelistCompile", feeCurrencyWhitelistAddress);
    feeCurrencyWhitelist = IFeeCurrencyWhitelist(feeCurrencyWhitelistAddress);

    address mentoSellerAddress = actor("mentoSeller");
    deployCodeTo("MentoFeeHandlerSellerCompile", mentoSellerAddress);
    mentoSeller = IFeeHandlerSellerTest(mentoSellerAddress);

    address uniswapSellerAddress = actor("uniswapFeeHandlerSeller");
    deployCodeTo("UniswapFeeHandlerSellerCompile", uniswapSellerAddress);
    uniswapFeeHandlerSeller = IFeeHandlerSellerTest(uniswapSellerAddress);

    tokenA = new MockERC20("Token A", "TKA", 18);

    feeCurrencyWhitelist.initialize();
    registry.setAddressFor("FeeCurrencyWhitelist", address(feeCurrencyWhitelist));
    registry.setAddressFor("Freezer", address(freezer));
    registry.setAddressFor("GoldToken", address(goldToken));
    registry.setAddressFor("CeloToken", address(goldToken));
    registry.setAddressFor("Reserve", address(mockReserve));
    registry.setAddressFor("CeloUnreleasedTreasury", celoUnreleasedTreasuryAddr);

    mockReserve.setGoldToken(address(goldToken));
    mockReserve.addToken(address(stableToken));
    mockReserve.addToken(address(stableTokenEUR));

    address[] memory tokenAddresses;
    uint256[] memory newMinimumReports;

    mentoSeller.initialize(address(registry), tokenAddresses, newMinimumReports);
    goldToken.initialize(address(registry));

    mockSortedOracles = new MockSortedOracles();
    registry.setAddressFor("SortedOracles", address(mockSortedOracles));

    mockSortedOracles.setMedianRate(address(stableToken), stableAmountForRate);
    mockSortedOracles.setMedianTimestampToNow(address(stableToken));
    mockSortedOracles.setNumRates(address(stableToken), 2);

    mockSortedOracles.setMedianRate(address(stableTokenEUR), stableAmountForRate);
    mockSortedOracles.setMedianTimestampToNow(address(stableTokenEUR));
    mockSortedOracles.setNumRates(address(stableTokenEUR), 2);

    fundReserve();

    // Deploy 0.8-native MockExchange contracts.
    exchangeUSD = new MockExchange08(true);
    exchangeEUR = new MockExchange08(true);

    registry.setAddressFor("StableToken", address(stableToken));
    registry.setAddressFor("StableTokenEUR", address(stableTokenEUR));

    exchangeUSD.initialize(
      address(registry),
      "StableToken",
      spread,
      reserveFraction,
      updateFrequency,
      minimumReports
    );

    exchangeEUR.initialize(
      address(registry),
      "StableTokenEUR",
      spread,
      reserveFraction,
      updateFrequency,
      minimumReports
    );

    registry.setAddressFor("Exchange", address(exchangeUSD));
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
    whenL2WithEpochManagerInitialization();
  }

  function fundReserve() public {
    goldToken.transfer(address(mockReserve), initialReserveBalance);
  }
}

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
    vm.expectRevert("New carbon fraction can't be greater than 1");
    feeHandler.setCarbonFraction(FixidityLib.newFixedFraction(3, 2).value);
  }

  function test_WhenOtherBeneficiaryWouldAddToOne() public {
    feeHandler.addOtherBeneficiary(op, (20 * 1e24) / 100, "OP revenue share");
    feeHandler.setCarbonFraction(FixidityLib.newFixedFraction(8, 10).value);
  }

  function test_setsCarbonFraction() public {
    feeHandler.setCarbonFraction(FixidityLib.newFixedFraction(80, 100).value);
    assertEq(
      feeHandler.getCarbonFraction(),
      FixidityLib.newFixedFraction(80, 100).value,
      "Burn fraction should be set"
    );
  }

  function test_ShouldEmitBurnFractionSet() public {
    vm.expectEmit(true, true, true, true);
    emit CarbonFractionSet(FixidityLib.newFixedFraction(80, 100).value);
    feeHandler.setCarbonFraction(FixidityLib.newFixedFraction(80, 100).value);
  }
}

contract FeeHandlerTest_changeOtherBeneficiaryAllocation is FeeHandlerTest {
  function setUp() public override {
    super.setUp();
    feeHandler.addOtherBeneficiary(op, (20 * 1e24) / 100, "OP revenue share");
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

contract FeeHandlerTestAbstract is FeeHandlerTest {
  function addAndActivateToken(address token, address handler) public {
    feeHandler.addToken(token, handler);
  }

  function setCarbonFraction(uint256 numerator, uint256 denominator) internal {
    feeHandler.setCarbonFraction(FixidityLib.newFixedFraction(numerator, denominator).value);
  }

  function fundFeeHandlerStable(
    uint256 stableAmount,
    address stableTokenAddress,
    address exchangeAddress
  ) internal {
    vm.prank(address(exchangeAddress));
    MockStableTokenFull(stableTokenAddress).mint(address(feeHandler), stableAmount);
  }

  function setMaxSlippage(address stableTokenAddress, uint256 slippage) internal {
    feeHandler.setMaxSplippage(stableTokenAddress, slippage);
  }

  function fundFeeHandlerWithCelo() public {
    uint256 celoAmount = 1e18;
    goldToken.transfer(address(feeHandler), celoAmount);
  }
}

contract FeeHandlerTest_AddOtherBeneficiary is FeeHandlerTestAbstract {
  function test_addsSucsesfully() public {
    feeHandler.addOtherBeneficiary(op, (20 * 1e24) / 100, "OP revenue share");

    assertEq(feeHandler.getOtherBeneficiariesAddresses().length, 1);
    (uint256 fraction, string memory name, ) = feeHandler.getOtherBeneficiariesInfo(op);
    assertEq(fraction, (20 * 1e24) / 100);
    assertEq(name, "OP revenue share");
  }

  function test_SetsWhenBurningFractionWouldBeZero() public {
    setCarbonFraction(20, 100);
    feeHandler.addOtherBeneficiary(op, (80 * 1e24) / 100, "OP revenue share");
    assertFalse(feeHandler.shouldBurn());
  }

  function test_Reverts_WhenaddingSameTokenTwice() public {
    feeHandler.addOtherBeneficiary(op, (80 * 1e24) / 100, "OP revenue share");
    vm.expectRevert("Beneficiary already exists");
    feeHandler.addOtherBeneficiary(op, (80 * 1e24) / 100, "OP revenue share");
  }

  function test_Reverts_WhenCallerNotOwner() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.addOtherBeneficiary(op, (80 * 1e24) / 100, "OP revenue share");
  }

  function test_Emmit() public {
    vm.expectEmit(true, true, true, true);
    emit BeneficiaryFractionSet(op, (80 * 1e24) / 100);
    vm.expectEmit(true, true, true, true);
    emit BeneficiaryNameSet(op, "OP revenue share");
    vm.expectEmit(true, true, true, true);
    emit BeneficiaryAdded(op);
    feeHandler.addOtherBeneficiary(op, (80 * 1e24) / 100, "OP revenue share");
  }
}

contract FeeHandlerTest_Distribute is FeeHandlerTestAbstract {
  function setUp() public override {
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
    assertEq(entries.length, 1);
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

contract FeeHandlerTest_Distribute_WhenOtherBeneficiaries is FeeHandlerTestAbstract {
  function setUp() public override {
    super.setUp();
    setCarbonFraction(20, 100);
    setMaxSlippage(address(stableToken), FIXED1);
    fundFeeHandlerStable(1e18, address(stableToken), address(exchangeUSD));
    addAndActivateToken(address(stableToken), address(mentoSeller));
    feeHandler.addOtherBeneficiary(op, (20 * 1e24) / 100, "OP revenue share");
  }

  function test_DistributeOP() public {
    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 0);
    feeHandler.distribute(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), 0);
    assertEq(stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
    assertEq(stableToken.balanceOf(op), 2e17);
  }

  function test_DistributeOP_WhenOneMoreBeneficiary() public {
    address otherBeneficiary = actor("otherBeneficiary");
    feeHandler.addOtherBeneficiary(otherBeneficiary, (30 * 1e24) / 100, "otherBeneficiary ");
    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 0);
    feeHandler.distribute(address(stableToken));
    assertEq(feeHandler.getTotalFractionOfOtherBeneficiariesAndCarbon(), 7e23);
    assertEq(feeHandler.getBurnFraction(), 3e23);
    assertApproxEqAbs(stableToken.balanceOf(address(feeHandler)), 0, 10);
    assertApproxEqAbs(stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17, 1);
    assertApproxEqAbs(stableToken.balanceOf(op), 2e17, 1);
    assertApproxEqAbs(stableToken.balanceOf(otherBeneficiary), 3e17, 1);
  }
}

contract FeeHandlerTest_BurnCelo is FeeHandlerTestAbstract {
  function setUp() public override {
    super.setUp();
    setCarbonFraction(20, 100);
    addAndActivateToken(address(stableToken), address(mentoSeller));
    fundFeeHandlerWithCelo();
  }

  function test_BurnsCorrectly() public {
    feeHandler.burnCelo();
    assertEq(goldToken.balanceOf(address(feeHandler)), 2e17);
    assertEq(goldToken.getBurnedAmount(), 8e17);
  }

  function test_DoesntBurnPendingDistribution() public {
    feeHandler.burnCelo();
    assertEq(goldToken.getBurnedAmount(), 8e17);
    assertEq(goldToken.balanceOf(address(feeHandler)), 2e17);
    feeHandler.burnCelo();
    assertEq(goldToken.getBurnedAmount(), 8e17);
    assertEq(goldToken.balanceOf(address(feeHandler)), 2e17);
  }

  function test_DistributesCorrectlyAfterBurn() public {
    feeHandler.burnCelo();
    assertEq(goldToken.balanceOf(address(feeHandler)), 2e17);
    feeHandler.distribute(address(goldToken));
    assertEq(goldToken.balanceOf(address(feeHandler)), 0);
    assertEq(goldToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
  }
}

contract FeeHandlerTest_SellMentoTokensAbstract is FeeHandlerTestAbstract {
  function setUp() public virtual override {
    super.setUp();
    setCarbonFraction(20, 100);
    setMaxSlippage(address(stableToken), FIXED1);
  }
}

contract FeeHandlerTest_SellMentoTokens_WhenTokenEnabled is FeeHandlerTest_SellMentoTokensAbstract {
  function setUp() public override {
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
    skip(DAY_IN_SECONDS);
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
    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), 2000);

    uint256 celoAmount = 1e18;
    goldToken.approve(address(exchangeEUR), celoAmount);
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

contract FeeHandlerTest_SellMentoTokens_WhenTokenNotEnabled is
  FeeHandlerTest_SellMentoTokensAbstract
{
  function test_Reverts_WhenSelling() public {
    fundFeeHandlerStable(3000, address(stableToken), address(exchangeUSD));
    vm.expectRevert("Token needs to be active to sell");
    feeHandler.sell(address(stableToken));
  }
}

contract FeeHandlerTest_SellNonMentoTokens is FeeHandlerTestAbstract {
  uint256 deadline;

  function setUp() public override {
    super.setUp();
    setCarbonFraction(20, 100);
    setMaxSlippage(address(stableToken), FIXED1);
    setMaxSlippage(address(tokenA), FixidityLib.newFixedFraction(99, 100).value);
    addAndActivateToken(address(tokenA), address(uniswapFeeHandlerSeller));
    setUpUniswap();
    setUpOracles();
  }

  function setUpUniswap() public {
    MockUniswapV2Factory08 factory1 = new MockUniswapV2Factory08(address(0));
    uniswapFactory = IUniswapV2FactoryTest(address(factory1));
    bytes32 initCodePairHash = uniswapFactory.INIT_CODE_PAIR_HASH();

    MockUniswapV2Router0208 router1 = new MockUniswapV2Router0208(
      address(factory1),
      address(0),
      initCodePairHash
    );
    uniswapRouter = IUniswapV2RouterTest(address(router1));

    MockUniswapV2Factory08 factory2 = new MockUniswapV2Factory08(address(0));
    uniswapFactory2 = IUniswapV2FactoryTest(address(factory2));

    MockUniswapV2Router0208 router2 = new MockUniswapV2Router0208(
      address(factory2),
      address(0),
      factory2.INIT_CODE_PAIR_HASH()
    );
    uniswapRouter2 = IUniswapV2RouterTest(address(router2));

    uniswapFeeHandlerSeller.initialize(address(registry), new address[](0), new uint256[](0));
    uniswapFeeHandlerSeller.setRouter(address(tokenA), address(uniswapRouter));
  }

  modifier setUpLiquidity(uint256 toMint, uint256 toTransfer) {
    deadline = block.timestamp + 100;
    tokenA.mint(address(feeHandler), toMint);
    tokenA.mint(user, toMint);
    goldToken.transfer(user, toMint);

    vm.startPrank(user);
    tokenA.approve(address(uniswapRouter), toTransfer);
    goldToken.approve(address(uniswapRouter), toTransfer);
    uniswapRouter.addLiquidity(
      address(tokenA),
      address(goldToken),
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
    uint256 balanceBeforeA = tokenA.balanceOf(user);
    uint256 balanceBeforeCelo = goldToken.balanceOf(user);
    vm.startPrank(user);
    tokenA.approve(address(uniswapRouter), 1e18);
    address[] memory tokenAddresses = new address[](2);
    tokenAddresses[0] = address(tokenA);
    tokenAddresses[1] = address(goldToken);
    uniswapRouter.swapExactTokensForTokens(1e18, 0, tokenAddresses, user, deadline);
    vm.stopPrank();
    assertGt(balanceBeforeA, tokenA.balanceOf(user));
    assertGt(goldToken.balanceOf(user), balanceBeforeCelo);
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
    uniswapFeeHandlerSeller.setRouter(address(tokenA), address(uniswapRouter2));
    uint256 toTransfer2 = 1e19;
    vm.startPrank(user);
    tokenA.approve(address(uniswapRouter2), toTransfer2);
    goldToken.approve(address(uniswapRouter2), toTransfer2);
    uniswapRouter2.addLiquidity(
      address(tokenA),
      address(goldToken),
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
    tokenAddresses[1] = address(goldToken);

    uint256 quote1before = uniswapRouter.getAmountsOut(1e18, tokenAddresses)[1];
    uint256 quote2before = uniswapRouter2.getAmountsOut(1e18, tokenAddresses)[1];

    assertEq(tokenA.balanceOf(address(feeHandler)), 2e19);
    feeHandler.sell(address(tokenA));

    uint256 quote1after = uniswapRouter.getAmountsOut(1e18, tokenAddresses)[1];
    uint256 quote2after = uniswapRouter.getAmountsOut(1e18, tokenAddresses)[1];
    assertEq(quote1before, quote1after);
    assertGt(quote2before, quote2after);
    assertEq(tokenA.balanceOf(address(feeHandler)), 4e18);
  }
}

contract FeeHandlerTest_HandleCelo is FeeHandlerTestAbstract {
  function setUp() public override {
    super.setUp();
    setCarbonFraction(20, 100);
    fundFeeHandlerWithCelo();
  }

  function test_HandleCelo() public {
    feeHandler.handle(address(goldToken));
    assertEq(goldToken.getBurnedAmount(), 8e17);
    assertEq(goldToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
  }

  function test_HandleCelo_WhenThereAreMoreBeneficiaries() public {
    feeHandler.addOtherBeneficiary(op, (20 * 1e24) / 100, "OP revenue share");
    feeHandler.handle(address(goldToken));
    assertEq(goldToken.getBurnedAmount(), 6e17);
    assertEq(goldToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
    assertEq(goldToken.balanceOf(op), 2e17);
  }

  function test_HandleCelo_WhenThereAreMoreTwoOtherBeneficiaries() public {
    feeHandler.addOtherBeneficiary(op, (20 * 1e24) / 100, "OP revenue share");
    address otherBeneficiary = actor("otherBeneficiary");
    feeHandler.addOtherBeneficiary(otherBeneficiary, (30 * 1e24) / 100, "otherBeneficiary ");
    assertEq(feeHandler.getTotalFractionOfOtherBeneficiariesAndCarbon(), 7e23);
    assertEq(feeHandler.getBurnFraction(), 3e23);
    feeHandler.handle(address(goldToken));
    assertEq(goldToken.getBurnedAmount(), 3e17);
    assertApproxEqAbs(goldToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17, 1);
    assertApproxEqAbs(goldToken.balanceOf(op), 2e17, 1);
    assertApproxEqAbs(goldToken.balanceOf(otherBeneficiary), 3e17, 1);
  }
}

contract FeeHandlerTest_HandleMentoTokens is FeeHandlerTestAbstract {
  function setUp() public override {
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
      goldToken.balanceOf(address(0x000000000000000000000000000000000000dEaD)),
      398482170620712919
    );
    assertEq(stableToken.balanceOf(address(feeHandler)), 0);
  }
}

contract FeeHandlerTest_HandleAll is FeeHandlerTestAbstract {
  function setUp() public override {
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
    uint256 previousCeloBurn = goldToken.getBurnedAmount();
    assertEq(feeHandler.getPastBurnForToken(address(stableToken)), 0);
    assertEq(feeHandler.getPastBurnForToken(address(stableTokenEUR)), 0);
    feeHandler.handleAll();
    assertEq(feeHandler.getPastBurnForToken(address(stableToken)), 8e17);
    assertEq(feeHandler.getPastBurnForToken(address(stableTokenEUR)), 8e17);
    assertEq(stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
    assertEq(stableTokenEUR.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
    assertEq(feeHandler.getTokenToDistribute(address(stableToken)), 0);
    assertEq(feeHandler.getTokenToDistribute(address(stableTokenEUR)), 0);
    assertTrue(goldToken.getBurnedAmount() > previousCeloBurn);
  }
}

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

contract FeeHandlerTest_SetDailySellLimit is FeeHandlerTest {
  uint256 newCeloAmountForRate;

  function setUp() public override {
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

contract FeeHandlerTest_SetMaxSlippage is FeeHandlerTest {
  uint256 newMaxSlipapge;

  function setUp() public override {
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

contract FeeHandlerTest_RemoveOtherBeneficiary is FeeHandlerTestAbstract {
  event BeneficiaryRemoved(address beneficiary);

  function setUp() public override {
    super.setUp();
    feeHandler.addOtherBeneficiary(op, (20 * 1e24) / 100, "OP revenue share");
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

contract FeeHandlerTest_SetBeneficiaryFraction is FeeHandlerTestAbstract {
  function setUp() public override {
    super.setUp();
    feeHandler.addOtherBeneficiary(op, (20 * 1e24) / 100, "OP revenue share");
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

contract FeeHandlerTest_SetBeneficiaryName is FeeHandlerTestAbstract {
  function setUp() public override {
    super.setUp();
    feeHandler.addOtherBeneficiary(op, (20 * 1e24) / 100, "OP revenue share");
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
