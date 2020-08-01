pragma solidity ^0.5.3;

interface IAttestationSubsidy {
  function requestAttestationsWithSubsidy(
    address beneficiaryMetaWallet,
    bytes32 identifier,
    uint256 attestationsRequested,
    uint8[] calldata v,
    bytes32[] calldata r,
    bytes32[] calldata s
  ) external;
}
