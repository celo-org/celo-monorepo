// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

interface IScoreReader {
  function getValidatorScore(address validator) external view returns (uint256);
  function getGroupScore(address validator) external view returns (uint256);
}
