// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IScoreManager {
  function getValidatorScore(address validator) external view returns (uint256);
  function getGroupScore(address validator) external view returns (uint256);
}
