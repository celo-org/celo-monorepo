pragma solidity ^0.5.13;

import "./Proxy.sol";

/**
 * @title A Proxy utilizing the Unstructured Storage pattern.
 * @dev This proxy is intended to be used in conjunction with EIP-1167 minimal proxies.
 */
contract InitializableProxy is Proxy {
  /**
   * @notice Sets the proxy owner if it hasn't already been set.
   * @param owner The address allowed to repoint the proxy to a new implementation.
   * @dev Note that anyone is allowed to set the proxy owner if it is set to the null address.
   */
  function _initialize(address owner) external {
    require(_getOwner() == address(0), "Owner already set");
    _setOwner(owner);
  }
}
