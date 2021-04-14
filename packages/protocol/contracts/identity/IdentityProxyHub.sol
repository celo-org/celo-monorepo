pragma solidity ^0.5.13;

import "../common/Create2.sol";
import "../common/UsingRegistry.sol";
import "./IdentityProxy.sol";

contract IdentityProxyHub is UsingRegistry {
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

  function passesIdentityHeuristic(address addr, bytes32 identifier) public returns (bool) {
    IAttestations attestations = getAttestations();
    (uint32 completed, uint32 requested) = attestations.getAttestationStats(identifier, addr);

    bool hasEnoughCompletions = completed >= 3;

    bool completedOverHalfRequests = false;
    if (completed > 0) {
      completedOverHalfRequests = requested / completed < 2;
    }

    bool hasMostCompletions = true;
    address[] memory addresses = attestations.lookupAccountsForIdentifier(identifier);
    for (uint256 i = 0; i < addresses.length; i++) {
      address otherAddr = addresses[i];
      if (otherAddr != addr) {
        (uint32 otherCompleted, uint32 _requested) = attestations.getAttestationStats(
          identifier,
          otherAddr
        );
        if (otherCompleted > completed) {
          hasMostCompletions = false;
          break;
        }
      }
    }

    return hasEnoughCompletions && completedOverHalfRequests && hasMostCompletions;
  }

  function makeCall(bytes32 identifier, address destination, uint256 value, bytes calldata data)
    external
  {
    require(passesIdentityHeuristic(msg.sender, identifier));
    getOrDeployIdentityProxy(identifier).makeCall(destination, value, data);
  }

  function deployIdentityProxy(bytes32 identifier) internal returns (IdentityProxy) {
    return IdentityProxy(Create2.deploy(identifier, type(IdentityProxy).creationCode));
  }
}
