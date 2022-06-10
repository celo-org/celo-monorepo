pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/SafeCast.sol";

/**
 * @title A mock FederatedAttestations for testing.
 */
contract MockFederatedAttestations {
  using SafeMath for uint256;
  using SafeCast for uint256;

  mapping(bytes32 => mapping(address => OwnershipAttestation[])) public identifierToAttestations;
  mapping(address => mapping(address => bytes32[])) public addressToIdentifiers;
  mapping(bytes32 => bool) public revokedAttestations;

  struct OwnershipAttestation {
    address account;
    address signer;
    uint64 issuedOn;
    uint64 publishedOn;
  }

  function getNumAttestations(bytes32 identifier, address[] memory trustedIssuers)
    internal
    view
    returns (uint256, uint256[] memory)
  {
    uint256 totalAttestations = 0;
    uint256 numAttestationsForIssuer;
    uint256[] memory countsPerIssuer = new uint256[](trustedIssuers.length);

    for (uint256 i = 0; i < trustedIssuers.length; i = i.add(1)) {
      numAttestationsForIssuer = identifierToAttestations[identifier][trustedIssuers[i]].length;
      totalAttestations = totalAttestations.add(numAttestationsForIssuer);
      countsPerIssuer[i] = numAttestationsForIssuer;
    }
    return (totalAttestations, countsPerIssuer);
  }

  function lookupAttestations(bytes32 identifier, address[] calldata trustedIssuers)
    external
    view
    returns (uint256[] memory, address[] memory, uint256[] memory, address[] memory)
  {
    return _lookupAttestations(identifier, trustedIssuers);
  }

  function _lookupAttestations(bytes32 identifier, address[] memory trustedIssuers)
    internal
    view
    returns (uint256[] memory, address[] memory, uint256[] memory, address[] memory)
  {
    uint256 totalAttestations;
    uint256[] memory countsPerIssuer;

    (totalAttestations, countsPerIssuer) = getNumAttestations(identifier, trustedIssuers);

    address[] memory accounts = new address[](totalAttestations);
    uint256[] memory issuedOns = new uint256[](totalAttestations);
    address[] memory signers = new address[](totalAttestations);

    OwnershipAttestation[] memory attestationsPerIssuer;
    totalAttestations = 0;

    for (uint256 i = 0; i < trustedIssuers.length; i = i.add(1)) {
      attestationsPerIssuer = identifierToAttestations[identifier][trustedIssuers[i]];
      for (uint256 j = 0; j < attestationsPerIssuer.length; j = j.add(1)) {
        accounts[totalAttestations] = attestationsPerIssuer[j].account;
        issuedOns[totalAttestations] = attestationsPerIssuer[j].issuedOn;
        signers[totalAttestations] = attestationsPerIssuer[j].signer;
        totalAttestations = totalAttestations.add(1);
      }
    }
    return (countsPerIssuer, accounts, issuedOns, signers);
  }

  function registerAttestation(
    bytes32 identifier,
    address issuer,
    address account,
    address,
    uint64,
    uint8,
    bytes32,
    bytes32
  ) external {
    OwnershipAttestation memory attestation = OwnershipAttestation(
      account,
      issuer,
      uint64(block.timestamp),
      uint64(block.timestamp)
    );
    identifierToAttestations[identifier][issuer].push(attestation);
    addressToIdentifiers[account][issuer].push(identifier);
  }

  function registerAttestationAsIssuer(
    bytes32 identifier,
    address issuer,
    address account,
    address,
    uint64
  ) external {
    OwnershipAttestation memory attestation = OwnershipAttestation(
      account,
      issuer,
      uint64(block.timestamp),
      uint64(block.timestamp)
    );
    identifierToAttestations[identifier][issuer].push(attestation);
    addressToIdentifiers[account][issuer].push(identifier);
  }
}

