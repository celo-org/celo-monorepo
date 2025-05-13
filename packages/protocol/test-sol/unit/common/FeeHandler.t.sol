// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";
import "@celo-contracts/common/FeeHandler.sol";
import { Constants } from "@test-sol/constants.sol";

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
import "@mento-core/test/mocks/MockSortedOracles.sol";
import "@mento-core/test/mocks/MockReserve.sol";

contract FeeHandlerTest is Test, Constants {
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
    vm.warp(YEAR); // foundry starts block.timestamp at 0, which leads to underflow errors in Uniswap contracts

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

contract FeeHandlerTest_SetBurnFraction is FeeHandlerTest {
  function test_Reverts_WhenCallerNotOwner() public {
    vm.prank(user);
    vm.expectRevert("Ownable: caller is not the owner");
    feeHandler.setBurnFraction(100);
  }

  function test_Reverts_WhenFractionsGreaterThanOne() public {
    vm.expectRevert("Burn fraction must be less than or equal to 1");
    feeHandler.setBurnFraction(FixidityLib.newFixedFraction(3, 2).unwrap());
  }

  function test_SetBurnFraction() public {
    feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
    assertEq(
      feeHandler.burnFraction(),
      FixidityLib.newFixedFraction(80, 100).unwrap(),
      "Burn fraction should be set"
    );
  }

  function test_ShouldEmitFeeBeneficiarySet() public {
    vm.expectEmit(true, true, true, true);
    emit BurnFractionSet(FixidityLib.newFixedFraction(80, 100).unwrap());
    feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
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
    feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS);
  }

  function test_ShouldEmitFeeBeneficiarySet() public {
    vm.expectEmit(true, true, true, true);
    emit FeeBeneficiarySet(EXAMPLE_BENEFICIARY_ADDRESS);
    feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS);
  }

  function test_SetsAddressCorrectly() public {
    feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS);
    assertEq(feeHandler.feeBeneficiary(), EXAMPLE_BENEFICIARY_ADDRESS);
  }
}

contract FeeHandlerTest_Distribute is FeeHandlerTest {
  modifier setUpBeneficiary() {
    feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS);
    _;
  }

  modifier activateToken() {
    feeHandler.addToken(address(stableToken), address(mentoSeller));
    feeHandler.activateToken(address(stableToken));
    _;
  }

  modifier fundFeeHandlerStable(uint256 stableAmount) {
    uint256 celoAmount = 1e18;
    celoToken.approve(address(exchangeUSD), celoAmount);
    exchangeUSD.sell(celoAmount, 0, true);
    stableToken.transfer(address(feeHandler), stableAmount);
    _;
  }

  modifier setBurnFraction() {
    feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
    _;
  }

  modifier setMaxSlippage() {
    feeHandler.setMaxSplippage(address(stableToken), FIXED1);
    _;
  }

  function test_Reverts_WhenNotActive() public setUpBeneficiary {
    vm.expectRevert("Handler has to be set to sell token");
    feeHandler.distribute(address(stableToken));
  }

  function test_Reverts_WhenFrozen() public setUpBeneficiary activateToken {
    freezer.freeze(address(feeHandler));
    vm.expectRevert("can't call when contract is frozen");
    feeHandler.distribute(address(stableToken));
  }

  function test_DoesntDistributeWhenToDistributeIsZero()
    public
    setBurnFraction
    setMaxSlippage
    setUpBeneficiary
    activateToken
    fundFeeHandlerStable(1e18)
  {
    // If we uncomment this the test should fail
    // feeHandler.sell(address(stableToken));
    vm.recordLogs();
    feeHandler.distribute(address(stableToken));
    Vm.Log[] memory entries = vm.getRecordedLogs();
    assertEq(entries.length, 0);
  }

  function test_DoesntDistributeWhenBalanceIsZero()
    public
    setBurnFraction
    setMaxSlippage
    setUpBeneficiary
    activateToken
  {
    vm.recordLogs();
    feeHandler.distribute(address(stableToken));
    Vm.Log[] memory entries = vm.getRecordedLogs();
    assertEq(entries.length, 0);
  }

  function test_Distribute()
    public
    setBurnFraction
    setMaxSlippage
    setUpBeneficiary
    activateToken
    fundFeeHandlerStable(1e18)
  {
    feeHandler.sell(address(stableToken));

    feeHandler.distribute(address(stableToken));

    assertEq(stableToken.balanceOf(address(feeHandler)), 0);
    assertEq(stableToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
  }
}

contract FeeHandlerTest_BurnCelo is FeeHandlerTest {
  modifier activateToken() {
    feeHandler.activateToken(address(celoToken)); // celoToken doesn't need to be added before activating
    _;
  }

  modifier setBurnFraction() {
    feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
    _;
  }

  modifier fundFeeHandler() {
    uint256 celoAmount = 1e18;
    celoToken.transfer(address(feeHandler), celoAmount);
    _;
  }

  function test_BurnsCorrectly() public activateToken setBurnFraction fundFeeHandler {
    feeHandler.burnCelo();
    assertEq(celoToken.balanceOf(address(feeHandler)), 2e17);
    assertEq(celoToken.getBurnedAmount(), 8e17);
  }

  function test_DoesntBurnPendingDistribution()
    public
    activateToken
    setBurnFraction
    fundFeeHandler
  {
    feeHandler.burnCelo();
    assertEq(celoToken.getBurnedAmount(), 8e17);
    // this is the amount pending distribution
    assertEq(celoToken.balanceOf(address(feeHandler)), 2e17);

    feeHandler.burnCelo();
    assertEq(celoToken.getBurnedAmount(), 8e17);
    // amount pending distribution should not be changed by second burn
    assertEq(celoToken.balanceOf(address(feeHandler)), 2e17);
  }

  function test_DistributesCorrectlyAfterBurn()
    public
    activateToken
    setBurnFraction
    fundFeeHandler
  {
    feeHandler.burnCelo();
    assertEq(celoToken.balanceOf(address(feeHandler)), 2e17);

    feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS);
    feeHandler.distribute(address(celoToken));
    assertEq(celoToken.balanceOf(address(feeHandler)), 0);
    assertEq(celoToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
  }
}

contract FeeHandlerTest_SellMentoTokens is FeeHandlerTest {
  modifier addStableToken() {
    feeHandler.addToken(address(stableToken), address(mentoSeller));
    _;
  }

  modifier fundFeeHandlerStable(uint256 stableAmount) {
    uint256 celoAmount = 1e18;
    celoToken.approve(address(exchangeUSD), celoAmount);
    exchangeUSD.sell(celoAmount, 0, true);
    stableToken.transfer(address(feeHandler), stableAmount);
    _;
  }

  modifier setBurnFraction() {
    feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
    _;
  }

  modifier setUpBeneficiary() {
    feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS);
    _;
  }

  modifier setMaxSlippage() {
    feeHandler.setMaxSplippage(address(stableToken), FIXED1);
    _;
  }

  function test_Reverts_WhenFrozen() public {
    freezer.freeze(address(feeHandler));
    vm.expectRevert("can't call when contract is frozen");
    feeHandler.sell(address(stableToken));
  }

  function test_WontSellWhenBalanceLow()
    public
    setBurnFraction
    setMaxSlippage
    addStableToken
    fundFeeHandlerStable(feeHandler.MIN_BURN())
  {
    uint256 balanceBefore = stableToken.balanceOf(address(feeHandler));
    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), balanceBefore);
  }

  function test_ResetSellLimitDaily()
    public
    setBurnFraction
    setMaxSlippage
    addStableToken
    fundFeeHandlerStable(3000)
  {
    feeHandler.setDailySellLimit(address(stableToken), 1000);
    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), 2000);
    skip(DAY);
    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), 1000);
  }

  function test_DoesntSellWhenBiggerThanLimit()
    public
    setBurnFraction
    setMaxSlippage
    addStableToken
    fundFeeHandlerStable(3000)
  {
    feeHandler.setDailySellLimit(address(stableToken), 1000);
    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), 2000);
    // selling again shouldn't do anything
    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), 2000);
  }

  function test_Reverts_WhenHandlerNotSet()
    public
    setBurnFraction
    setMaxSlippage
    fundFeeHandlerStable(3000)
  {
    vm.expectRevert("Handler has to be set to sell token");
    feeHandler.sell(address(stableToken));
  }

  function test_SellsWithMento()
    public
    setBurnFraction
    setMaxSlippage
    addStableToken
    fundFeeHandlerStable(1e18)
  {
    assertEq(feeHandler.getPastBurnForToken(address(stableToken)), 0);
    uint256 expectedCeloAmount = exchangeUSD.getBuyTokenAmount(8e17, false);
    feeHandler.sell(address(stableToken));
    assertEq(feeHandler.getPastBurnForToken(address(stableToken)), 8e17);
    assertEq(stableToken.balanceOf(address(feeHandler)), 2e17);
    assertEq(feeHandler.getTokenToDistribute(address(stableToken)), 2e17);
    assertEq(feeHandler.celoToBeBurned(), expectedCeloAmount);
  }

  function test_Reverts_WhenNotEnoughReports()
    public
    setBurnFraction
    setMaxSlippage
    addStableToken
    fundFeeHandlerStable(1e18)
  {
    mentoSeller.setMinimumReports(address(stableToken), 3);
    vm.expectRevert("Number of reports for token not enough");
    feeHandler.sell(address(stableToken));
  }

  function test_DoesntSellBalanceToDistribute()
    public
    setBurnFraction
    setMaxSlippage
    addStableToken
    fundFeeHandlerStable(1e18)
  {
    feeHandler.sell(address(stableToken));
    uint256 balanceBefore = stableToken.balanceOf(address(feeHandler));
    feeHandler.sell(address(stableToken));
    assertEq(stableToken.balanceOf(address(feeHandler)), balanceBefore);
  }
}

contract FeeHandlerTest_SellNonMentoTokens is FeeHandlerTest {
  uint256 deadline;

  modifier setMaxSlippage() {
    feeHandler.setMaxSplippage(address(stableToken), FIXED1);
    feeHandler.setMaxSplippage(address(tokenA), FixidityLib.newFixedFraction(99, 100).unwrap());
    _;
  }

  modifier setUpUniswap() {
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
    _;
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

  modifier setUpOracles() {
    uniswapFeeHandlerSeller.setMinimumReports(address(tokenA), 1);
    mockSortedOracles.setMedianRate(address(tokenA), celoAmountForRate);
    mockSortedOracles.setNumRates(address(tokenA), 2);
    _;
  }

  modifier addToken() {
    feeHandler.addToken(address(tokenA), address(uniswapFeeHandlerSeller));
    _;
  }

  modifier setBurnFraction() {
    feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
    _;
  }

  function test_Reverts_WhenNotEnoughReports()
    public
    setMaxSlippage
    setUpUniswap
    setUpLiquidity(1e19, 5e18)
    setUpOracles
    addToken
    setBurnFraction
  {
    mockSortedOracles.setNumRates(address(tokenA), 0);
    vm.expectRevert("Number of reports for token not enough");
    feeHandler.sell(address(tokenA));
    assertEq(tokenA.balanceOf(address(feeHandler)), 1e19);
  }

  function test_SellWorksWithReports()
    public
    setMaxSlippage
    setUpUniswap
    setUpLiquidity(1e19, 5e18)
    setUpOracles
    addToken
    setBurnFraction
  {
    feeHandler.sell(address(tokenA));
    assertEq(tokenA.balanceOf(address(feeHandler)), 2e18);
  }

  function test_Reverts_WhenOracleSlippageIsHigh()
    public
    setUpUniswap
    setUpLiquidity(1e19, 5e18)
    setUpOracles
    addToken
    setBurnFraction
  {
    feeHandler.setMaxSplippage(address(tokenA), FixidityLib.newFixedFraction(80, 100).unwrap());
    mockSortedOracles.setMedianRate(address(tokenA), 300 * celoAmountForRate);

    vm.expectRevert("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
    feeHandler.sell(address(tokenA));
  }

  function test_UniswapTrade()
    public
    setMaxSlippage
    setUpUniswap
    setUpLiquidity(1e19, 5e18)
    setUpOracles
    addToken
    setBurnFraction
  {
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

  function test_SellsNonMentoTokens()
    public
    setMaxSlippage
    setUpUniswap
    setUpLiquidity(1e19, 5e18)
    setUpOracles
    addToken
    setBurnFraction
  {
    assertEq(tokenA.balanceOf(address(feeHandler)), 1e19);
    feeHandler.sell(address(tokenA));
    assertEq(tokenA.balanceOf(address(feeHandler)), 2e18);
  }

  function test_Reverts_WhenSlippageIsTooHigh()
    public
    setUpUniswap
    setUpLiquidity(1e19, 5e18)
    setUpOracles
    addToken
    setBurnFraction
  {
    feeHandler.setMaxSplippage(address(tokenA), maxSlippage);
    vm.expectRevert("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
    feeHandler.sell(address(tokenA));
    assertEq(tokenA.balanceOf(address(feeHandler)), 1e19);
  }

  function test_TriesToGetBestRateWithManyExchanges()
    public
    setMaxSlippage
    setUpUniswap
    setUpLiquidity(2e19, 5e18)
    setUpOracles
    addToken
    setBurnFraction
  {
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

contract FeeHandlerTest_HandleMentoTokens is FeeHandlerTest {
  modifier setBurnFraction() {
    feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
    _;
  }

  modifier setUpBeneficiary() {
    feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS);
    _;
  }

  modifier fundFeeHandler(uint256 amount) {
    celoToken.transfer(address(feeHandler), amount);
    _;
  }

  modifier activateToken() {
    feeHandler.activateToken(address(celoToken));
    _;
  }

  function test_Reverts_WhenTokenNotAdded()
    public
    setBurnFraction
    setUpBeneficiary
    fundFeeHandler(1e18)
  {
    vm.expectRevert("Handler has to be set to sell token");
    feeHandler.handle(address(stableToken));
  }

  function test_HandleCelo() public setBurnFraction setUpBeneficiary fundFeeHandler(1e18) {
    feeHandler.handle(address(celoToken));
    assertEq(celoToken.getBurnedAmount(), 8e17);
    assertEq(celoToken.balanceOf(EXAMPLE_BENEFICIARY_ADDRESS), 2e17);
  }
}

contract FeeHandlerTest_HandleAll is FeeHandlerTest {
  modifier setBurnFraction() {
    feeHandler.setBurnFraction(FixidityLib.newFixedFraction(80, 100).unwrap());
    _;
  }

  modifier setUpBeneficiary() {
    feeHandler.setFeeBeneficiary(EXAMPLE_BENEFICIARY_ADDRESS);
    _;
  }

  modifier addTokens() {
    feeHandler.addToken(address(stableToken), address(mentoSeller));
    feeHandler.addToken(address(stableTokenEUR), address(mentoSeller));
    _;
  }

  modifier setMaxSlippage() {
    feeHandler.setMaxSplippage(address(stableToken), FIXED1);
    feeHandler.setMaxSplippage(address(stableTokenEUR), FIXED1);
    _;
  }

  modifier fundFeeHandlerStable(uint256 celoAmount, uint256 stableAmount) {
    celoToken.approve(address(exchangeUSD), celoAmount);
    celoToken.approve(address(exchangeEUR), celoAmount);
    exchangeUSD.sell(celoAmount, 0, true);
    exchangeEUR.sell(celoAmount, 0, true);
    stableToken.transfer(address(feeHandler), stableAmount);
    stableTokenEUR.transfer(address(feeHandler), stableAmount);
    _;
  }

  function test_BurnsWithMento()
    public
    setUpBeneficiary
    setBurnFraction
    setMaxSlippage
    fundFeeHandlerStable(1e18, 1e18)
    addTokens
  {
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
  function test_Reverts_WhenCallerNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(user);
    feeHandler.setDailySellLimit(address(stableToken), celoAmountForRate);
  }
}

contract FeeHandlerTest_SetMaxSlippage is FeeHandlerTest {
  function test_Reverts_WhenCallerNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(user);
    feeHandler.setMaxSplippage(address(stableToken), maxSlippage);
  }
}
