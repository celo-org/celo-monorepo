// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IGovernance {
  function isVoting(address) external view returns (bool);
  function getAmountOfGoldUsedForVoting(address account) external view returns (uint256);
}
