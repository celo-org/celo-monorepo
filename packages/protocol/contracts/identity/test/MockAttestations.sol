pragma solidity ^0.5.13;

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
    uint32 completed;
    uint32 requested;
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

    if (identifiers[identifier].attestations[msg.sender].completed == 1) {
      identifiers[identifier].accounts.push(msg.sender);
    }
  }

  function request(bytes32 identifier, uint8, bytes32, bytes32) external {
    identifiers[identifier].attestations[msg.sender].requested++;
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
      identifiers[identifier].attestations[account].requested
    );
  }

  function lookupAccountsForIdentifier(bytes32 identifier)
    external
    view
    returns (address[] memory)
  {
    return identifiers[identifier].accounts;
  }
}
