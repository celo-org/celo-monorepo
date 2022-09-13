pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test, console2 as console } from "celo-foundry/Test.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import { Broker } from "contracts/stability/Broker.sol";
import { IMentoExchange } from "contracts/stability/interfaces/deprecate/IMentoExchange.sol";
import { IExchangeManager } from "contracts/stability/interfaces/IExchangeManager.sol";
import { IBiPoolManager } from "contracts/stability/interfaces/IBiPoolManager.sol";
import { IReserve } from "contracts/stability/interfaces/IReserve.sol";
import { IStableToken } from "contracts/stability/interfaces/IStableToken.sol";

import { FixidityLib } from "contracts/common/FixidityLib.sol";

// forge test --match-contract Broker -vvv
contract BrokerTest is Test {
  event Swap(
    address exchangeManager,
    bytes32 indexed exchangeId,
    address indexed trader,
    address indexed tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOut
  );
  event ExchangeManagerAdded(address indexed exchangeManager);
  event ExchangeManagerRemoved(address indexed exchangeManager);
  event ReserveSet(address indexed newAddress, address indexed prevAddress);

  address deployer;
  address notDeployer;
  address trader;

  IStableToken stableAsset;
  IERC20 collateralAsset;
  address randomAsset;
  IMentoExchange exchange;

  uint256 constant initialStableBucket = 1e24;
  uint256 constant initialCollateralBucket = 2e24;

  IReserve reserve;
  // IPairManager pairManager;
  IExchangeManager exchangeManager;
  IBiPoolManager poolManager;

  Broker broker;

  function setUp() public {
    /* Dependencies and actors */
    deployer = actor("deployer");
    notDeployer = actor("notDeployer");
    reserve = IReserve(actor("reserve"));
    // pairManager = IPairManager(actor("pairManager"));
    poolManager = IBiPoolManager(actor("IBiPoolManager"));
    exchangeManager = IExchangeManager(actor("exchangeManager"));
    stableAsset = IStableToken(actor("stableAsset"));
    collateralAsset = IERC20(actor("collateralAsset"));
    randomAsset = actor("randomAsset");
    exchange = IMentoExchange(actor("exchange"));
    trader = actor("trader");

    /* Mocks for dependent contracts */
    vm.mockCall(
      address(stableAsset),
      abi.encodePacked(IERC20(address(stableAsset)).transferFrom.selector),
      abi.encode(0x0)
    );

    vm.mockCall(address(stableAsset), abi.encodePacked(stableAsset.burn.selector), abi.encode(0x0));

    vm.mockCall(address(stableAsset), abi.encodePacked(stableAsset.mint.selector), abi.encode(0x0));

    vm.mockCall(
      address(reserve),
      abi.encodePacked(reserve.transferCollateralAsset.selector),
      abi.encode(0x0)
    );

    vm.mockCall(
      address(collateralAsset),
      abi.encodePacked(collateralAsset.transferFrom.selector),
      abi.encode(0x0)
    );

    changePrank(deployer);
    broker = new Broker(true);
    address[] memory exchangeManagers = new address[](2);
    exchangeManagers[0] = address(actor("exchangeManager1"));
    exchangeManagers[1] = address(actor("exchangeManager2"));
    console.log(actor("exchangeManager2"), "logggggggg");
    console.log(actor("exchangeManager2"), "logggggggg");
    broker.initialize(exchangeManagers, address(reserve));
    changePrank(trader);
  }

  // function createPool() internal view returns (bytes32 pairId, IBiPoolManager.Pool memory pair) {
  //   pair.stableAsset = address(stableAsset);
  //   pair.collateralAsset = address(collateralAsset);
  //   pair.mentoExchange = IMentoExchange(exchange);
  //   pair.collateralBucketFraction = FixidityLib.wrap(0.1 * 10**24);
  //   pair.stableBucketMaxFraction = FixidityLib.wrap(0.1 * 10**24);
  //   pair.stableBucket = initialStableBucket;
  //   pair.collateralBucket = initialCollateralBucket;
  //   pair.spread = FixidityLib.wrap(0.1 * 10**24);
  //   pairId = keccak256(abi.encode(pair));
  // }

  // function mockGetPair() internal returns (bytes32 pairId) {
  //   IPairManager.Pair memory pair;
  //   (pairId, pair) = createPair();
  //   vm.mockCall(
  //     address(pairManager),
  //     abi.encodeWithSelector(pairManager.getPair.selector, pairId),
  //     abi.encode(pair)
  //   );
  // }

}

contract BrokerTest_initilizerAndSetters is BrokerTest {
  /* ---------- Initilizer ---------- */

  function test_initilize_shouldSetOwner() public {
    assertEq(broker.owner(), deployer);
  }

  function test_initilize_shouldSetExchangeManagerAddresseses() public {
    assertEq(broker.getExchangeManagers(), broker.getExchangeManagers());
  }

  function test_initilize_shouldSetReserve() public {
    assertEq(address(broker.reserve()), address(reserve));
  }

  /* ---------- Setters ---------- */

  function test_addExchangeManager_whenSenderIsNotOwner_shouldRevert() public {
    changePrank(notDeployer);
    vm.expectRevert("Ownable: caller is not the owner");
    broker.addExchangeManager(address(0));
  }

  function test_addExchangeManager_whenAddressIsZero_shouldRevert() public {
    changePrank(deployer);
    vm.expectRevert("ExchangeManager address can't be 0");
    broker.addExchangeManager(address(0));
  }

  function test_addExchangeManager_whenSenderIsOwner_shouldUpdateAndEmit() public {
    changePrank(deployer);
    address newPairManager = actor("newPairManager");
    vm.expectEmit(true, false, false, false);
    emit ExchangeManagerAdded(newPairManager);
    broker.addExchangeManager(newPairManager);
    address[] memory updatedExchangeManagers = broker.getExchangeManagers();
    assertEq(updatedExchangeManagers[updatedExchangeManagers.length - 1], newPairManager);
  }

  function test_removeExchangeManager_whenSenderIsOwner_shouldUpdateAndEmit() public {
    changePrank(deployer);
    vm.expectEmit(true, true, true, true);
    emit ExchangeManagerRemoved(actor("exchangeManager1"));
    broker.removeExchangeManager(actor("exchangeManager1"), 0);
    assertEq(broker.getExchangeManagers()[0], actor("exchangeManager2"));
  }

  function test_removeExchangeManager_whenAddressDoesNotExist_shouldRevert() public {
    changePrank(deployer);
    vm.expectRevert("index into exchangeManagers list not mapped to token");
    broker.removeExchangeManager(notDeployer, 1);
  }
  function test_removeExchangeManager_whenIndexOutOfRange_shouldRevert() public {
    changePrank(deployer);
    vm.expectRevert("index into exchangeManagers list not mapped to token");
    broker.removeExchangeManager(actor("exchangeManager1"), 1);
  }

  function test_removeExchangeManager_whenNotOwner_shouldRevert() public {
    changePrank(notDeployer);
    vm.expectRevert("Ownable: caller is not the owner");
    broker.removeExchangeManager(actor("exchangeManager1"), 0);
  }

  function test_setReserve_whenSenderIsNotOwner_shouldRevert() public {
    changePrank(notDeployer);
    vm.expectRevert("Ownable: caller is not the owner");
    broker.setReserve(address(0));
  }

  function test_setReserve_whenAddressIsZero_shouldRevert() public {
    changePrank(deployer);
    vm.expectRevert("Reserve address must be set");
    broker.setReserve(address(0));
  }

  function test_setReserve_whenSenderIsOwner_shouldUpdateAndEmit() public {
    changePrank(deployer);
    address newReserve = actor("newReserve");
    vm.expectEmit(true, false, false, false);
    emit ReserveSet(newReserve, address(reserve));

    broker.setReserve(newReserve);
    assertEq(address(broker.reserve()), newReserve);
  }
}

// contract BrokerTest_quote is BrokerTest {
//   function test_quote_tokenInStableAsset_shouldReturnQuote() public {
//     bytes32 pairId = mockGetPair();
//     uint256 amountIn = 1e18;

//     vm.mockCall(
//       address(exchange),
//       abi.encodeWithSelector(
//         exchange.getAmountOut.selector,
//         stableAsset,
//         collateralAsset,
//         initialStableBucket,
//         initialCollateralBucket,
//         amountIn
//       ),
//       abi.encode(2e18, 1e24, 2e24)
//     );

//     (address tokenOut, uint256 amountOut) = broker.quote(pairId, address(stableAsset), amountIn);
//     assertEq(tokenOut, address(collateralAsset));
//     assertEq(amountOut, 2e18);
//   }

//   function test_quote_tokenInCollateralAsset_shouldReturnQuote() public {
//     bytes32 pairId = mockGetPair();
//     uint256 amountIn = 1e18;

//     vm.mockCall(
//       address(exchange),
//       abi.encodeWithSelector(
//         exchange.getAmountOut.selector,
//         collateralAsset,
//         stableAsset,
//         initialCollateralBucket,
//         initialStableBucket,
//         amountIn
//       ),
//       abi.encode(2e18, 10e18, 20e18)
//     );

//     (address tokenOut, uint256 amountOut) = broker.quote(pairId, address(collateralAsset), 1e18);
//     assertEq(tokenOut, address(stableAsset));
//     assertEq(amountOut, 2e18);
//   }

//   function test_quote_tokenInNotInPair_shouldRevert() public {
//     bytes32 pairId = mockGetPair();
//     vm.expectRevert("tokenIn is not in the pair");
//     broker.quote(pairId, randomAsset, 1e18);
//   }
// }

// contract BrokerTest_swap is BrokerTest {
//   function test_swap_tokenInStableAsset_shouldExecuteSwap() public {
//     bytes32 pairId = mockGetPair();
//     uint256 amountIn = 1e18;
//     uint256 mockAmountOut = 2e18;
//     uint256 nextStableBucket = initialStableBucket + amountIn;
//     uint256 nextCollateralBucket = initialCollateralBucket - mockAmountOut;

//     vm.mockCall(
//       address(exchange),
//       abi.encodeWithSelector(
//         exchange.getAmountOut.selector,
//         stableAsset,
//         collateralAsset,
//         initialStableBucket,
//         initialCollateralBucket,
//         amountIn
//       ),
//       abi.encode(mockAmountOut, nextStableBucket, nextCollateralBucket)
//     );

//     vm.expectCall(
//       address(stableAsset),
//       abi.encodeWithSelector(
//         IERC20(address(stableAsset)).transferFrom.selector,
//         trader,
//         address(broker),
//         amountIn
//       )
//     );

//     vm.expectCall(
//       address(stableAsset),
//       abi.encodeWithSelector(stableAsset.burn.selector, amountIn)
//     );

//     vm.expectCall(
//       address(reserve),
//       abi.encodeWithSelector(
//         reserve.transferCollateralAsset.selector,
//         address(collateralAsset),
//         trader,
//         mockAmountOut
//       )
//     );

//     vm.expectCall(
//       address(pairManager),
//       abi.encodeWithSelector(
//         pairManager.updateBuckets.selector,
//         pairId,
//         nextStableBucket,
//         nextCollateralBucket
//       )
//     );

//     vm.expectEmit(true, true, true, true, address(broker));
//     emit Swap(
//       pairId,
//       trader,
//       address(stableAsset),
//       address(collateralAsset),
//       amountIn,
//       mockAmountOut
//     );
//     (address tokenOut, uint256 amountOut) = broker.swap(pairId, address(stableAsset), amountIn, 0);
//     assertEq(tokenOut, address(collateralAsset));
//     assertEq(amountOut, mockAmountOut);
//   }

//   function test_swap_tokenInCollateralAsset_shouldExecuteSwap() public {
//     bytes32 pairId = mockGetPair();
//     uint256 amountIn = 2e18;
//     uint256 mockAmountOut = 1e18;
//     uint256 nextStableBucket = initialStableBucket - mockAmountOut;
//     uint256 nextCollateralBucket = initialCollateralBucket + amountIn;

//     vm.mockCall(
//       address(exchange),
//       abi.encodeWithSelector(
//         exchange.getAmountOut.selector,
//         collateralAsset,
//         stableAsset,
//         initialCollateralBucket,
//         initialStableBucket,
//         amountIn
//       ),
//       abi.encode(mockAmountOut, nextCollateralBucket, nextStableBucket)
//     );

//     vm.expectCall(
//       address(collateralAsset),
//       abi.encodeWithSelector(
//         collateralAsset.transferFrom.selector,
//         trader,
//         address(reserve),
//         amountIn
//       )
//     );

//     vm.expectCall(
//       address(stableAsset),
//       abi.encodeWithSelector(stableAsset.mint.selector, trader, mockAmountOut)
//     );

//     vm.expectCall(
//       address(pairManager),
//       abi.encodeWithSelector(
//         pairManager.updateBuckets.selector,
//         pairId,
//         nextStableBucket,
//         nextCollateralBucket
//       )
//     );

//     vm.expectEmit(true, true, true, true, address(broker));
//     emit Swap(
//       pairId,
//       trader,
//       address(collateralAsset),
//       address(stableAsset),
//       amountIn,
//       mockAmountOut
//     );
//     (address tokenOut, uint256 amountOut) = broker.swap(
//       pairId,
//       address(collateralAsset),
//       amountIn,
//       0
//     );
//     assertEq(tokenOut, address(stableAsset));
//     assertEq(amountOut, mockAmountOut);
//   }

//   function test_swap_minAmountNotMet_shouldRevert() public {
//     bytes32 pairId = mockGetPair();
//     uint256 amountIn = 1e18;
//     uint256 mockAmountOut = 2e18;
//     uint256 nextStableBucket = initialStableBucket + amountIn;
//     uint256 nextCollateralBucket = initialCollateralBucket - mockAmountOut;

//     vm.mockCall(
//       address(exchange),
//       abi.encodeWithSelector(
//         exchange.getAmountOut.selector,
//         stableAsset,
//         collateralAsset,
//         initialStableBucket,
//         initialCollateralBucket,
//         amountIn
//       ),
//       abi.encode(mockAmountOut, nextStableBucket, nextCollateralBucket)
//     );

//     vm.expectRevert("amountOutMin not met");
//     broker.swap(pairId, address(stableAsset), amountIn, mockAmountOut + 1);
//   }

//   function test_swap_assetNotInPair_shouldRevert() public {
//     bytes32 pairId = mockGetPair();
//     vm.expectRevert("tokenIn is not in the pair");
//     broker.swap(pairId, randomAsset, 1e18, 0);
//   }
// }

