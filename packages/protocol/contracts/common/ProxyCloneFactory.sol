// SPDX-License-Identifier: MIT
pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./CloneFactory.sol";
import "./ProxyV2.sol";

contract ProxyCloneFactory is CloneFactory, Ownable {
  event ProxyCreated(ProxyV2 proxy);

  address public proxyAddress;

  function() external payable {}

  function setProxyAddress(address _proxyAddress) external onlyOwner {
    proxyAddress = _proxyAddress;
  }

  function deploy(address owner, address implementation, bytes calldata initCallData) external {
    ProxyV2 proxy = ProxyV2(createClone(proxyAddress));
    proxy._initialize(address(this));
    proxy._setAndInitializeImplementation(implementation, initCallData);
    proxy._transferOwnership(owner);
    emit ProxyCreated(proxy);
  }

  function deployV2(address implementation, bytes calldata initCallData) external {
    ProxyV2 proxy = ProxyV2(createClone(proxyAddress));
    proxy._initialize(address(this));
    proxy._setAndInitializeImplementation(implementation, initCallData);
    // TODO(asa): This is different, I believe in current komenci we transfer ownership to the user?
    proxy._transferOwnership(address(proxy));
    emit ProxyCreated(proxy);
  }

  function deployAndFund(
    address owner,
    address implementation,
    bytes calldata initCallData,
    address token,
    uint256 value
  ) external {
    ProxyV2 proxy = ProxyV2(createClone(proxyAddress));
    proxy._initialize(address(this));
    proxy._setAndInitializeImplementation(implementation, initCallData);
    proxy._transferOwnership(owner);
    IERC20(token).transferFrom(msg.sender, address(proxy), value);
    emit ProxyCreated(proxy);
  }

  function deployAndFundV2(
    address implementation,
    bytes calldata initCallData,
    address token,
    uint256 value
  ) external {
    ProxyV2 proxy = ProxyV2(createClone(proxyAddress));
    proxy._initialize(address(this));
    proxy._setAndInitializeImplementation(implementation, initCallData);
    // TODO(asa): This is different, I believe in current komenci we transfer ownership to the user?
    proxy._transferOwnership(address(proxy));
    IERC20(token).transferFrom(msg.sender, address(proxy), value);
    emit ProxyCreated(proxy);
  }

  function deployAndFundV3(
    address implementation,
    bytes calldata initCallData,
    address token,
    uint256 value
  ) external {
    ProxyV2 proxy = ProxyV2(createClone(proxyAddress));
    proxy._initialize(address(this));
    // Set this contract as the signer
    proxy._setAndInitializeImplementation(implementation, initCallData);
    // Call MetaTransactionWallet(proxy).executeTransactions([approve cUSD, set signer])
    // TODO(asa): This is different, I believe in current komenci we transfer ownership to the user?
    proxy._transferOwnership(address(proxy));
    IERC20(token).transferFrom(msg.sender, address(proxy), value);
    emit ProxyCreated(proxy);
  }
}
