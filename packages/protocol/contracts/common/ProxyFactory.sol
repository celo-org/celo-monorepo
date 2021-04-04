pragma solidity ^0.5.13;
/* solhint-disable no-inline-assembly, no-complex-fallback, avoid-low-level-calls */

import "./Proxy.sol";

/**
 * @title A ProxyFactory
 */
contract ProxyFactory {
  event ProxyCreated(Proxy proxy);

  function createProxy() external {
    Proxy proxy = new Proxy();
    proxy._transferOwnership(msg.sender);
    emit ProxyCreated(proxy);
  }
}
