pragma solidity ^0.5.13;

// TODO ASv2 add external, view, and only owner function sigs
// separated into these three groups for clarity
interface IFederatedAttestations {
  function lookupAttestations(bytes32, address[] calldata)
    external
    view
    returns (uint256[] memory, address[] memory, uint256[] memory, address[] memory);
}
