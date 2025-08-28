// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IGovernanceSlasher {
  function setSlasherExecuter(address _slasherExecuter) external;
  function approveSlashing(address account, uint256 penalty) external;
  function getApprovedSlashing(address account) external view returns (uint256);
  function slash(
    address account,
    address group,
    address[] calldata electionLessers,
    address[] calldata electionGreaters,
    uint256[] calldata electionIndices
  ) external returns (bool);
}
