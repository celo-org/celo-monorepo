pragma solidity >=0.5.13 <0.9.0;

interface IFederatedAttestations {
  function registerAttestationAsIssuer(
    bytes32 identifier,
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
  function revokeAttestation(bytes32 identifier, address issuer, address account) external;
  function batchRevokeAttestations(
    address issuer,
    bytes32[] calldata identifiers,
    address[] calldata accounts
  ) external;

  // view functions
  function lookupAttestations(
    bytes32 identifier,
    address[] calldata trustedIssuers
  )
    external
    view
    returns (
      uint256[] memory,
      address[] memory,
      address[] memory,
      uint64[] memory,
      uint64[] memory
    );
  function lookupIdentifiers(
    address account,
    address[] calldata trustedIssuers
  ) external view returns (uint256[] memory, bytes32[] memory);
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
  function getUniqueAttestationHash(
    bytes32 identifier,
    address issuer,
    address account,
    address signer,
    uint64 issuedOn
  ) external pure returns (bytes32);

  // public state variable getters
  function identifierToAttestations(
    bytes32 identifier,
    address issuer,
    uint256 index
  ) external view returns (address account, address signer, uint64 issuedOn, uint64 publishedOn);
  function addressToIdentifiers(
    address account,
    address issuer,
    uint256 index
  ) external view returns (bytes32);
  function revokedAttestations(bytes32 attestationHash) external view returns (bool);
  function eip712DomainSeparator() external view returns (bytes32);
  function EIP712_OWNERSHIP_ATTESTATION_TYPEHASH() external view returns (bytes32);
  function MAX_ATTESTATIONS_PER_IDENTIFIER() external view returns (uint256);
  function MAX_IDENTIFIERS_PER_ADDRESS() external view returns (uint256);
}
