pragma solidity ^0.5.13;

import "../common/Create2.sol";
import "../common/UsingRegistry.sol";
import "./IdentityProxy.sol";

contract IdentityProxyHub is UsingRegistry {
  bytes32 public constant identityProxyCodeHash = keccak256(
    // solhint-disable-next-line indent
    abi.encodePacked(type(IdentityProxy).creationCode)
  );

  /**
   * @notice Returns the IdentityProxy address corresponding to the identifier.
   * @param identifier The identifier whose proxy address is computed.
   * @return The identifier's IdentityProxy address.
   * @dev This function will return a correct address whether or not the
   * corresponding IdentityProxy has been deployed. IdentityProxies are deployed
   * using CREATE2 and this computes a CREATE2 address.
   */
  function getIdentityProxy(bytes32 identifier) public view returns (IdentityProxy) {
    return IdentityProxy(Create2.computeAddress(address(this), identifier, identityProxyCodeHash));
  }

  /**
   * @notice Returns the IdentityProxy address corresponding to the identifier,
   * deploying an IdentityProxy if one hasn't already been deployed for this
   * identifier.
   * @param identifier The identifier whose proxy address is returned.
   * @return The identifier's IdentityProxy address.
   */
  function getOrDeployIdentityProxy(bytes32 identifier) public returns (IdentityProxy) {
    IdentityProxy identityProxy = getIdentityProxy(identifier);
    uint256 codeSize;
    assembly {
      codeSize := extcodesize(identityProxy)
    }
    if (codeSize == 0) {
      deployIdentityProxy(identifier);
    }

    return identityProxy;
  }

  /**
   * @notice Returns true if the given address is the likely owner of the given
   * identifier.
   * @param addr The address to check.
   * @param identifier The identifier to check.
   * @return True if the given address is the likely owner of the given
   * identifier, false otherwise.
   */
  function passesIdentityHeuristic(address addr, bytes32 identifier) public view returns (bool) {
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
        hasMostCompletions = hasMostCompletions && otherCompleted <= completed;
      }
    }

    return hasEnoughCompletions && completedOverHalfRequests && hasMostCompletions;
  }

  /**
   * @notice Performs an arbitrary call through the identifier's IdentityProxy,
   * assuming msg.sender passes the identity heuristic.
   * @param identifier The identifier whose IdentityProxy to call through.
   * @param destination The address the IdentityProxy should call.
   * @param data The calldata the IdentityProxy should send with the call.
   */
  function makeCall(bytes32 identifier, address destination, bytes calldata data) external payable {
    require(passesIdentityHeuristic(msg.sender, identifier));
    getOrDeployIdentityProxy(identifier).makeCall.value(msg.value)(destination, data);
  }

  function deployIdentityProxy(bytes32 identifier) internal returns (IdentityProxy) {
    // solhint-disable-next-line indent
    return IdentityProxy(Create2.deploy(identifier, type(IdentityProxy).creationCode));
  }
}
