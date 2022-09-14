// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test, console2 as console } from "celo-foundry/Test.sol";

import { IReserve } from "contracts/stability/interfaces/IReserve.sol";
import { BiPoolManager } from "contracts/stability/BiPoolManager.sol";
import { IBiPoolManager } from "contracts/stability/interfaces/IBiPoolManager.sol";
import { IExchangeProvider } from "contracts/stability/interfaces/IExchangeProvider.sol";
import { ISortedOracles } from "contracts/stability/interfaces/ISortedOracles.sol";
import { IPricingModule } from "contracts/stability/interfaces/IPricingModule.sol";

import { MockReserve } from "contracts/stability/test/MockReserve.sol";
import { MockERC20 } from "contracts/stability/test/MockERC20.sol";
import { MockPricingModule } from "contracts/stability/test/MockPricingModule.sol";
import { MockSortedOracles } from "contracts/stability/test/MockSortedOracles.sol";

import { FixidityLib } from "contracts/common/FixidityLib.sol";

// forge test --match-contract BiPoolManager -vvv
contract BiPoolManagerTest is Test {
  using FixidityLib for FixidityLib.Fraction;

  /* ------- Events from IBiPoolManager ------- */

  event ExchangeCreated(
    bytes32 indexed exchangeId,
    address indexed asset0,
    address indexed asset1,
    address pricingModule
  );
  event ExchangeDestroyed(
    bytes32 indexed exchangeId,
    address indexed asset0,
    address indexed asset1,
    address pricingModule
  );
  event BrokerUpdated(address indexed newBroker);
  event ReserveUpdated(address indexed newReserve);
  event SortedOraclesUpdated(address indexed newSortedOracles);
  event BucketsUpdated(bytes32 indexed exchangeId, uint256 bucket0, uint256 bucket1);

  /* ------------------------------------------- */

  address deployer;
  address notDeployer;
  address broker;

  MockERC20 cUSD;
  MockERC20 cEUR;
  MockERC20 USDCet;
  MockERC20 CELO;

  IPricingModule constantProduct;
  MockSortedOracles sortedOracles;

  MockReserve reserve;
  BiPoolManager biPoolManager;

  function newMockERC20(string memory name, string memory symbol)
    internal
    returns (MockERC20 token)
  {
    token = new MockERC20(name, symbol);
    vm.label(address(token), symbol);
  }

  function setUp() public {
    vm.warp(60 * 60 * 24 * 30); // if we start at now == 0 we get some underflows
    deployer = actor("deployer");
    notDeployer = actor("notDeployer");
    broker = actor("broker");

    cUSD = newMockERC20("Celo Dollar", "cUSD");
    cEUR = newMockERC20("Celo Euro", "cEUR");
    USDCet = newMockERC20("Portal USDC", "USDCet");
    CELO = newMockERC20("CELO", "CELO");

    constantProduct = new MockPricingModule("ConstantProduct");
    sortedOracles = new MockSortedOracles();

    reserve = new MockReserve();
    biPoolManager = new BiPoolManager(true);

    vm.mockCall(
      address(reserve),
      abi.encodeWithSelector(reserve.isStableAsset.selector, address(cUSD)),
      abi.encode(true)
    );

    vm.mockCall(
      address(reserve),
      abi.encodeWithSelector(reserve.isStableAsset.selector, address(cEUR)),
      abi.encode(true)
    );

    vm.mockCall(
      address(reserve),
      abi.encodeWithSelector(reserve.isCollateralAsset.selector, address(USDCet)),
      abi.encode(true)
    );

    vm.mockCall(
      address(reserve),
      abi.encodeWithSelector(reserve.isCollateralAsset.selector, address(CELO)),
      abi.encode(true)
    );

    changePrank(deployer);

    biPoolManager.initialize(
      broker,
      IReserve(address(reserve)),
      ISortedOracles(address(sortedOracles))
    );
  }

  function mockOracleRate(address target, uint256 rateNumerator) internal {
    sortedOracles.setMedianRate(target, rateNumerator);
  }

  function createExchange(MockERC20 asset0, MockERC20 asset1) internal returns (bytes32) {
    return createExchange(asset0, asset1, IPricingModule(constantProduct));
  }

  function createExchange(MockERC20 asset0, MockERC20 asset1, IPricingModule pricingModule)
    internal
    returns (bytes32 exchangeId)
  {
    return createExchange(asset0, asset1, pricingModule, address(asset0));
  }

  function createExchange(
    MockERC20 asset0,
    MockERC20 asset1,
    IPricingModule pricingModule,
    address oracleReportTarget
  ) internal returns (bytes32 exchangeId) {
    return
      createExchange(
        asset0,
        asset1,
        pricingModule,
        oracleReportTarget,
        FixidityLib.wrap(0.1 * 1e24), // spread
        1e26, // bucket0TargetSize
        FixidityLib.wrap(0.2 * 1e24) // bucket0MaxFraction
      );
  }

  function createExchange(
    MockERC20 asset0,
    MockERC20 asset1,
    IPricingModule pricingModule,
    address oracleReportTarget,
    FixidityLib.Fraction memory spread,
    uint256 bucket0TargetSize,
    FixidityLib.Fraction memory bucket0MaxFraction
  ) internal returns (bytes32 exchangeId) {
    BiPoolManager.PoolExchange memory exchange;
    exchange.asset0 = address(asset0);
    exchange.asset1 = address(asset1);
    exchange.pricingModule = pricingModule;

    BiPoolManager.PoolConfig memory config;
    config.oracleReportTarget = oracleReportTarget;
    config.bucket0TargetSize = bucket0TargetSize;
    config.bucket0MaxFraction = bucket0MaxFraction;
    config.bucketUpdateFrequency = 60 * 5; // 5 minutes
    config.minimumReports = 5;
    config.spread = spread;

    exchange.config = config;

    return biPoolManager.createExchange(exchange);
  }

  function mockGetAmountIn(
    bytes32 _exchangeId,
    address tokenIn,
    uint256 amountIn,
    uint256 amountOut
  ) internal {
    BiPoolManager.PoolExchange memory exchange = biPoolManager.getPoolExchange(_exchangeId);
    uint256 bucketIn;
    uint256 bucketOut;

    if (tokenIn == exchange.asset0) {
      bucketIn = exchange.bucket0;
      bucketOut = exchange.bucket1;
    } else {
      bucketIn = exchange.bucket1;
      bucketOut = exchange.bucket0;
    }

    vm.mockCall(
      address(constantProduct),
      abi.encodeWithSelector(
        constantProduct.getAmountIn.selector,
        bucketIn,
        bucketOut,
        exchange.config.spread.unwrap(),
        amountOut
      ),
      abi.encode(amountIn)
    );
  }

  function mockGetAmountOut(
    bytes32 _exchangeId,
    address tokenIn,
    uint256 amountIn,
    uint256 amountOut
  ) internal {
    BiPoolManager.PoolExchange memory exchange = biPoolManager.getPoolExchange(_exchangeId);
    uint256 bucketIn;
    uint256 bucketOut;

    if (tokenIn == exchange.asset0) {
      bucketIn = exchange.bucket0;
      bucketOut = exchange.bucket1;
    } else {
      bucketIn = exchange.bucket1;
      bucketOut = exchange.bucket0;
    }

    vm.mockCall(
      address(constantProduct),
      abi.encodeWithSelector(
        constantProduct.getAmountOut.selector,
        bucketIn,
        bucketOut,
        exchange.config.spread.unwrap(),
        amountIn
      ),
      abi.encode(amountOut)
    );
  }
}

contract BiPoolManagerTest_initilizerSettersGetters is BiPoolManagerTest {
  /* ---------- Initilizer ---------- */

  function test_initilize_shouldSetOwner() public {
    assertEq(biPoolManager.owner(), deployer);
  }

  function test_initilize_shouldSetBroker() public {
    assertEq(biPoolManager.broker(), broker);
  }

  function test_initilize_shouldSetReserve() public {
    assertEq(address(biPoolManager.reserve()), address(reserve));
  }

  function test_initilize_shouldSetSortedOracles() public {
    assertEq(address(biPoolManager.sortedOracles()), address(sortedOracles));
  }

  /* ---------- Setters ---------- */

  function test_setBroker_whenSenderIsNotOwner_shouldRevert() public {
    changePrank(notDeployer);
    vm.expectRevert("Ownable: caller is not the owner");
    biPoolManager.setBroker(address(0));
  }

  function test_setBroker_whenAddressIsZero_shouldRevert() public {
    vm.expectRevert("Broker address must be set");
    biPoolManager.setBroker(address(0));
  }

  function test_setBroker_whenSenderIsOwner_shouldUpdateAndEmit() public {
    address newBroker = actor("newBroker");
    vm.expectEmit(true, true, true, true);
    emit BrokerUpdated(newBroker);

    biPoolManager.setBroker(newBroker);

    assertEq(biPoolManager.broker(), newBroker);
  }

  function test_setReserve_whenSenderIsNotOwner_shouldRevert() public {
    changePrank(notDeployer);
    vm.expectRevert("Ownable: caller is not the owner");
    biPoolManager.setReserve(IReserve(address(0)));
  }

  function test_setReserve_whenAddressIsZero_shouldRevert() public {
    vm.expectRevert("Reserve address must be set");
    biPoolManager.setReserve(IReserve(address(0)));
  }

  function test_setReserve_whenSenderIsOwner_shouldUpdateAndEmit() public {
    address newReserve = actor("newReserve");
    vm.expectEmit(true, true, true, true);
    emit ReserveUpdated(newReserve);

    biPoolManager.setReserve(IReserve(newReserve));

    assertEq(address(biPoolManager.reserve()), newReserve);
  }

  function test_setSortedOracles_whenSenderIsNotOwner_shouldRevert() public {
    changePrank(notDeployer);
    vm.expectRevert("Ownable: caller is not the owner");
    biPoolManager.setSortedOracles(ISortedOracles(address(0)));
  }

  function test_setSortedOracles_whenAddressIsZero_shouldRevert() public {
    vm.expectRevert("SortedOracles address must be set");
    biPoolManager.setSortedOracles(ISortedOracles(address(0)));
  }

  function test_setSortedOracles_whenSenderIsOwner_shouldUpdateAndEmit() public {
    address newSortedOracles = actor("newSortedOracles");
    vm.expectEmit(true, true, true, true);
    emit SortedOraclesUpdated(newSortedOracles);

    biPoolManager.setSortedOracles(ISortedOracles(newSortedOracles));

    assertEq(address(biPoolManager.sortedOracles()), newSortedOracles);
  }

  /* ---------- Getters ---------- */

  function testFail_getPoolExchange_whenExchangeDoesNotExist_shouldRevert() public {
    bytes32 exchangeId = keccak256(
      abi.encodePacked(cUSD.symbol(), USDCet.symbol(), constantProduct.name())
    );

    biPoolManager.getPoolExchange(exchangeId);
  }

  function test_getPoolExchange_whenPoolExists_shouldReturnPool() public {
    mockOracleRate(address(cUSD), 1e24);
    bytes32 exchangeId = createExchange(cUSD, USDCet);
    BiPoolManager.PoolExchange memory existingExchange = biPoolManager.getPoolExchange(exchangeId);
    assertEq(existingExchange.asset0, address(cUSD));
    assertEq(existingExchange.asset1, address(USDCet));
  }
}

contract BiPoolManagerTest_createExchange is BiPoolManagerTest {
  function test_createExchange_whenNotCalledByOwner_shouldRevert() public {
    BiPoolManager.PoolExchange memory newexchange;
    changePrank(notDeployer);

    vm.expectRevert("Ownable: caller is not the owner");
    biPoolManager.createExchange(newexchange);
  }

  function test_createExchange_whenPoolWithIdExists_shouldRevert() public {
    mockOracleRate(address(cUSD), 1e24);
    createExchange(cUSD, USDCet);

    vm.expectRevert("An exchange with the specified assets and exchange exists");
    createExchange(cUSD, USDCet);
  }

  function test_createExchange_whenAsset0IsNotRegistered_shouldRevert() public {
    MockERC20 nonReserveStable = newMockERC20("Non Reserve Stable Asset", "NRSA");
    vm.expectRevert("asset0 must be a stable registered with the reserve");
    createExchange(nonReserveStable, CELO);
  }

  function test_createExchange_whenAsset0IsCollateral_shouldRevert() public {
    vm.expectRevert("asset0 must be a stable registered with the reserve");
    createExchange(USDCet, CELO);
  }

  function test_createExchange_whenAsset1IsNotRegistered_shouldRevert() public {
    MockERC20 nonReserveCollateral = newMockERC20("Non Reserve Collateral Asset", "NRCA");
    vm.expectRevert("asset1 must be a stable or collateral registered with the reserve");
    createExchange(cUSD, nonReserveCollateral);
  }

  function test_createExchange_whenBucket0MaxFractionIsZero_shouldRevert() public {
    vm.expectRevert("bucket0MaxFraction must be greater than 0");
    createExchange(
      cUSD,
      CELO,
      constantProduct,
      address(cUSD),
      FixidityLib.wrap(0.1 * 1e24), // spread
      1e24, // bucket0TargetSize
      FixidityLib.wrap(0) // bucket0MaxFraction
    );
  }

  function test_createExchange_whenBucket0MaxFractionIsOne_shouldRevert() public {
    vm.expectRevert("bucket0MaxFraction must be smaller than 1");
    createExchange(
      cUSD,
      CELO,
      constantProduct,
      address(cUSD),
      FixidityLib.wrap(0.1 * 1e24), // spread
      1e24, // bucket0TargetSize
      FixidityLib.wrap(1 * 1e24) // bucket0MaxFraction
    );
  }

  function test_createExchange_whenMentoExchangeIsNotSet_shouldRevert() public {
    vm.expectRevert("pricingModule must be set");
    createExchange(cUSD, CELO, IPricingModule(address(0)));
  }

  function test_createExchange_whenAsset0IsNotSet_shouldRevert() public {
    vm.expectRevert("asset0 must be set");
    createExchange(MockERC20(address(0)), CELO);
  }

  function test_createExchange_whenAsset1IsNotSet_shouldRevert() public {
    vm.expectRevert("asset1 must be set");
    createExchange(cUSD, MockERC20(address(0)));
  }

  function test_createExchange_whenOracleReportTargetIsNotSet_shouldRevert() public {
    vm.expectRevert("oracleReportTarget must be set");
    createExchange(cUSD, CELO, constantProduct, address(0));
  }

  function test_createExchange_whenSpreadNotLTEOne_shouldRevert() public {
    vm.expectRevert("Spread must be less than or equal to 1");
    createExchange(
      cUSD,
      CELO,
      constantProduct,
      address(cUSD),
      FixidityLib.wrap(2 * 1e24), // spread
      1e26, // bucket0TargetSize
      FixidityLib.wrap(0.1 * 1e24) // bucket0MaxFraction
    );
  }

  function test_createExchange_whenInfoIsValid_shouldUpdateMappingAndEmit() public {
    bytes32 exchangeId = keccak256(
      abi.encodePacked(cUSD.symbol(), CELO.symbol(), constantProduct.name())
    );

    mockOracleRate(address(cUSD), 2 * 1e24);
    vm.expectEmit(true, true, true, false);
    emit ExchangeCreated(exchangeId, address(cUSD), address(CELO), address(constantProduct));
    createExchange(cUSD, CELO);

    IExchangeProvider.Exchange[] memory exchanges = biPoolManager.getExchanges();
    assertEq(exchanges.length, 1);
    assertEq(exchanges[0].exchangeId, exchangeId);
  }

  function test_createExchange_whenInfoIsValid_setsBucketSizesCorrectly() public {
    mockOracleRate(address(cUSD), 2 * 1e24); // 1 CELO == 2 cUSD
    bytes32 exchangeId = createExchange(
      cUSD,
      CELO,
      constantProduct,
      address(cUSD),
      FixidityLib.wrap(0.1 * 1e24), // spread
      1e24, // bucket0TargetSize
      FixidityLib.wrap(0.1 * 1e24) // bucket0MaxFraction
    );

    BiPoolManager.PoolExchange memory exchange = biPoolManager.getPoolExchange(exchangeId);
    assertEq(exchange.bucket0, 1e24);
    assertEq(exchange.bucket1, 5e23); // exchange.bucket0 / 2
  }
}

contract BiPoolManagerTest_destroyExchange is BiPoolManagerTest {
  function test_destroyExchange_whenSenderIsNotOwner_shouldRevert() public {
    changePrank(notDeployer);
    vm.expectRevert("Ownable: caller is not the owner");
    biPoolManager.destroyExchange(0x0, 0);
  }

  function test_destroyExchange_whenNoExchangesExist_shouldRevert() public {
    vm.expectRevert("exchangeIdIndex not in range");
    biPoolManager.destroyExchange(0x0, 0);
  }

  function test_destroyExchange_whenExchangeExistsButTheIdIsWrong_shouldRevert() public {
    mockOracleRate(address(cUSD), 2e24);
    createExchange(cUSD, USDCet);
    vm.expectRevert("exchangeId at index doesn't match");
    biPoolManager.destroyExchange(0x0, 0);
  }

  function test_destroyExchange_whenExchangeExistsButTheIndexIsTooLarge_shouldRevert() public {
    mockOracleRate(address(cUSD), 2e24);
    createExchange(cUSD, USDCet);
    vm.expectRevert("exchangeIdIndex not in range");
    biPoolManager.destroyExchange(0x0, 1);
  }

  function test_destroyExchange_whenExchangeExists_shouldUpdateAndEmit() public {
    mockOracleRate(address(cUSD), 2e24);
    bytes32 exchangeId = createExchange(cUSD, USDCet);
    vm.expectEmit(true, true, true, true);
    emit ExchangeDestroyed(exchangeId, address(cUSD), address(USDCet), address(constantProduct));
    biPoolManager.destroyExchange(exchangeId, 0);
  }

  function test_destroyExchange_whenMultipleExchangesExist_shouldUpdateTheIdList() public {
    mockOracleRate(address(cUSD), 2e24);
    bytes32 exchangeId0 = createExchange(cUSD, USDCet);
    bytes32 exchangeId1 = createExchange(cUSD, CELO);

    vm.expectEmit(true, true, true, true);
    emit ExchangeDestroyed(exchangeId0, address(cUSD), address(USDCet), address(constantProduct));
    biPoolManager.destroyExchange(exchangeId0, 0);

    IExchangeProvider.Exchange[] memory exchanges = biPoolManager.getExchanges();
    assertEq(exchanges.length, 1);
    assertEq(exchanges[0].exchangeId, exchangeId1);
  }
}

contract BiPoolManagerTest_withExchange is BiPoolManagerTest {
  bytes32 exchangeId;

  function setUp() public {
    super.setUp();

    mockOracleRate(address(cUSD), 2e24);
    exchangeId = createExchange(cUSD, CELO);
  }
}

contract BiPoolManagerTest_quote is BiPoolManagerTest_withExchange {
  /* ---------- getAmountOut ---------- */
  function test_getAmountOut_whenExchangeDoesntExist_itReverts() public {
    vm.expectRevert("An exchange with the specified id does not exist");
    biPoolManager.getAmountOut(0x0, address(0), address(0), 1e24);
  }

  function test_getAmountOut_whenTokenInNotInexchange_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match exchange");
    biPoolManager.getAmountOut(exchangeId, address(cEUR), address(cUSD), 1e24);
  }

  function test_getAmountOut_whenTokenOutNotInexchange_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match exchange");
    biPoolManager.getAmountOut(exchangeId, address(cUSD), address(cEUR), 1e24);
  }

  function test_getAmountOut_whenTokenInEqualsTokenOut_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match exchange");
    biPoolManager.getAmountOut(exchangeId, address(cUSD), address(cUSD), 1e24);
  }

  function test_getAmountOut_whenTokenInIsAsset0_itDelegatesToThePricingModule() public {
    uint256 amountIn = 1e24;
    uint256 mockAmountOut = 0.5 * 1e24;

    mockGetAmountOut(exchangeId, address(cUSD), amountIn, mockAmountOut);
    uint256 amountOut = biPoolManager.getAmountOut(
      exchangeId,
      address(cUSD),
      address(CELO),
      amountIn
    );
    assertEq(amountOut, mockAmountOut);
  }

  function test_getAmountOut_whenTokenInIsAsset1_itDelegatesToThePricingModule() public {
    uint256 amountIn = 1e24;
    uint256 mockAmountOut = 0.5 * 1e24;

    mockGetAmountOut(exchangeId, address(CELO), amountIn, mockAmountOut);
    uint256 amountOut = biPoolManager.getAmountOut(
      exchangeId,
      address(CELO),
      address(cUSD),
      amountIn
    );
    assertEq(amountOut, mockAmountOut);
  }

  /* ---------- getAmountIn ---------- */

  function test_getAmountIn_whenExchangeDoesntExist_itReverts() public {
    vm.expectRevert("An exchange with the specified id does not exist");
    biPoolManager.getAmountIn(0x0, address(0), address(0), 1e24);
  }

  function test_getAmountIn_whenTokenInNotInexchange_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match exchange");
    biPoolManager.getAmountIn(exchangeId, address(cEUR), address(cUSD), 1e24);
  }

  function test_getAmountIn_whenTokenOutNotInexchange_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match exchange");
    biPoolManager.getAmountIn(exchangeId, address(cUSD), address(cEUR), 1e24);
  }

  function test_getAmountIn_whenTokenInEqualsTokenOut_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match exchange");
    biPoolManager.getAmountIn(exchangeId, address(cUSD), address(cUSD), 1e24);
  }

  function test_getAmountIn_whenTokenInIsAsset0_itDelegatesToThePricingModule() public {
    uint256 amountOut = 1e24;
    uint256 mockAmountIn = 0.5 * 1e24;

    mockGetAmountIn(exchangeId, address(cUSD), mockAmountIn, amountOut);
    uint256 amountIn = biPoolManager.getAmountIn(
      exchangeId,
      address(cUSD),
      address(CELO),
      amountOut
    );
    assertEq(amountIn, mockAmountIn);
  }

  function test_getAmountIn_whenTokenInIsAsset1_itDelegatesToThePricingModule() public {
    uint256 amountOut = 1e24;
    uint256 mockAmountIn = 0.5 * 1e24;

    mockGetAmountIn(exchangeId, address(CELO), mockAmountIn, amountOut);
    uint256 amountIn = biPoolManager.getAmountIn(
      exchangeId,
      address(CELO),
      address(cUSD),
      amountOut
    );
    assertEq(amountIn, mockAmountIn);
  }
}

contract BiPoolManagerTest_swap is BiPoolManagerTest_withExchange {
  function setUp() public {
    super.setUp();
    changePrank(broker);
  }

  /* ---------- swapIn ---------- */
  function test_swapIn_whenNotBroker_itReverts() public {
    changePrank(deployer);
    vm.expectRevert("Caller is not the Broker");
    biPoolManager.swapIn(0x0, address(0), address(0), 1e24);
  }

  function test_swapIn_whenExchangeDoesntExist_itReverts() public {
    vm.expectRevert("An exchange with the specified id does not exist");
    biPoolManager.swapIn(0x0, address(0), address(0), 1e24);
  }

  function test_swapIn_whenTokenInNotInexchange_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match exchange");
    biPoolManager.swapIn(exchangeId, address(cEUR), address(cUSD), 1e24);
  }

  function test_swapIn_whenTokenOutNotInexchange_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match exchange");
    biPoolManager.swapIn(exchangeId, address(cUSD), address(cEUR), 1e24);
  }

  function test_swapIn_whenTokenInEqualsTokenOut_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match exchange");
    biPoolManager.swapIn(exchangeId, address(cUSD), address(cUSD), 1e24);
  }

  function test_swapIn_whenTokenInIsAsset0_itDelegatesToThePricingModule() public {
    BiPoolManager.PoolExchange memory exchange = biPoolManager.getPoolExchange(exchangeId);

    uint256 amountIn = 1e24;
    uint256 mockAmountOut = 0.5 * 1e24;

    mockGetAmountOut(exchangeId, address(cUSD), amountIn, mockAmountOut);
    uint256 amountOut = biPoolManager.swapIn(exchangeId, address(cUSD), address(CELO), amountIn);

    BiPoolManager.PoolExchange memory exchangeAfter = biPoolManager.getPoolExchange(exchangeId);
    assertEq(amountOut, mockAmountOut);
    assertEq(exchangeAfter.bucket0, exchange.bucket0 + amountIn);
    assertEq(exchangeAfter.bucket1, exchange.bucket1 - amountOut);
  }

  function test_swapIn_whenTokenInIsAsset1_itDelegatesToThePricingModule() public {
    BiPoolManager.PoolExchange memory exchange = biPoolManager.getPoolExchange(exchangeId);

    uint256 amountIn = 1e24;
    uint256 mockAmountOut = 0.5 * 1e24;

    mockGetAmountOut(exchangeId, address(CELO), amountIn, mockAmountOut);
    uint256 amountOut = biPoolManager.swapIn(exchangeId, address(CELO), address(cUSD), amountIn);

    BiPoolManager.PoolExchange memory exchangeAfter = biPoolManager.getPoolExchange(exchangeId);
    assertEq(amountOut, mockAmountOut);
    assertEq(exchangeAfter.bucket0, exchange.bucket0 - amountOut);
    assertEq(exchangeAfter.bucket1, exchange.bucket1 + amountIn);
  }

  /* ---------- swapOut --------- */
  function test_swapOut_whenNotBroker_itReverts() public {
    changePrank(deployer);
    vm.expectRevert("Caller is not the Broker");
    biPoolManager.swapOut(0x0, address(0), address(0), 1e24);
  }

  function test_swapOut_whenExchangeDoesntExist_itReverts() public {
    vm.expectRevert("An exchange with the specified id does not exist");
    biPoolManager.swapOut(0x0, address(0), address(0), 1e24);
  }

  function test_swapOut_whenTokenInNotInPool_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match exchange");
    biPoolManager.swapOut(exchangeId, address(cEUR), address(cUSD), 1e24);
  }

  function test_swapOut_whenTokenOutNotInexchange_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match exchange");
    biPoolManager.swapOut(exchangeId, address(cUSD), address(cEUR), 1e24);
  }

  function test_swapOut_whenTokenInEqualsTokenOut_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match exchange");
    biPoolManager.swapOut(exchangeId, address(cUSD), address(cUSD), 1e24);
  }

  function test_swapOut_whenTokenInIsAsset0_itDelegatesToThePricingModule() public {
    BiPoolManager.PoolExchange memory exchange = biPoolManager.getPoolExchange(exchangeId);

    uint256 amountOut = 1e24;
    uint256 mockAmountIn = 0.5 * 1e24;

    mockGetAmountIn(exchangeId, address(cUSD), mockAmountIn, amountOut);
    uint256 amountIn = biPoolManager.swapOut(exchangeId, address(cUSD), address(CELO), amountOut);

    BiPoolManager.PoolExchange memory exchangeAfter = biPoolManager.getPoolExchange(exchangeId);
    assertEq(amountIn, mockAmountIn);
    assertEq(exchangeAfter.bucket0, exchange.bucket0 + amountIn);
    assertEq(exchangeAfter.bucket1, exchange.bucket1 - amountOut);
  }

  function test_swapOut_whenTokenInIsAsset1_itDelegatesToThePricingModule() public {
    BiPoolManager.PoolExchange memory exchange = biPoolManager.getPoolExchange(exchangeId);

    uint256 amountOut = 1e24;
    uint256 mockAmountIn = 0.6 * 1e24;

    mockGetAmountIn(exchangeId, address(CELO), mockAmountIn, amountOut);
    uint256 amountIn = biPoolManager.swapOut(exchangeId, address(CELO), address(cUSD), amountOut);

    BiPoolManager.PoolExchange memory exchangeAfter = biPoolManager.getPoolExchange(exchangeId);
    assertEq(amountIn, mockAmountIn);
    assertEq(exchangeAfter.bucket0, exchange.bucket0 - amountOut);
    assertEq(exchangeAfter.bucket1, exchange.bucket1 + amountIn);
  }
}

contract BiPoolManagerTest_bucketUpdates is BiPoolManagerTest_withExchange {
  function setUp() public {
    super.setUp();
    changePrank(broker);
  }

  function swap(bytes32 exchangeId, uint256 amountIn, uint256 amountOut) internal {
    BiPoolManager.PoolExchange memory exchange = biPoolManager.getPoolExchange(exchangeId);
    mockGetAmountOut(exchangeId, exchange.asset0, amountIn, amountOut);
    biPoolManager.swapIn(exchangeId, exchange.asset0, exchange.asset1, amountIn);
  }

  function test_swapIn_whenBucketsAreStale_updatesBuckets() public {
    BiPoolManager.PoolExchange memory exchange = biPoolManager.getPoolExchange(exchangeId);
    swap(exchangeId, exchange.bucket0 / 2, exchange.bucket1 / 2); // debalance exchange

    vm.warp(exchange.config.bucketUpdateFrequency + 1);
    sortedOracles.setNumRates(address(cUSD), 10);
    sortedOracles.setMedianTimestamp(address(cUSD), now);

    vm.expectEmit(true, true, true, true);
    uint256 bucket0TargetSize = exchange.config.bucket0TargetSize;
    emit BucketsUpdated(
      exchangeId,
      bucket0TargetSize,
      bucket0TargetSize / 2 // due to sortedOracles exchange rate 2:1
    );

    uint256 amountIn = 1e24;
    uint256 amountOut = biPoolManager.swapIn(exchangeId, exchange.asset0, exchange.asset1, 1e24);

    // Refresh exchange
    exchange = biPoolManager.getPoolExchange(exchangeId);

    assertEq(bucket0TargetSize + amountIn, exchange.bucket0);
    assertEq((bucket0TargetSize / 2) - amountOut, exchange.bucket1);
  }

  function test_swapIn_whenBucketsAreNotStale_doesNotUpdateBuckets() public {
    BiPoolManager.PoolExchange memory exchange = biPoolManager.getPoolExchange(exchangeId);
    swap(exchangeId, exchange.bucket0 / 2, exchange.bucket1 / 2); // debalance exchange
    exchange = biPoolManager.getPoolExchange(exchangeId); // Refresh exchange
    uint256 bucket0BeforeSwap = exchange.bucket0;
    uint256 bucket1BeforeSwap = exchange.bucket1;

    uint256 amountIn = 1e24;
    uint256 amountOut = biPoolManager.swapIn(exchangeId, exchange.asset0, exchange.asset1, 1e24);

    exchange = biPoolManager.getPoolExchange(exchangeId); // Refresh exchange

    /*
     * XXX: Because forge doesn't support an inverse to `expectEmit` we
     * can't verify that calling swap doesn't emit BucketsUpdated
     * but we can verify that the buckets were not reset before
     * the swap, but are based on the "debalanced" exchange.
     */

    assertEq(bucket0BeforeSwap + amountIn, exchange.bucket0);
    assertEq(bucket1BeforeSwap - amountOut, exchange.bucket1);
  }

  function test_swapIn_whenBucketsAreStale_butMinReportsNotMet_doesNotUpdateBuckets() public {
    BiPoolManager.PoolExchange memory exchange = biPoolManager.getPoolExchange(exchangeId);
    swap(exchangeId, exchange.bucket0 / 2, exchange.bucket1 / 2); // debalance exchange
    exchange = biPoolManager.getPoolExchange(exchangeId); // Refresh exchange
    uint256 bucket0BeforeSwap = exchange.bucket0;
    uint256 bucket1BeforeSwap = exchange.bucket1;

    vm.warp(exchange.config.bucketUpdateFrequency + 1);
    sortedOracles.setNumRates(address(cUSD), 4);
    sortedOracles.setMedianTimestampToNow(address(cUSD));

    uint256 amountIn = 1e24;
    uint256 amountOut = biPoolManager.swapIn(exchangeId, exchange.asset0, exchange.asset1, 1e24);

    exchange = biPoolManager.getPoolExchange(exchangeId); // Refresh exchange

    assertEq(bucket0BeforeSwap + amountIn, exchange.bucket0);
    assertEq(bucket1BeforeSwap - amountOut, exchange.bucket1);
  }

  function test_swapIn_whenBucketsAreStale_butReportIsExpired_doesNotUpdateBuckets() public {
    BiPoolManager.PoolExchange memory exchange = biPoolManager.getPoolExchange(exchangeId);
    swap(exchangeId, exchange.bucket0 / 2, exchange.bucket1 / 2); // debalance exchange
    exchange = biPoolManager.getPoolExchange(exchangeId); // Refresh exchange
    uint256 bucket0BeforeSwap = exchange.bucket0;
    uint256 bucket1BeforeSwap = exchange.bucket1;

    vm.warp(exchange.config.bucketUpdateFrequency + 1);
    sortedOracles.setOldestReportExpired(address(cUSD));
    sortedOracles.setNumRates(address(cUSD), 10);
    sortedOracles.setMedianTimestampToNow(address(cUSD));

    uint256 amountIn = 1e24;
    uint256 amountOut = biPoolManager.swapIn(exchangeId, exchange.asset0, exchange.asset1, 1e24);

    exchange = biPoolManager.getPoolExchange(exchangeId); // Refresh exchange

    assertEq(bucket0BeforeSwap + amountIn, exchange.bucket0);
    assertEq(bucket1BeforeSwap - amountOut, exchange.bucket1);
  }

  function test_swapIn_whenBucketsAreStale_butMedianTimestampIsOld_doesNotUpdateBuckets() public {
    BiPoolManager.PoolExchange memory exchange = biPoolManager.getPoolExchange(exchangeId);
    swap(exchangeId, exchange.bucket0 / 2, exchange.bucket1 / 2); // debalance exchange
    exchange = biPoolManager.getPoolExchange(exchangeId); // Refresh exchange
    uint256 bucket0BeforeSwap = exchange.bucket0;
    uint256 bucket1BeforeSwap = exchange.bucket1;

    vm.warp(exchange.config.bucketUpdateFrequency + 1);
    sortedOracles.setNumRates(address(cUSD), 10);
    sortedOracles.setMedianTimestamp(address(cUSD), now - exchange.config.bucketUpdateFrequency);

    uint256 amountIn = 1e24;
    uint256 amountOut = biPoolManager.swapIn(exchangeId, exchange.asset0, exchange.asset1, 1e24);

    exchange = biPoolManager.getPoolExchange(exchangeId); // Refresh exchange

    assertEq(bucket0BeforeSwap + amountIn, exchange.bucket0);
    assertEq(bucket1BeforeSwap - amountOut, exchange.bucket1);
  }
}
