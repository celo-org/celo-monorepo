pragma solidity >=0.5.13 <0.9.0;
// TODO change to just MultiSig

interface IGovernanceApproverMultiSigInitializer {
  function initialize(
    address[] calldata _owners,
    uint256 _required,
    uint256 _internalRequired
  ) external;
}
