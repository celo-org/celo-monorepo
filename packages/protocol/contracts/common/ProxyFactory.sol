pragma solidity ^0.5.13;

import "./Proxy.sol";
import "./interfaces/IProxyFactory.sol";

/**
 * @title Used for deploying Proxy contracts.
 */
contract ProxyFactory is IProxyFactory {
  /**
   * @notice Deploys a new proxy contract and transfers ownership to the sender
   * @return Address of the deployed proxy.
   */
  function deployProxy() external returns (address) {
    return deployProxy(msg.sender);
  }

  /**
   * @notice Deploys a new proxy contract and transfers ownership to the provided address
   * @param owner The address to transfer ownership to.
   * @return Address of the deployed proxy.
   */
  function deployProxy(address owner) public returns (address) {
    Proxy proxy = new Proxy();
    proxy._transferOwnership(owner);
    return address(proxy);
  }
}
