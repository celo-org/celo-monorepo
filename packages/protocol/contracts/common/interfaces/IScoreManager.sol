// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9;

interface IScoreManager {
  function setGroupScore(address group, uint256 score) external;
  function setValidatorScore(address validator, uint256 score) external;
  function getValidatorScore(address validator) external view returns (uint256);
  function getGroupScore(address validator) external view returns (uint256);
  function owner() external view returns (address);
}
