// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

import "./IScoreManager.sol";

interface IScoreManagerGovernance is IScoreManager {
  function setGroupScore(address group, uint256 score) external;
  function setValidatorScore(address validator, uint256 score) external;
  function setScoreManager(address) external;
  function getScoreManager() external view returns (address);
}
