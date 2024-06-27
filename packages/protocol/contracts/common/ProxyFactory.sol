pragma solidity ^0.5.13;

import "./Proxy.sol";
import "./interfaces/IProxyFactory.sol";

contract ProxyFactory is IProxyFactory {
  // Deploys a new proxy contract and transfers ownership to the provided address
  function deployProxy(address owner) external returns (address) {
    return _deployProxy(owner);
  }

  // Deploys a new proxy contract and transfers ownership to the sender
  function deployProxy() external returns (address) {
    return _deployProxy(msg.sender);
  }

  // Deploys a new proxy contract and transfers ownership to the provided address
  function _deployProxy(address owner) private returns (address) {
    Proxy proxy = new Proxy();
    proxy._transferOwnership(owner);
    return address(proxy);
  }
}
