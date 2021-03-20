pragma solidity ^0.5.13;

import "../common/Create2.sol";
import "./IdentityProxy.sol";

contract IdentityProxyHub {
  bytes32 public constant identityProxyCodeHash = keccak256(
    abi.encodePacked(type(IdentityProxy).creationCode)
  );

  mapping(bytes32 => IdentityProxy) public identityProxies;

  function getIdentityProxy(bytes32 identifier) public view returns (IdentityProxy) {
    return IdentityProxy(Create2.computeAddress(address(this), identifier, identityProxyCodeHash));
  }

  function getOrDeployIdentityProxy(bytes32 identifier) public returns (IdentityProxy) {
    IdentityProxy identityProxy = identityProxies[identifier];
    if (address(identityProxy) == address(0)) {
      identityProxy = deployIdentityProxy(identifier);
      identityProxies[identifier] = identityProxy;
    }

    return identityProxy;
  }

  function makeCall(bytes32 identifier, address destination, uint256 value, bytes calldata data)
    external
  {
    getOrDeployIdentityProxy(identifier).makeCall(destination, value, data);
  }

  function deployIdentityProxy(bytes32 identifier) internal returns (IdentityProxy) {
    return IdentityProxy(Create2.deploy(identifier, type(IdentityProxy).creationCode));
  }
}
