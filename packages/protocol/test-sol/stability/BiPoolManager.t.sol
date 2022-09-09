// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test, console2 as console } from "celo-foundry/Test.sol";

import { IReserve } from "contracts/stability/interfaces/IReserve.sol";
import { BiPoolManager } from "contracts/stability/BiPoolManager.sol";
import { IBiPoolManager } from "contracts/stability/interfaces/IBiPoolManager.sol";
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

  event PoolCreated(
    bytes32 indexed poolId,
    address indexed asset0,
    address indexed asset1,
    address pricingModule
  );
  event PoolDestroyed(
    bytes32 indexed poolId,
    address indexed asset0,
    address indexed asset1,
    address pricingModule
  );
  event BrokerUpdated(address indexed newBroker);
  event ReserveUpdated(address indexed newReserve);
  event SortedOraclesUpdated(address indexed newSortedOracles);
  event BucketsUpdated(bytes32 indexed poolId, uint256 bucket0, uint256 bucket1);

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

  function createPool(MockERC20 asset0, MockERC20 asset1) internal returns (bytes32) {
    return createPool(asset0, asset1, IPricingModule(constantProduct));
  }

  function createPool(MockERC20 asset0, MockERC20 asset1, IPricingModule pricingModule)
    internal
    returns (bytes32 poolId)
  {
    return createPool(asset0, asset1, pricingModule, address(asset0));
  }

  function createPool(
    MockERC20 asset0,
    MockERC20 asset1,
    IPricingModule pricingModule,
    address oracleReportTarget
  ) internal returns (bytes32 poolId) {
    return
      createPool(
        asset0,
        asset1,
        pricingModule,
        oracleReportTarget,
        FixidityLib.wrap(0.1 * 1e24), // spread
        1e26, // bucket0TargetSize
        FixidityLib.wrap(0.2 * 1e24) // bucket0MaxFraction
      );
  }

  function createPool(
    MockERC20 asset0,
    MockERC20 asset1,
    IPricingModule pricingModule,
    address oracleReportTarget,
    FixidityLib.Fraction memory spread,
    uint256 bucket0TargetSize,
    FixidityLib.Fraction memory bucket0MaxFraction
  ) internal returns (bytes32 poolId) {
    BiPoolManager.Pool memory pool;
    pool.asset0 = address(asset0);
    pool.asset1 = address(asset1);
    pool.pricingModule = pricingModule;
    pool.spread = spread;

    BiPoolManager.BucketUpdateInfo memory bucketUpdateInfo;
    bucketUpdateInfo.oracleReportTarget = oracleReportTarget;
    bucketUpdateInfo.bucket0TargetSize = bucket0TargetSize;
    bucketUpdateInfo.bucket0MaxFraction = bucket0MaxFraction;

    pool.bucketUpdateInfo = bucketUpdateInfo;

    return biPoolManager.createPool(pool);
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

  function test_getPool_whenPoolDoesNotExist_shouldRevert() public {
    bytes32 poolId = keccak256(
      abi.encodePacked(cUSD.symbol(), USDCet.symbol(), constantProduct.name())
    );

    vm.expectRevert("A pool with the specified id does not exist");
    biPoolManager.getPool(poolId);
  }

  function test_getPool_whenPoolExists_shouldReturnPool() public {
    mockOracleRate(address(cUSD), 1e24);
    bytes32 poolId = createPool(cUSD, USDCet);
    BiPoolManager.Pool memory existingPool = biPoolManager.getPool(poolId);
    assertEq(existingPool.asset0, address(cUSD));
    assertEq(existingPool.asset1, address(USDCet));
  }
}

contract BiPoolManagerTest_createPool is BiPoolManagerTest {
  function test_createPool_whenNotCalledByOwner_shouldRevert() public {
    BiPoolManager.Pool memory newPool;
    changePrank(notDeployer);

    vm.expectRevert("Ownable: caller is not the owner");
    biPoolManager.createPool(newPool);
  }

  function test_createPool_whenPoolWithIdExists_shouldRevert() public {
    mockOracleRate(address(cUSD), 1e24);
    createPool(cUSD, USDCet);

    vm.expectRevert("A pool with the specified assets and exchange exists");
    createPool(cUSD, USDCet);
  }

  function test_createPool_whenAsset0IsNotRegistered_shouldRevert() public {
    MockERC20 nonReserveStable = newMockERC20("Non Reserve Stable Asset", "NRSA");
    vm.expectRevert("asset0 must be a stable registered with the reserve");
    createPool(nonReserveStable, CELO);
  }

  function test_createPool_whenAsset0IsCollateral_shouldRevert() public {
    vm.expectRevert("asset0 must be a stable registered with the reserve");
    createPool(USDCet, CELO);
  }

  function test_createPool_whenAsset1IsNotRegistered_shouldRevert() public {
    MockERC20 nonReserveCollateral = newMockERC20("Non Reserve Collateral Asset", "NRCA");
    vm.expectRevert("asset1 must be a stable or collateral registered with the reserve");
    createPool(cUSD, nonReserveCollateral);
  }

  function test_createPool_whenBucket0MaxFractionIsZero_shouldRevert() public {
    vm.expectRevert("bucket0MaxFraction must be greater than 0");
    createPool(
      cUSD,
      CELO,
      constantProduct,
      address(cUSD),
      FixidityLib.wrap(0.1 * 1e24), // spread
      1e24, // bucket0TargetSize
      FixidityLib.wrap(0) // bucket0MaxFraction
    );
  }

  function test_createPool_whenBucket0MaxFractionIsOne_shouldRevert() public {
    vm.expectRevert("bucket0MaxFraction must be smaller than 1");
    createPool(
      cUSD,
      CELO,
      constantProduct,
      address(cUSD),
      FixidityLib.wrap(0.1 * 1e24), // spread
      1e24, // bucket0TargetSize
      FixidityLib.wrap(1 * 1e24) // bucket0MaxFraction
    );
  }

  function test_createPool_whenMentoExchangeIsNotSet_shouldRevert() public {
    vm.expectRevert("pricingModule must be set");
    createPool(cUSD, CELO, IPricingModule(address(0)));
  }

  function test_createPool_whenAsset0IsNotSet_shouldRevert() public {
    vm.expectRevert("asset0 must be set");
    createPool(MockERC20(address(0)), CELO);
  }

  function test_createPool_whenAsset1IsNotSet_shouldRevert() public {
    vm.expectRevert("asset1 must be set");
    createPool(cUSD, MockERC20(address(0)));
  }

  function test_createPool_whenOracleReportTargetIsNotSet_shouldRevert() public {
    vm.expectRevert("oracleReportTarget must be set");
    createPool(cUSD, CELO, constantProduct, address(0));
  }

  function test_createPool_whenSpreadNotLTEOne_shouldRevert() public {
    vm.expectRevert("Spread must be less than or equal to 1");
    createPool(
      cUSD,
      CELO,
      constantProduct,
      address(cUSD),
      FixidityLib.wrap(2 * 1e24), // spread
      1e26, // bucket0TargetSize
      FixidityLib.wrap(0.1 * 1e24) // bucket0MaxFraction
    );
  }

  function test_createPool_whenInfoIsValid_shouldUpdateMappingAndEmit() public {
    bytes32 poolId = keccak256(
      abi.encodePacked(cUSD.symbol(), CELO.symbol(), constantProduct.name())
    );

    mockOracleRate(address(cUSD), 2 * 1e24);
    vm.expectEmit(true, true, true, false);
    emit PoolCreated(poolId, address(cUSD), address(CELO), address(constantProduct));
    createPool(cUSD, CELO);

    bytes32[] memory poolIds = biPoolManager.getPoolIds();
    assertEq(poolIds.length, 1);
    assertEq(poolIds[0], poolId);
  }

  function test_createPool_whenInfoIsValid_setsBucketSizesCorrectly() public {
    mockOracleRate(address(cUSD), 2 * 1e24); // 1 CELO == 2 cUSD
    bytes32 poolId = createPool(
      cUSD,
      CELO,
      constantProduct,
      address(cUSD),
      FixidityLib.wrap(0.1 * 1e24), // spread
      1e24, // bucket0TargetSize
      FixidityLib.wrap(0.1 * 1e24) // bucket0MaxFraction
    );

    BiPoolManager.Pool memory pool = biPoolManager.getPool(poolId);
    assertEq(pool.bucket0, 1e24);
    assertEq(pool.bucket1, 5e23); // pool.bucket0 / 2
  }
}

contract BiPoolManagerTest_destroyPool is BiPoolManagerTest {
  function test_destroyPool_whenSenderIsNotOwner_shouldRevert() public {
    changePrank(notDeployer);
    vm.expectRevert("Ownable: caller is not the owner");
    biPoolManager.destroyPool(0x0, 0);
  }

  function test_destroyPool_whenNoPoolsExist_shouldRevert() public {
    vm.expectRevert("poolIdIndex not in range");
    biPoolManager.destroyPool(0x0, 0);
  }

  function test_destroyPool_whenAPoolExistsButTheIdIsWrong_shouldRevert() public {
    mockOracleRate(address(cUSD), 2e24);
    createPool(cUSD, USDCet);
    vm.expectRevert("poolId at index doesn't match");
    biPoolManager.destroyPool(0x0, 0);
  }

  function test_destroyPool_whenAPoolExistsButTheIndexIsTooLarge_shouldRevert() public {
    mockOracleRate(address(cUSD), 2e24);
    createPool(cUSD, USDCet);
    vm.expectRevert("poolIdIndex not in range");
    biPoolManager.destroyPool(0x0, 1);
  }

  function test_destroyPool_whenPoolExists_shouldUpdateAndEmit() public {
    mockOracleRate(address(cUSD), 2e24);
    bytes32 poolId = createPool(cUSD, USDCet);
    vm.expectEmit(true, true, true, true);
    emit PoolDestroyed(poolId, address(cUSD), address(USDCet), address(constantProduct));
    biPoolManager.destroyPool(poolId, 0);
  }

  function test_destroyPool_whenMultiplePoolsExist_shouldUpdateTheIdList() public {
    mockOracleRate(address(cUSD), 2e24);
    bytes32 poolId0 = createPool(cUSD, USDCet);
    bytes32 poolId1 = createPool(cUSD, CELO);

    vm.expectEmit(true, true, true, true);
    emit PoolDestroyed(poolId0, address(cUSD), address(USDCet), address(constantProduct));
    biPoolManager.destroyPool(poolId0, 0);

    bytes32[] memory poolIds = biPoolManager.getPoolIds();
    assertEq(poolIds.length, 1);
    assertEq(poolIds[0], poolId1);
  }
}

contract BiPoolManagerTest_withPool is BiPoolManagerTest {
  bytes32 poolId;

  function setUp() public {
    super.setUp();

    mockOracleRate(address(cUSD), 2e24);
    poolId = createPool(cUSD, CELO);
  }
}

contract BiPoolManagerTest_quote is BiPoolManagerTest_withPool {
  /* ---------- getAmountOut ---------- */
  function test_getAmountOut_whenPoolDoesntExist_itReverts() public {
    vm.expectRevert("A pool with the specified id does not exist");
    biPoolManager.getAmountOut(0x0, address(0), address(0), 1e24);
  }

  function test_getAmountOut_whenTokenInNotInPool_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match pool");
    biPoolManager.getAmountOut(poolId, address(cEUR), address(cUSD), 1e24);
  }

  function test_getAmountOut_whenTokenOutNotInPool_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match pool");
    biPoolManager.getAmountOut(poolId, address(cUSD), address(cEUR), 1e24);
  }

  function test_getAmountOut_whenTokenInEqualsTokenOut_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match pool");
    biPoolManager.getAmountOut(poolId, address(cUSD), address(cUSD), 1e24);
  }

  function test_getAmountOut_whenTokenInIsAsset0_itDelegatesToThePricingModule() public {
    BiPoolManager.Pool memory pool = biPoolManager.getPool(poolId);

    uint256 amountIn = 1e24;
    uint256 mockAmountOut = 0.5 * 1e24;

    vm.mockCall(
      address(constantProduct),
      abi.encodeWithSelector(
        constantProduct.getAmountOut.selector,
        pool.bucket0,
        pool.bucket1,
        pool.spread.unwrap(),
        amountIn
      ),
      abi.encode(mockAmountOut)
    );

    uint256 amountOut = biPoolManager.getAmountOut(poolId, address(cUSD), address(CELO), amountIn);
    assertEq(amountOut, mockAmountOut);
  }

  function test_getAmountOut_whenTokenInIsAsset1_itDelegatesToThePricingModule() public {
    BiPoolManager.Pool memory pool = biPoolManager.getPool(poolId);

    uint256 amountIn = 1e24;
    uint256 mockAmountOut = 0.5 * 1e24;

    vm.mockCall(
      address(constantProduct),
      abi.encodeWithSelector(
        constantProduct.getAmountOut.selector,
        pool.bucket1,
        pool.bucket0,
        pool.spread.unwrap(),
        amountIn
      ),
      abi.encode(mockAmountOut)
    );

    uint256 amountOut = biPoolManager.getAmountOut(poolId, address(CELO), address(cUSD), amountIn);
    assertEq(amountOut, mockAmountOut);
  }

  /* ---------- getAmountIn ---------- */

  function test_getAmountIn_whenPoolDoesntExist_itReverts() public {
    vm.expectRevert("A pool with the specified id does not exist");
    biPoolManager.getAmountIn(0x0, address(0), address(0), 1e24);
  }

  function test_getAmountIn_whenTokenInNotInPool_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match pool");
    biPoolManager.getAmountIn(poolId, address(cEUR), address(cUSD), 1e24);
  }

  function test_getAmountIn_whenTokenOutNotInPool_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match pool");
    biPoolManager.getAmountIn(poolId, address(cUSD), address(cEUR), 1e24);
  }

  function test_getAmountIn_whenTokenInEqualsTokenOut_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match pool");
    biPoolManager.getAmountIn(poolId, address(cUSD), address(cUSD), 1e24);
  }

  function test_getAmountIn_whenTokenInIsAsset0_itDelegatesToThePricingModule() public {
    BiPoolManager.Pool memory pool = biPoolManager.getPool(poolId);

    uint256 amountOut = 1e24;
    uint256 mockAmountIn = 0.5 * 1e24;

    vm.mockCall(
      address(constantProduct),
      abi.encodeWithSelector(
        constantProduct.getAmountIn.selector,
        pool.bucket0,
        pool.bucket1,
        pool.spread.unwrap(),
        amountOut
      ),
      abi.encode(mockAmountIn)
    );

    uint256 amountIn = biPoolManager.getAmountIn(poolId, address(cUSD), address(CELO), amountOut);
    assertEq(amountIn, mockAmountIn);
  }

  function test_getAmountIn_whenTokenInIsAsset1_itDelegatesToThePricingModule() public {
    BiPoolManager.Pool memory pool = biPoolManager.getPool(poolId);

    uint256 amountOut = 1e24;
    uint256 mockAmountIn = 0.5 * 1e24;

    vm.mockCall(
      address(constantProduct),
      abi.encodeWithSelector(
        constantProduct.getAmountIn.selector,
        pool.bucket1,
        pool.bucket0,
        pool.spread.unwrap(),
        amountOut
      ),
      abi.encode(mockAmountIn)
    );

    uint256 amountIn = biPoolManager.getAmountIn(poolId, address(CELO), address(cUSD), amountOut);
    assertEq(amountIn, mockAmountIn);
  }

}

contract BiPoolManagerTest_swap is BiPoolManagerTest_withPool {
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

  function test_swapIn_whenPoolDoesntExist_itReverts() public {
    vm.expectRevert("A pool with the specified id does not exist");
    biPoolManager.swapIn(0x0, address(0), address(0), 1e24);
  }

  function test_swapIn_whenTokenInNotInPool_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match pool");
    biPoolManager.swapIn(poolId, address(cEUR), address(cUSD), 1e24);
  }

  function test_swapIn_whenTokenOutNotInPool_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match pool");
    biPoolManager.swapIn(poolId, address(cUSD), address(cEUR), 1e24);
  }

  function test_swapIn_whenTokenInEqualsTokenOut_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match pool");
    biPoolManager.swapIn(poolId, address(cUSD), address(cUSD), 1e24);
  }

  function test_swapIn_whenTokenInIsAsset0_itDelegatesToThePricingModule() public {
    BiPoolManager.Pool memory pool = biPoolManager.getPool(poolId);

    uint256 amountIn = 1e24;
    uint256 mockAmountOut = 0.5 * 1e24;

    vm.mockCall(
      address(constantProduct),
      abi.encodeWithSelector(
        constantProduct.getAmountOut.selector,
        pool.bucket0,
        pool.bucket1,
        pool.spread.unwrap(),
        amountIn
      ),
      abi.encode(mockAmountOut)
    );

    uint256 amountOut = biPoolManager.swapIn(poolId, address(cUSD), address(CELO), amountIn);

    BiPoolManager.Pool memory poolAfter = biPoolManager.getPool(poolId);
    assertEq(amountOut, mockAmountOut);
    assertEq(poolAfter.bucket0, pool.bucket0 + amountIn);
    assertEq(poolAfter.bucket1, pool.bucket1 - amountOut);
  }

  function test_swapIn_whenTokenInIsAsset1_itDelegatesToThePricingModule() public {
    BiPoolManager.Pool memory pool = biPoolManager.getPool(poolId);

    uint256 amountIn = 1e24;
    uint256 mockAmountOut = 0.5 * 1e24;

    vm.mockCall(
      address(constantProduct),
      abi.encodeWithSelector(
        constantProduct.getAmountOut.selector,
        pool.bucket1,
        pool.bucket0,
        pool.spread.unwrap(),
        amountIn
      ),
      abi.encode(mockAmountOut)
    );

    uint256 amountOut = biPoolManager.swapIn(poolId, address(CELO), address(cUSD), amountIn);

    BiPoolManager.Pool memory poolAfter = biPoolManager.getPool(poolId);
    assertEq(amountOut, mockAmountOut);
    assertEq(poolAfter.bucket0, pool.bucket0 - amountOut);
    assertEq(poolAfter.bucket1, pool.bucket1 + amountIn);
  }

  /* ---------- swapOut --------- */
  function test_swapOut_whenNotBroker_itReverts() public {
    changePrank(deployer);
    vm.expectRevert("Caller is not the Broker");
    biPoolManager.swapOut(0x0, address(0), address(0), 1e24);
  }

  function test_swapOut_whenPoolDoesntExist_itReverts() public {
    vm.expectRevert("A pool with the specified id does not exist");
    biPoolManager.swapOut(0x0, address(0), address(0), 1e24);
  }

  function test_swapOut_whenTokenInNotInPool_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match pool");
    biPoolManager.swapOut(poolId, address(cEUR), address(cUSD), 1e24);
  }

  function test_swapOut_whenTokenOutNotInPool_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match pool");
    biPoolManager.swapOut(poolId, address(cUSD), address(cEUR), 1e24);
  }

  function test_swapOut_whenTokenInEqualsTokenOut_itReverts() public {
    vm.expectRevert("tokenIn and tokenOut must match pool");
    biPoolManager.swapOut(poolId, address(cUSD), address(cUSD), 1e24);
  }

  function test_swapOut_whenTokenInIsAsset0_itDelegatesToThePricingModule() public {
    BiPoolManager.Pool memory pool = biPoolManager.getPool(poolId);

    uint256 amountOut = 1e24;
    uint256 mockAmountIn = 0.5 * 1e24;

    vm.mockCall(
      address(constantProduct),
      abi.encodeWithSelector(
        constantProduct.getAmountIn.selector,
        pool.bucket0,
        pool.bucket1,
        pool.spread.unwrap(),
        amountOut
      ),
      abi.encode(mockAmountIn)
    );

    uint256 amountIn = biPoolManager.swapOut(poolId, address(cUSD), address(CELO), amountOut);

    BiPoolManager.Pool memory poolAfter = biPoolManager.getPool(poolId);
    assertEq(amountIn, mockAmountIn);
    assertEq(poolAfter.bucket0, pool.bucket0 + amountIn);
    assertEq(poolAfter.bucket1, pool.bucket1 - amountOut);
  }

  function test_swapOut_whenTokenInIsAsset1_itDelegatesToThePricingModule() public {
    BiPoolManager.Pool memory pool = biPoolManager.getPool(poolId);

    uint256 amountOut = 1e24;
    uint256 mockAmountIn = 0.6 * 1e24;

    vm.mockCall(
      address(constantProduct),
      abi.encodeWithSelector(
        constantProduct.getAmountIn.selector,
        pool.bucket1,
        pool.bucket0,
        pool.spread.unwrap(),
        amountOut
      ),
      abi.encode(mockAmountIn)
    );

    uint256 amountIn = biPoolManager.swapOut(poolId, address(CELO), address(cUSD), amountOut);

    BiPoolManager.Pool memory poolAfter = biPoolManager.getPool(poolId);
    assertEq(amountIn, mockAmountIn);
    assertEq(poolAfter.bucket0, pool.bucket0 - amountOut);
    assertEq(poolAfter.bucket1, pool.bucket1 + amountIn);
  }

}
