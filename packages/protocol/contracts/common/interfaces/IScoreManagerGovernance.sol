// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

// import "./IScoreManager.sol";
// TODO make import when everything is ported to Solidity 0.8

interface IScoreManagerGovernance {
  function setGroupScore(address group, uint256 score) external;
  function setValidatorScore(address validator, uint256 score) external;
  function setScoreManagerSetter(address) external;
  function getScoreManagerSetter() external view returns (address);
}
