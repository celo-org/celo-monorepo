pragma solidity ^0.5.13;

library LibraryProxyShim {
  function _setRegistry(address registryAddress) public {}

  function _getRegistry() public view returns (address) {
    return address(0);
  }
}
