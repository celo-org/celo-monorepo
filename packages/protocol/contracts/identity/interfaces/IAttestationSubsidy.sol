pragma solidity ^0.5.3;

interface IAttestationSubsidy {
  function requestAttestationsWithSubsidy(
    address,
    bytes32,
    uint8,
    bytes32,
    bytes32,
    bytes32,
    uint8,
    bytes32,
    bytes32
  ) external;
}
