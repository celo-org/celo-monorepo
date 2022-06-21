pragma solidity ^0.5.13;

interface IFederatedAttestations {
  function registerAttestationAsIssuer(
    bytes32 identifier,
    address issuer,
    address account,
    uint64 issuedOn
  ) external;
  function registerAttestation(
    bytes32 identifier,
    address issuer,
    address account,
    address signer,
    uint64 issuedOn,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external;
  function revokeAttestation(bytes32, address, address) external;
  function batchRevokeAttestations(
    address issuer,
    bytes32[] calldata identifiers,
    address[] calldata accounts
  ) external;

  // view functions
  function lookupAttestations(bytes32, address[] calldata)
    external
    view
    returns (
      uint256[] memory,
      address[] memory,
      address[] memory,
      uint64[] memory,
      uint64[] memory
    );
  function lookupIdentifiers(address, address[] calldata)
    external
    view
    returns (uint256[] memory, bytes32[] memory);

  function validateAttestationSig(
    bytes32 identifier,
    address issuer,
    address account,
    address signer,
    uint64 issuedOn,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external view;
}
