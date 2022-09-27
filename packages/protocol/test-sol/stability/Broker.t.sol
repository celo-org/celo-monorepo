pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test, console2 as console } from "celo-foundry/Test.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { Broker } from "contracts/stability/Broker.sol";
import { IMentoExchange } from "contracts/stability/interfaces/deprecate/IMentoExchange.sol";
import { IExchangeProvider } from "contracts/stability/interfaces/IExchangeProvider.sol";
import { IReserve } from "contracts/stability/interfaces/IReserve.sol";
import { IStableToken } from "contracts/stability/interfaces/IStableToken.sol";
import { MockStableToken } from "contracts/stability/test/MockStableToken.sol";
import { MockReserve } from "contracts/stability/test/MockReserve.sol";
import { DummyERC20 } from "../utils/DummyErc20.sol";

import { FixidityLib } from "contracts/common/FixidityLib.sol";

// forge test --match-contract Broker -vvv
contract BrokerTest is Test {
  event Swap(
    address exchangeProvider,
    bytes32 indexed exchangeId,
    address indexed trader,
    address indexed tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOut
  );
  event ExchangeProviderAdded(address indexed exchangeProvider);
  event ExchangeProviderRemoved(address indexed exchangeProvider);
  event ReserveSet(address indexed newAddress, address indexed prevAddress);

  address deployer = actor("deployer");
  address notDeployer = actor("notDeployer");
  address trader = actor("trader");
  address randomExchangeProvider = actor("randomExchangeProvider");
  address randomAsset = actor("randomAsset");

  MockReserve reserve;
  MockStableToken stableAsset;
  DummyERC20 collateralAsset;

  Broker broker;

  IExchangeProvider exchangeProvider;
  address exchangeProvider1 = actor("exchangeProvider1");
  address exchangeProvider2 = actor("exchangeProvider2");

  function setUp() public {
    /* Dependencies and actors */
    reserve = new MockReserve();
    collateralAsset = new DummyERC20();
    stableAsset = new MockStableToken();
    randomAsset = actor("randomAsset");
    broker = new Broker(true);
    exchangeProvider = IExchangeProvider(actor("exchangeProvider"));

    reserve.addToken(address(stableAsset));
    reserve.addCollateralAsset(address(collateralAsset));

    changePrank(deployer);
    address[] memory exchangeProviders = new address[](3);
    exchangeProviders[0] = exchangeProvider1;
    exchangeProviders[1] = exchangeProvider2;
    exchangeProviders[2] = address(exchangeProvider);
    broker.initialize(exchangeProviders, address(reserve));
    changePrank(trader);
  }
}

contract BrokerTest_initilizerAndSetters is BrokerTest {
  /* ---------- Initilizer ---------- */

  function test_initilize_shouldSetOwner() public {
    assertEq(broker.owner(), deployer);
  }

  function test_initilize_shouldSetExchangeProviderAddresseses() public {
    assertEq(broker.getExchangeProviders(), broker.getExchangeProviders());
  }

  function test_initilize_shouldSetReserve() public {
    assertEq(address(broker.reserve()), address(reserve));
  }

  /* ---------- Setters ---------- */

  function test_addExchangeProvider_whenSenderIsNotOwner_shouldRevert() public {
    changePrank(notDeployer);
    vm.expectRevert("Ownable: caller is not the owner");
    broker.addExchangeProvider(address(0));
  }

  function test_addExchangeProvider_whenAddressIsZero_shouldRevert() public {
    changePrank(deployer);
    vm.expectRevert("ExchangeProvider address can't be 0");
    broker.addExchangeProvider(address(0));
  }

  function test_addExchangeProvider_whenSenderIsOwner_shouldUpdateAndEmit() public {
    changePrank(deployer);
    address newExchangeProvider = actor("newExchangeProvider");
    vm.expectEmit(true, false, false, false);
    emit ExchangeProviderAdded(newExchangeProvider);
    broker.addExchangeProvider(newExchangeProvider);
    address[] memory updatedExchangeProviders = broker.getExchangeProviders();
    assertEq(updatedExchangeProviders[updatedExchangeProviders.length - 1], newExchangeProvider);
    assertEq(broker.isExchangeProvider(newExchangeProvider), true);
  }

  function test_addExchangeProvider_whenAlreadyAdded_shouldRevert() public {
    changePrank(deployer);
    vm.expectRevert("ExchangeProvider already exists in the list");
    broker.addExchangeProvider(address(exchangeProvider));
  }

  function test_removeExchangeProvider_whenSenderIsOwner_shouldUpdateAndEmit() public {
    changePrank(deployer);
    vm.expectEmit(true, true, true, true);
    emit ExchangeProviderRemoved(exchangeProvider1);
    broker.removeExchangeProvider(exchangeProvider1, 0);
    assert(broker.getExchangeProviders()[0] != exchangeProvider1);
  }

  function test_removeExchangeProvider_whenAddressDoesNotExist_shouldRevert() public {
    changePrank(deployer);
    vm.expectRevert("index into exchangeProviders list not mapped to an exchangeProvider");
    broker.removeExchangeProvider(notDeployer, 1);
  }

  function test_removeExchangeProvider_whenIndexOutOfRange_shouldRevert() public {
    changePrank(deployer);
    vm.expectRevert("index into exchangeProviders list not mapped to an exchangeProvider");
    broker.removeExchangeProvider(exchangeProvider1, 1);
  }

  function test_removeExchangeProvider_whenNotOwner_shouldRevert() public {
    changePrank(notDeployer);
    vm.expectRevert("Ownable: caller is not the owner");
    broker.removeExchangeProvider(exchangeProvider1, 0);
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

contract BrokerTest_getAmounts is BrokerTest {
  bytes32 exchangeId = keccak256(abi.encode("exhcangeId"));

  function test_getAmountIn_whenExchangeProviderWasNotSet_shouldRevert() public {
    vm.expectRevert("ExchangeProvider does not exist");
    broker.getAmountIn(
      randomExchangeProvider,
      exchangeId,
      address(stableAsset),
      address(collateralAsset),
      1e24
    );
  }

  function test_getAmountIn_receivedCall() public {
    uint256 amountOut = 1e17;
    uint256 mockAmountIn = 1e16;

    vm.mockCall(
      address(exchangeProvider),
      abi.encodeWithSelector(
        exchangeProvider.getAmountIn.selector,
        exchangeId,
        address(stableAsset),
        address(collateralAsset),
        amountOut
      ),
      abi.encode(mockAmountIn)
    );

    uint256 amountIn = broker.getAmountIn(
      address(exchangeProvider),
      exchangeId,
      address(stableAsset),
      address(collateralAsset),
      amountOut
    );

    assertEq(amountIn, mockAmountIn);
  }

  function test_getAmountOut_whenExchangeProviderWasNotSet_shouldRevert() public {
    vm.expectRevert("ExchangeProvider does not exist");
    broker.getAmountOut(randomExchangeProvider, exchangeId, randomAsset, randomAsset, 1e24);
  }

  function test_getAmountOut_receivedCall() public {
    uint256 amountIn = 1e17;
    uint256 mockAmountOut = 1e16;

    vm.mockCall(
      address(exchangeProvider),
      abi.encodeWithSelector(
        exchangeProvider.getAmountOut.selector,
        exchangeId,
        address(stableAsset),
        address(collateralAsset),
        amountIn
      ),
      abi.encode(mockAmountOut)
    );

    uint256 amountOut = broker.getAmountOut(
      address(exchangeProvider),
      exchangeId,
      address(stableAsset),
      address(collateralAsset),
      amountIn
    );

    assertEq(amountOut, mockAmountOut);
  }
}

contract BrokerTest_swap is BrokerTest {
  bytes32 exchangeId = keccak256(abi.encode("exhcangeId"));

  function test_swapIn_whenAmoutOutMinNotMet_shouldRevert() public {
    uint256 amountIn = 1e16;
    uint256 mockAmountOut = 1e16;

    vm.mockCall(
      address(exchangeProvider),
      abi.encodeWithSelector(
        exchangeProvider.swapIn.selector,
        exchangeId,
        address(stableAsset),
        address(collateralAsset),
        amountIn
      ),
      abi.encode(mockAmountOut)
    );

    vm.expectRevert("amountOutMin not met");
    uint256 amountOut = broker.swapIn(
      address(exchangeProvider),
      exchangeId,
      address(stableAsset),
      address(collateralAsset),
      amountIn,
      1e17
    );
  }

  function test_swapOut_whenAmoutInMaxExceeded_shouldRevert() public {
    uint256 amountOut = 1e16;
    uint256 mockAmountIn = 1e16;

    vm.mockCall(
      address(exchangeProvider),
      abi.encodeWithSelector(
        exchangeProvider.swapOut.selector,
        exchangeId,
        address(stableAsset),
        address(collateralAsset),
        amountOut
      ),
      abi.encode(mockAmountIn)
    );

    vm.expectRevert("amountInMax exceeded");
    uint256 amountIn = broker.swapOut(
      address(exchangeProvider),
      exchangeId,
      address(stableAsset),
      address(collateralAsset),
      amountOut,
      1e15
    );
  }

  function test_swapIn_tokenInStableAsset_shouldUpdateAndEmit() public {
    deal(address(collateralAsset), address(reserve), 1e16);
    deal(address(collateralAsset), trader, 1e16);
    stableAsset.mint(address(broker), 1e16);
    stableAsset.mint(address(trader), 1e16);

    changePrank(trader);
    uint256 amountIn = 1e16;
    uint256 mockAmountOut = 1e16;

    vm.mockCall(
      address(exchangeProvider),
      abi.encodeWithSelector(
        exchangeProvider.swapIn.selector,
        exchangeId,
        address(stableAsset),
        address(collateralAsset),
        amountIn
      ),
      abi.encode(mockAmountOut)
    );

    vm.expectEmit(true, true, true, true);
    emit Swap(
      address(exchangeProvider),
      exchangeId,
      trader,
      address(stableAsset),
      address(collateralAsset),
      amountIn,
      1e16
    );
    uint256 amountOut = broker.swapIn(
      address(exchangeProvider),
      exchangeId,
      address(stableAsset),
      address(collateralAsset),
      amountIn,
      1e16
    );

    assertEq(1e16, amountOut);
    assertEq(stableAsset.balanceOf(trader), 0);
    assertEq(stableAsset.balanceOf(address(broker)), 1e16);
    assertEq(IERC20(collateralAsset).balanceOf(trader), 2e16);
    assertEq(IERC20(collateralAsset).balanceOf(address(reserve)), 0);
  }

  function test_swapIn_tokenInCollateralAsset_shouldUpdateAndEmit() public {
    deal(address(collateralAsset), address(reserve), 1e16);
    deal(address(collateralAsset), trader, 1e16);
    stableAsset.mint(address(broker), 1e16);
    stableAsset.mint(address(trader), 1e16);

    changePrank(trader);
    IERC20(collateralAsset).approve(address(broker), 1e16);
    uint256 amountIn = 1e16;
    uint256 mockAmountOut = 1e16;

    vm.mockCall(
      address(exchangeProvider),
      abi.encodeWithSelector(
        exchangeProvider.swapOut.selector,
        exchangeId,
        address(collateralAsset),
        address(stableAsset),
        amountIn
      ),
      abi.encode(mockAmountOut)
    );

    vm.expectEmit(true, true, true, true);
    emit Swap(
      address(exchangeProvider),
      exchangeId,
      trader,
      address(collateralAsset),
      address(stableAsset),
      amountIn,
      1e16
    );
    uint256 amountOut = broker.swapOut(
      address(exchangeProvider),
      exchangeId,
      address(collateralAsset),
      address(stableAsset),
      amountIn,
      1e16
    );

    assertEq(1e16, amountOut);
    assertEq(IERC20(collateralAsset).balanceOf(trader), 0);
    assertEq(IERC20(collateralAsset).balanceOf(address(reserve)), 2e16);
    assertEq(stableAsset.balanceOf(trader), 2e16);
  }

  function test_swapOut_tokenInStableAsset_shoulUpdateAndEmit() public {
    deal(address(collateralAsset), address(reserve), 1e16);
    deal(address(collateralAsset), trader, 1e16);
    stableAsset.mint(address(broker), 1e16);
    stableAsset.mint(address(trader), 1e16);

    changePrank(trader);
    uint256 amountOut = 1e16;
    uint256 mockAmountIn = 1e16;

    vm.mockCall(
      address(exchangeProvider),
      abi.encodeWithSelector(
        exchangeProvider.swapOut.selector,
        exchangeId,
        address(stableAsset),
        address(collateralAsset),
        amountOut
      ),
      abi.encode(mockAmountIn)
    );

    vm.expectEmit(true, true, true, true);
    emit Swap(
      address(exchangeProvider),
      exchangeId,
      trader,
      address(stableAsset),
      address(collateralAsset),
      amountOut,
      1e16
    );

    uint256 amountIn = broker.swapOut(
      address(exchangeProvider),
      exchangeId,
      address(stableAsset),
      address(collateralAsset),
      amountOut,
      1e16
    );

    assertEq(1e16, amountIn);
    assertEq(stableAsset.balanceOf(trader), 0);
    assertEq(stableAsset.balanceOf(address(broker)), 1e16);
    assertEq(IERC20(collateralAsset).balanceOf(trader), 2e16);
    assertEq(IERC20(collateralAsset).balanceOf(address(reserve)), 0);
  }

  function test_swapOut_tokenInCollateralAsset_shouldUpdateAndEmit() public {
    deal(address(collateralAsset), address(reserve), 1e16);
    deal(address(collateralAsset), trader, 1e16);
    stableAsset.mint(address(broker), 1e16);
    stableAsset.mint(address(trader), 1e16);

    changePrank(trader);
    IERC20(collateralAsset).approve(address(broker), 1e16);
    uint256 amountOut = 1e16;
    uint256 mockAmountIn = 1e16;

    vm.mockCall(
      address(exchangeProvider),
      abi.encodeWithSelector(
        exchangeProvider.swapOut.selector,
        exchangeId,
        address(collateralAsset),
        address(stableAsset),
        amountOut
      ),
      abi.encode(mockAmountIn)
    );

    vm.expectEmit(true, true, true, true);
    emit Swap(
      address(exchangeProvider),
      exchangeId,
      trader,
      address(collateralAsset),
      address(stableAsset),
      amountOut,
      1e16
    );
    uint256 amountIn = broker.swapOut(
      address(exchangeProvider),
      exchangeId,
      address(collateralAsset),
      address(stableAsset),
      amountOut,
      1e16
    );

    assertEq(1e16, amountIn);
    assertEq(IERC20(collateralAsset).balanceOf(trader), 0);
    assertEq(IERC20(collateralAsset).balanceOf(address(reserve)), 2e16);
    assertEq(stableAsset.balanceOf(trader), 2e16);
  }

  function test_swapOut_whenExchangeManagerWasNotSet_shouldRevert() public {
    vm.expectRevert("ExchangeProvider does not exist");
    broker.swapOut(randomExchangeProvider, exchangeId, randomAsset, randomAsset, 2e24, 1e24);
  }
}
