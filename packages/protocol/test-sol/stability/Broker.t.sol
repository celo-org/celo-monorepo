pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test, console2 as console } from "celo-foundry/Test.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { Broker } from "contracts/stability/Broker.sol";
import { IMentoExchange } from "contracts/stability/interfaces/deprecate/IMentoExchange.sol";
import { IExchangeManager } from "contracts/stability/interfaces/IExchangeManager.sol";
import { IBiPoolManager } from "contracts/stability/interfaces/IBiPoolManager.sol";
import { IPricingModule } from "contracts/stability/interfaces/IPricingModule.sol";
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
  IPricingModule pricingModule;

  uint256 constant initialStableBucket = 1e24;
  uint256 constant initialCollateralBucket = 2e24;

  IReserve reserve;

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
    trader = actor("trader");
    pricingModule = IPricingModule(actor("pricingModule"));

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
    address[] memory exchangeManagers = new address[](3);
    exchangeManagers[0] = address(actor("exchangeManager1"));
    exchangeManagers[1] = address(actor("exchangeManager2"));
    exchangeManagers[2] = address(actor("exchangeManager"));
    broker.initialize(exchangeManagers, address(reserve));
    changePrank(trader);
  }

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
    assert(broker.getExchangeManagers()[0] != actor("exchangeManager1"));
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

contract BrokerTest_quote is BrokerTest {
  bytes32 exchangeId = keccak256(abi.encode("exhcangeId"));
  string exchangeAddress3;
  string token1;
  string token2;

  function test_getAmountIn_whenExchangeManagerWasNotSet_shouldRevert() public {
    vm.expectRevert("ExchangeManager does not exist");
    broker.getAmountIn(
      actor(exchangeAddress3),
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
      actor("exchangeManager"),
      abi.encodeWithSelector(
        exchangeManager.getAmountIn.selector,
        exchangeId,
        address(stableAsset),
        address(collateralAsset),
        amountOut
      ),
      abi.encode(mockAmountIn)
    );

    uint256 amountIn = broker.getAmountIn(
      actor("exchangeManager"),
      exchangeId,
      address(stableAsset),
      address(collateralAsset),
      amountOut
    );

    assertEq(amountIn, mockAmountIn);
  }

  function test_getAmountOut_whenExchangeManagerWasNotSet_shouldRevert() public {
    vm.expectRevert("ExchangeManager does not exist");
    broker.getAmountOut(actor(exchangeAddress3), exchangeId, actor(token1), actor(token2), 1e24);
  }

  function test_getAmountOut_receivedCall() public {
    uint256 amountIn = 1e17;
    uint256 mockAmountOut = 1e16;

    vm.mockCall(
      actor("exchangeManager"),
      abi.encodeWithSelector(
        exchangeManager.getAmountOut.selector,
        exchangeId,
        address(stableAsset),
        address(collateralAsset),
        amountIn
      ),
      abi.encode(mockAmountOut)
    );

    uint256 amountOut = broker.getAmountOut(
      actor("exchangeManager"),
      exchangeId,
      address(stableAsset),
      address(collateralAsset),
      amountIn
    );

    assertEq(amountOut, mockAmountOut);
  }

  function test_swapIn_whenExchangeManagerWasNotSet_shouldRevert() public {
    vm.expectRevert("ExchangeManager does not exist");
    broker.swapIn(actor(exchangeAddress3), exchangeId, actor(token1), actor(token2), 2e24, 1e24);
  }

  function test_swapOut_whenExchangeManagerWasNotSet_shouldRevert() public {
    vm.expectRevert("ExchangeManager does not exist");
    broker.getAmountIn(actor(exchangeAddress3), exchangeId, actor(token1), actor(token2), 1e24);
  }

}

contract BrokerTest_swap is BrokerTest {}
