// SPDX-License-Identifier: MIT
pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./CloneFactory.sol";
import "./Proxy.sol";

contract ProxyCloneFactory is CloneFactory18, Ownable {
  event ProxyCreated(Proxy proxy);

  address public proxyAddress;

  function setProxyAddress(address _proxyAddress) external onlyOwner {
    proxyAddress = _proxyAddress;
  }

  function createProxy() external {
    Proxy proxy = Proxy(createClone(proxyAddress));
    proxy._transferOwnership(msg.sender);
    emit ProxyCreated(proxy);
  }
}
