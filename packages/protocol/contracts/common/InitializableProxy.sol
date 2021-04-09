pragma solidity ^0.5.13;

import "./Proxy.sol";

/**
 * @title A Proxy utilizing the Unstructured Storage pattern.
 * @dev This proxy is intended to be used in conjunction with EIP-1167 minimal proxies.
 */
contract InitializableProxy is Proxy {
  function _initialize(address owner) external {
    require(_getOwner() == address(0));
    _setOwner(owner);
  }
}
