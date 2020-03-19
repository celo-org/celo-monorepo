pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title A mock Attestations for testing.
 */
contract MockAttestations {
  enum AttestationStatus { None, Incomplete, Complete }

  struct Attestation {
    AttestationStatus status;
    uint128 time;
  }

  struct Attestations {
    uint64 completed;
    address[] issuers;
    mapping(address => Attestation) issuedAttestations;
  }

  struct IdentifierState {
    address[] accounts;
    mapping(address => Attestations) attestations;
  }

  mapping(bytes32 => IdentifierState) identifiers;

  function complete(bytes32 identifier, uint8, bytes32, bytes32) external {
    identifiers[identifier].attestations[msg.sender].completed++;
  }

  function getMaxAttestations() external pure returns (uint256) {
    return 20;
  }

  function getAttestationStats(bytes32 identifier, address account)
    external
    view
    returns (uint64, uint64)
  {
    return (
      identifiers[identifier].attestations[account].completed,
      uint64(identifiers[identifier].attestations[account].issuers.length)
    );
  }
}
