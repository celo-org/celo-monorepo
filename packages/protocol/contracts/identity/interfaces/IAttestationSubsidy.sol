pragma solidity ^0.5.3;

interface IAttestationSubsidy {
  function requestAttestationsWithSubsidy(
    address beneficiaryMetaWallet,
    bytes32 identifier,
    uint256 attestationsRequested,
    uint8[] v,
    bytes32[] r,
    bytes32[] s
  ) external;
}
