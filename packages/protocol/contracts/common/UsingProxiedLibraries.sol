pragma solidity ^0.5.13;

import "./LibraryProxyShim.sol";

/**
 * @notice A helper contract that abstracts away some of the boilerplate around
 * proxied libraries.
 */
contract UsingProxiedLibraries {
  function setLibraryRegistry(address registryAddress) internal {
    LibraryProxyShim._setRegistry(registryAddress);
  }

  function getLibraryRegistry() public view returns (address) {
    return LibraryProxyShim._getRegistry();
  }
}
