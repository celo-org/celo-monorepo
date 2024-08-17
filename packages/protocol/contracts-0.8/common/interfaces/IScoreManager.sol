// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

interface IScoreManager {
  function setUptimes(address group, uint256[] calldata _uptimes) external;
  function setValidatorScore(address group, uint256 score) external;

  function getUptimes(address group) external view returns (uint256[] memory);
  function getValidatorScore(address group) external view returns (uint256);
}
