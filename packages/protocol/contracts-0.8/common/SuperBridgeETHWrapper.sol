// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.15;

import "../../contracts/common/Initializable.sol";
import "@openzeppelin/contracts8/access/Ownable.sol";
import "./interfaces/IStandardBridge.sol";
import "./interfaces/IWETH.sol";

contract SuperBridgeETHWrapper is Initializable, Ownable {
  IWETH public wethLocal;
  address public wethAddressRemote;
  IStandardBridge public standardBridge;

  event WrappedAndBridged(address indexed sender, uint256 amount);

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _wethAddressLocal The address of the registry core smart contract.
   * @param _wethAddressRemote The address of the registry core smart contract.
   * @param _standardBridgeAddress The address of the standard bridge contract.
   */
  function initialize(
    address _wethAddressLocal,
    address _wethAddressRemote,
    address _standardBridgeAddress
  ) external initializer {
    _setAddresses(_wethAddressLocal, _wethAddressRemote, _standardBridgeAddress);
    _transferOwnership(msg.sender);
  }

  /**
   * @notice Wraps the ETH and bridges it to the recipient.
   * @param to The address of the recipient on the other chain.
   * @param minGasLimit The minimum gas limit for the bridge transaction.
   */
  function wrapAndBridge(address to, uint32 minGasLimit) public payable {
    require(msg.value > 0, "No ETH sent");

    // Wrap the ETH
    wethLocal.deposit{ value: msg.value }();

    // Approve the Standard Bridge to spend the WETH
    wethLocal.approve(address(standardBridge), msg.value);

    // Bridge the WETH to the recipient
    standardBridge.bridgeERC20To(
      address(wethLocal),
      address(wethAddressRemote),
      to,
      msg.value,
      minGasLimit,
      ""
    );
    emit WrappedAndBridged(msg.sender, msg.value);
  }

  /*
   * @notice Set the addresses of the WETH and Standard Bridge contracts.
   * @param wethLocal The address of the local WETH contract.
   * @param _wethAddressRemote The address of the remote WETH contract.
   * @param _standardBridgeAddress The address of the Standard Bridge contract.
   */
  function setAddresses(
    address wethLocal,
    address _wethAddressRemote,
    address _standardBridgeAddress
  ) external onlyOwner {
    _setAddresses(wethLocal, _wethAddressRemote, _standardBridgeAddress);
  }

  function _setAddresses(
    address _wethAddressLocal,
    address _wethAddressRemote,
    address _standardBridgeAddress
  ) internal {
    require(
      _wethAddressLocal != address(0) &&
        _wethAddressRemote != address(0) &&
        _standardBridgeAddress != address(0),
      "Invalid address"
    );
    wethLocal = IWETH(_wethAddressLocal);
    wethAddressRemote = _wethAddressRemote;
    standardBridge = IStandardBridge(_standardBridgeAddress);
  }
}
