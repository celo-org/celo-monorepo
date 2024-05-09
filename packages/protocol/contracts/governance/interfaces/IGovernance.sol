// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IGovernance {
  function removeVotesWhenRevokingDelegatedVotes(
    address account,
    uint256 maxAmountAllowed
  ) external;
  function votePartially(
    uint256 proposalId,
    uint256 index,
    uint256 yesVotes,
    uint256 noVotes,
    uint256 abstainVotes
  ) external returns (bool);

  function setConstitution(address destination, bytes4 functionId, uint256 threshold) external;

  function isVoting(address) external view returns (bool);
  function getAmountOfGoldUsedForVoting(address account) external view returns (uint256);

  function getProposal(
    uint256 proposalId
  ) external view returns (address, uint256, uint256, uint256, string memory, uint256, bool);

  function getReferendumStageDuration() external view returns (uint256);
}
