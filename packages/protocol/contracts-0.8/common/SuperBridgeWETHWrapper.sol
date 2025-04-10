// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.15;

import "../../contracts/common/Initializable.sol";
import "@openzeppelin/contracts8/access/Ownable.sol";
import "./interfaces/IStandardBridge.sol";
import "./interfaces/IWETH.sol";


contract SuperBridgeWETHWrapper is Initializable, Ownable{

  IWETH public wethAddressLocal;
  address public wethAddressRemote;
  IStandardBridge public standardBridge;

  event WrappedAndBridged(
    address indexed sender,
    uint256 amount
  );

   /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) Initializable(test) {}

  /**
    * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
    * @param _wethAddressLocal The address of the registry core smart contract.
    * @param _wethAddressRemote The address of the registry core smart contract.
    * @param _standardBridge The address of the standard bridge contract.
   */
  function initialize(
    address _wethAddressLocal,
    address _wethAddressRemote,
    address _standardBridge
  ) external initializer {
    require(
      _wethAddressLocal != address(0) &&
        _wethAddressRemote != address(0) &&
        _standardBridge != address(0),
      "Invalid address"
    );
    _transferOwnership(msg.sender);
    wethAddressLocal = IWETH(_wethAddressLocal);
    wethAddressRemote = _wethAddressRemote;
    standardBridge = IStandardBridge(_standardBridge);
  }

  function wrapAndBridge() public payable {
    require(msg.value > 0, "No ETH sent");

    // Wrap the ETH
    wethAddressLocal.deposit{value: msg.value}();

    // Approve the Standard Bridge to spend the WETH
    wethAddressLocal.approve(address(standardBridge), msg.value); // TODO: Should we approve max instead from time to time?

    // Bridge the WETH to the recipient
    standardBridge.bridgeERC20To(
      address(wethAddressLocal),
      address(wethAddressRemote),
      msg.sender,
      msg.value,
      0,
      ""
    );
    emit WrappedAndBridged(msg.sender, msg.value);
  }

}
