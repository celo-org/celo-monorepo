pragma solidity ^0.5.13;

import "./IdentityProxy.sol";

contract IdentityProxyHub {
  mapping(bytes32 => IdentityProxy) public identityProxies;

  function getIdentityProxy(bytes32 identifier) public returns (IdentityProxy) {
    if (address(identityProxies[identifier]) == address(0)) {
      identityProxies[identifier] = new IdentityProxy();
    }

    return identityProxies[identifier];
  }

  function makeCall(bytes32 identifier, address destination, uint256 value, bytes calldata data)
    external
  {
    getIdentityProxy(identifier).makeCall(destination, value, data);
  }
}
