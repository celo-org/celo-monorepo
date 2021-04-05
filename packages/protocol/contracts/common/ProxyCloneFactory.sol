// SPDX-License-Identifier: MIT
pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./CloneFactory.sol";
import "./ProxyV2.sol";

contract ProxyCloneFactory is CloneFactory, Ownable {
  event ProxyCreated(ProxyV2 proxy);

  address public proxyAddress;

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
}
