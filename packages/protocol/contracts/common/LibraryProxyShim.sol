pragma solidity ^0.5.13;

/**
 * @dev A workaround for easily `delegatecall`ing to a linked proxied library's
 * LibraryProxy.
 */
library LibraryProxyShim {
  function _setRegistry(address registryAddress) public {}

  function _getRegistry() public view returns (address) {
    return address(0);
  }
}
